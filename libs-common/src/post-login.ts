/**
 * Where a user goes after OTP verification.
 *
 * This is the resolution of Known Gotcha 2, in code, so the API and the app cannot drift
 * on it. docs/features/01-login-flow.md, 02-after-login-flow.md, 19-terms-acceptance-flow.md.
 *
 * The order is NOT arbitrary: Profile Completion collects name, email and UPI ID, and consent
 * must precede collecting personal data. Terms is always Gate 1.
 */

export type PostLoginDestination = 'accept-terms' | 'complete-profile' | 'home';

export interface PostLoginState {
  /** The terms version this user has on record, or null if they've accepted none. */
  acceptedTermsVersion: string | null;
  /** The currently published terms version. */
  currentTermsVersion: string;
  isProfileComplete: boolean;
}

/**
 * Gate 1 — terms. Fires for a new account AND for a returning user whose accepted version is
 * older than the current one, so it is a *version* check, not a new-account check.
 *
 * Gate 2 — profile completion.
 */
export function postLoginDestination(state: PostLoginState): PostLoginDestination {
  if (state.acceptedTermsVersion !== state.currentTermsVersion) {
    return 'accept-terms';
  }
  if (!state.isProfileComplete) {
    return 'complete-profile';
  }
  return 'home';
}
