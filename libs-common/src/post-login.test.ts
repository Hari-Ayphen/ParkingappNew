import { describe, expect, it } from 'vitest';
import { postLoginDestination } from './post-login';

const CURRENT = '2026-07-01';

describe('postLoginDestination — Known Gotcha 2', () => {
  it('sends a brand-new user to terms first, not to profile', () => {
    expect(
      postLoginDestination({
        acceptedTermsVersion: null,
        currentTermsVersion: CURRENT,
        isProfileComplete: false,
      }),
    ).toBe('accept-terms');
  });

  it('sends a user who accepted terms but has no profile to profile completion', () => {
    expect(
      postLoginDestination({
        acceptedTermsVersion: CURRENT,
        currentTermsVersion: CURRENT,
        isProfileComplete: false,
      }),
    ).toBe('complete-profile');
  });

  it('sends a fully set-up user straight home', () => {
    expect(
      postLoginDestination({
        acceptedTermsVersion: CURRENT,
        currentTermsVersion: CURRENT,
        isProfileComplete: true,
      }),
    ).toBe('home');
  });

  it('re-gates a returning user when the terms version changes', () => {
    // The whole point of a version check rather than a new-account check.
    expect(
      postLoginDestination({
        acceptedTermsVersion: '2025-01-01',
        currentTermsVersion: CURRENT,
        isProfileComplete: true,
      }),
    ).toBe('accept-terms');
  });

  it('never lets profile completion precede terms, even for a complete profile', () => {
    // Consent must precede collecting personal data — the reason the order is fixed.
    const dest = postLoginDestination({
      acceptedTermsVersion: null,
      currentTermsVersion: CURRENT,
      isProfileComplete: true,
    });
    expect(dest).toBe('accept-terms');
    expect(dest).not.toBe('complete-profile');
  });
});
