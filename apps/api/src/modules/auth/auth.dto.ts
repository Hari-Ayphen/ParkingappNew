import { z } from 'zod';

/**
 * Request validation. Cross-field rules live here (Zod `.refine()`), not in the service —
 * CLAUDE.md → Backend conventions.
 *
 * Phone format is NOT validated here beyond shape: the real rule is per-country and lives on
 * the `country` row (docs/features/01-login-flow.md BR-2). A single global regex would reject
 * valid numbers the moment a second country is added.
 */

export const requestOtpSchema = z.object({
  countryId: z.string().uuid(),
  phone: z
    .string()
    .trim()
    .min(4)
    .max(20)
    .regex(/^\d+$/, 'Phone must contain digits only — no spaces, dashes or dial code'),
});
export type RequestOtpDto = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  countryId: z.string().uuid(),
  phone: z.string().trim().min(4).max(20),
  otp: z.string().regex(/^\d{6}$/, 'OTP is 6 digits'),
});
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;

export const acceptTermsSchema = z.object({
  termsVersion: z.string().min(1),
});
export type AcceptTermsDto = z.infer<typeof acceptTermsSchema>;

export const completeProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  /**
   * UPI ID (a VPA like `name@bank`). Shape-checked only — SpotKey does not verify it resolves.
   * `[OPEN]` docs/features/02-after-login-flow.md: a typo here silently breaks BOTH the exit QR
   * a parker scans AND the owner's autopay mandate, and neither failure surfaces until money is
   * supposed to move. Whether to verify against the UPI network is unresolved.
   */
  upiId: z
    .string()
    .trim()
    .regex(/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/, 'Enter a valid UPI ID, e.g. name@bank'),
});
export type CompleteProfileDto = z.infer<typeof completeProfileSchema>;
