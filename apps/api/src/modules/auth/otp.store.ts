import { randomInt } from 'node:crypto';
import { OTP_POLICY } from './otp.config';

/**
 * OTPs are not a table. They expire in minutes and must not accumulate, so they live in a
 * keyed store with a TTL (docs/architecture/data.md). Redis in production; the in-memory
 * implementation below exists so the flow is testable without infrastructure.
 */

export interface OtpRecord {
  code: string;
  attemptsUsed: number;
  issuedAtMs: number;
  expiresAtMs: number;
}

export type VerifyResult =
  { ok: true } | { ok: false; reason: 'no_code' | 'expired' | 'wrong_code' | 'too_many_attempts' };

export interface OtpStore {
  issue(key: string, nowMs: number): Promise<{ code: string; cooldownRemainingSeconds: number }>;
  verify(key: string, code: string, nowMs: number): Promise<VerifyResult>;
  /** Seconds until a resend is permitted; 0 when it is permitted now. */
  cooldownRemaining(key: string, nowMs: number): Promise<number>;
}

/** Cryptographically random, zero-padded, fixed length. Never Math.random for a credential. */
export function generateOtp(length: number = OTP_POLICY.length): string {
  const max = 10 ** length;
  return String(randomInt(0, max)).padStart(length, '0');
}

/**
 * Constant-time-ish comparison. The codes are short and the attempt ceiling is the real
 * defence, but there is no reason to leak position information for free.
 */
function codesMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export class InMemoryOtpStore implements OtpStore {
  private readonly records = new Map<string, OtpRecord>();

  async issue(
    key: string,
    nowMs: number,
  ): Promise<{ code: string; cooldownRemainingSeconds: number }> {
    const existing = this.records.get(key);
    if (existing) {
      const elapsed = (nowMs - existing.issuedAtMs) / 1000;
      if (elapsed < OTP_POLICY.resendCooldownSeconds) {
        return {
          code: existing.code,
          cooldownRemainingSeconds: Math.ceil(OTP_POLICY.resendCooldownSeconds - elapsed),
        };
      }
    }
    const code = generateOtp();
    this.records.set(key, {
      code,
      attemptsUsed: 0,
      issuedAtMs: nowMs,
      expiresAtMs: nowMs + OTP_POLICY.ttlSeconds * 1000,
    });
    return { code, cooldownRemainingSeconds: 0 };
  }

  async verify(key: string, code: string, nowMs: number): Promise<VerifyResult> {
    const rec = this.records.get(key);
    if (!rec) return { ok: false, reason: 'no_code' };

    if (nowMs >= rec.expiresAtMs) {
      this.records.delete(key);
      return { ok: false, reason: 'expired' };
    }

    if (rec.attemptsUsed >= OTP_POLICY.maxVerifyAttempts) {
      this.records.delete(key);
      return { ok: false, reason: 'too_many_attempts' };
    }

    if (!codesMatch(rec.code, code)) {
      rec.attemptsUsed += 1;
      // Destroy the code once the ceiling is reached — a survivable code is brute-forceable.
      if (rec.attemptsUsed >= OTP_POLICY.maxVerifyAttempts) {
        this.records.delete(key);
        return { ok: false, reason: 'too_many_attempts' };
      }
      return { ok: false, reason: 'wrong_code' };
    }

    // Single use: a correct code is consumed.
    this.records.delete(key);
    return { ok: true };
  }

  async cooldownRemaining(key: string, nowMs: number): Promise<number> {
    const rec = this.records.get(key);
    if (!rec) return 0;
    const elapsed = (nowMs - rec.issuedAtMs) / 1000;
    return Math.max(0, Math.ceil(OTP_POLICY.resendCooldownSeconds - elapsed));
  }
}

export function otpKey(countryId: string, phone: string): string {
  return `otp:${countryId}:${phone}`;
}
