/**
 * OTP policy.
 *
 * `[UNCONFIRMED]` — docs/features/01-login-flow.md leaves expiry, the attempt ceiling and the
 * rate limits open. These are working defaults chosen to be safe rather than convenient; they
 * are security-relevant and should be ratified before launch, not discovered in production.
 *
 * They live here as constants, not scattered through the service, so ratifying them is a
 * one-file change.
 */
export const OTP_POLICY = {
  length: 6,
  /** How long a code stays valid. */
  ttlSeconds: 5 * 60,
  /** Wrong guesses before the code is destroyed and a new one must be requested. */
  maxVerifyAttempts: 5,
  /** Resend is blocked until this has elapsed since the last send. */
  resendCooldownSeconds: 30,
  /** Requests per phone number per hour. */
  maxRequestsPerPhonePerHour: 5,
} as const;

/**
 * The dev OTP is echoed in the response ONLY outside production. Leaking it in production
 * makes every account trivially takeover-able (docs/features/01-login-flow.md BR-4).
 */
export function shouldEchoOtp(): boolean {
  return process.env.NODE_ENV !== 'production';
}
