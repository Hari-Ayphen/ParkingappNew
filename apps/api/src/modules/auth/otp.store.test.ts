import { describe, expect, it } from 'vitest';
import { OTP_POLICY } from './otp.config';
import { generateOtp, InMemoryOtpStore, otpKey } from './otp.store';

const KEY = otpKey('country-in', '9876543210');
const T0 = 1_700_000_000_000;

describe('generateOtp', () => {
  it('is always the configured length, zero-padded', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateOtp();
      expect(code).toHaveLength(OTP_POLICY.length);
      expect(code).toMatch(/^\d+$/);
    }
  });
});

describe('OTP lifecycle', () => {
  it('issues a code and verifies it once', async () => {
    const store = new InMemoryOtpStore();
    const { code } = await store.issue(KEY, T0);
    expect(await store.verify(KEY, code, T0 + 1000)).toEqual({ ok: true });
  });

  it('consumes the code — a correct code cannot be replayed', async () => {
    const store = new InMemoryOtpStore();
    const { code } = await store.issue(KEY, T0);
    await store.verify(KEY, code, T0 + 1000);
    expect(await store.verify(KEY, code, T0 + 2000)).toEqual({ ok: false, reason: 'no_code' });
  });

  it('expires the code after the TTL', async () => {
    const store = new InMemoryOtpStore();
    const { code } = await store.issue(KEY, T0);
    const afterTtl = T0 + OTP_POLICY.ttlSeconds * 1000 + 1;
    expect(await store.verify(KEY, code, afterTtl)).toEqual({ ok: false, reason: 'expired' });
  });

  it('rejects a wrong code without consuming the right one', async () => {
    const store = new InMemoryOtpStore();
    const { code } = await store.issue(KEY, T0);
    const wrong = code === '000000' ? '111111' : '000000';
    expect(await store.verify(KEY, wrong, T0 + 1000)).toEqual({ ok: false, reason: 'wrong_code' });
    expect(await store.verify(KEY, code, T0 + 2000)).toEqual({ ok: true });
  });

  it('destroys the code once the attempt ceiling is hit — brute force must not survive', async () => {
    const store = new InMemoryOtpStore();
    const { code } = await store.issue(KEY, T0);
    const wrong = code === '000000' ? '111111' : '000000';

    for (let i = 0; i < OTP_POLICY.maxVerifyAttempts - 1; i += 1) {
      expect(await store.verify(KEY, wrong, T0 + 1000)).toEqual({
        ok: false,
        reason: 'wrong_code',
      });
    }
    // The ceiling attempt reports too_many_attempts...
    expect(await store.verify(KEY, wrong, T0 + 1000)).toEqual({
      ok: false,
      reason: 'too_many_attempts',
    });
    // ...and the correct code no longer works, because the record is gone.
    expect(await store.verify(KEY, code, T0 + 1000)).toEqual({ ok: false, reason: 'no_code' });
  });

  it('returns the same code inside the resend cooldown rather than issuing a new one', async () => {
    const store = new InMemoryOtpStore();
    const first = await store.issue(KEY, T0);
    const second = await store.issue(KEY, T0 + 5_000);
    expect(second.code).toBe(first.code);
    expect(second.cooldownRemainingSeconds).toBeGreaterThan(0);
  });

  it('issues a fresh code once the cooldown has elapsed', async () => {
    const store = new InMemoryOtpStore();
    await store.issue(KEY, T0);
    const after = T0 + (OTP_POLICY.resendCooldownSeconds + 1) * 1000;
    const second = await store.issue(KEY, after);
    expect(second.cooldownRemainingSeconds).toBe(0);
  });

  it('verifying an unknown key reports no_code, not a crash', async () => {
    const store = new InMemoryOtpStore();
    expect(await store.verify('otp:nobody', '123456', T0)).toEqual({
      ok: false,
      reason: 'no_code',
    });
  });
});
