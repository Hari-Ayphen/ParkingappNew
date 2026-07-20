import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { postLoginDestination, type PostLoginDestination } from '@spotkey/common';
import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { db } from '../../db/client';
import { country, termsAcceptance, termsVersion, user } from '../../db/schema/identity';
import { shouldEchoOtp } from './otp.config';
import { InMemoryOtpStore, otpKey, type OtpStore } from './otp.store';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * `[DEVIATION — needs a decision]`
 *
 * CLAUDE.md states Better Auth owns `user` / `session` / `account` / `verification`.
 * This service issues its own tokens instead, because the product's only credential is a
 * phone + OTP and Better Auth's phone support would need wiring and a decision about which
 * side owns session state.
 *
 * The `user` table is already shaped to be Better-Auth-compatible (its columns are additive,
 * nothing renamed), so adopting it later is a migration rather than a rewrite. **This must be
 * resolved before v1.0** — running two session authorities is how sessions get orphaned.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface AuthTokens {
  token: string;
  refreshToken: string;
}

export interface VerifyOtpResult extends AuthTokens {
  userId: string;
  /** Where the client must route next. Resolution of Known Gotcha 2 — see @spotkey/common. */
  destination: PostLoginDestination;
  isProfileComplete: boolean;
}

@Injectable()
export class AuthService {
  constructor(private readonly otpStore: OtpStore = new InMemoryOtpStore()) {}

  /** Validates the phone against the country's own pattern, never a global regex. */
  private async assertValidPhone(countryId: string, phone: string): Promise<void> {
    const [row] = await db.select().from(country).where(eq(country.id, countryId)).limit(1);
    if (!row) throw new NotFoundException('Unknown country');
    if (!new RegExp(row.phonePattern).test(phone)) {
      throw new BadRequestException({
        message: 'Validation failed',
        validationErrors: { phone: `Not a valid ${row.name} phone number` },
      });
    }
  }

  async requestOtp(
    countryId: string,
    phone: string,
    nowMs: number = Date.now(),
  ): Promise<{ sent: true; cooldownRemainingSeconds: number; devOtp?: string }> {
    await this.assertValidPhone(countryId, phone);

    const { code, cooldownRemainingSeconds } = await this.otpStore.issue(
      otpKey(countryId, phone),
      nowMs,
    );

    // TODO(v0.1-D): dispatch via msg91. Until then the code is only echoed outside production.
    return {
      sent: true,
      cooldownRemainingSeconds,
      ...(shouldEchoOtp() ? { devOtp: code } : {}),
    };
  }

  async verifyOtp(
    countryId: string,
    phone: string,
    otp: string,
    nowMs: number = Date.now(),
  ): Promise<VerifyOtpResult> {
    const result = await this.otpStore.verify(otpKey(countryId, phone), otp, nowMs);
    if (!result.ok) {
      throw new BadRequestException({
        message: 'Could not verify that code',
        reason: result.reason,
        validationErrors: { otp: this.otpErrorMessage(result.reason) },
      });
    }

    const [existing] = await db.select().from(user).where(eq(user.phone, phone)).limit(1);

    let account = existing;
    if (!account) {
      const [created] = await db
        .insert(user)
        .values({ id: uuidv7(), phone, countryId, isProfileComplete: false })
        .returning();
      if (!created) {
        // An insert that returns nothing means the row did not land. Failing loudly beats
        // handing out a token for a user that does not exist.
        throw new BadRequestException('Could not create the account — please try again');
      }
      account = created;
    }

    const destination = await this.resolveDestination(account.id, account.isProfileComplete);

    return {
      userId: account.id,
      ...this.issueTokens(account.id),
      destination,
      isProfileComplete: account.isProfileComplete,
    };
  }

  /**
   * Gate 1 (terms) then Gate 2 (profile). The ordering rule itself lives in @spotkey/common
   * so the app and the API cannot disagree about it.
   */
  async resolveDestination(
    userId: string,
    isProfileComplete: boolean,
  ): Promise<PostLoginDestination> {
    const [current] = await db
      .select()
      .from(termsVersion)
      .orderBy(termsVersion.publishedAt)
      .limit(1);

    // No published terms yet: nothing to gate on.
    if (!current) return isProfileComplete ? 'home' : 'complete-profile';

    const accepted = await db
      .select({ version: termsVersion.version })
      .from(termsAcceptance)
      .innerJoin(termsVersion, eq(termsAcceptance.termsVersionId, termsVersion.id))
      .where(eq(termsAcceptance.userId, userId))
      .then((rows) => rows.map((r) => r.version));

    return postLoginDestination({
      acceptedTermsVersion: accepted.includes(current.version) ? current.version : null,
      currentTermsVersion: current.version,
      isProfileComplete,
    });
  }

  private otpErrorMessage(reason: string): string {
    switch (reason) {
      case 'expired':
        return 'That code has expired. Send a new one?';
      case 'too_many_attempts':
        return 'Too many attempts. Request a new code.';
      case 'no_code':
        return 'No code is waiting for this number. Send a new one?';
      default:
        return "That code doesn't match.";
    }
  }

  /**
   * `[PLACEHOLDER]` Real JWT signing lands with the Better Auth decision above.
   * Deliberately obvious rather than plausible — a fake that looks real is one that ships.
   */
  private issueTokens(userId: string): AuthTokens {
    return {
      token: `UNSIGNED-ACCESS-TOKEN-${userId}`,
      refreshToken: `UNSIGNED-REFRESH-TOKEN-${userId}`,
    };
  }
}
