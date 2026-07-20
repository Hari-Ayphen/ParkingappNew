# Terms Acceptance Flow

## Overview
The explicit "I agree to the Terms & Privacy Policy" step, required once per account before the user can proceed past OTP verification. This is a compliance step, not a UX nicety — it must be logged with a timestamp for legal purposes.

---

## Flow Diagram

```
VERIFY OTP → OTP verified successfully
              ↓
┌───────────────────────────────────────┐
│   IS THIS A NEW ACCOUNT?                 │
│   (no prior accepted-terms record)          │
└───────────────────────────────────────┘
        YES                      NO
         ↓                        ↓
┌─────────────────────┐   Skip straight to
│   ACCEPT TERMS         │   Profile Completion /
│   SCREEN                  │   Home (see 02-after-login-flow.md)
├─────────────────────┤
│  - Summary text            │
│  - "Terms of Service"         │
│    link (opens in-app browser)  │
│  - "Privacy Policy" link            │
│  - Checkbox: "I agree to the           │
│    Terms & Privacy Policy"                │
│  - "Continue" (disabled until               │
│    checkbox is checked)                        │
└─────────────────────┘
         ↓
   POST /auth/accept-terms
   { userId, termsVersion, timestamp }
         ↓
   Continue to Profile Completion
   (see 02-after-login-flow.md)
```

---

## Key Behavior

| Element | Behavior |
|---|---|
| Shown once per account | Not shown again on subsequent logins, unless the terms version changes (see below) |
| Terms versioning | Each published Terms/Privacy update has a version id; if a returning user's accepted version is older than current, they see this screen again before Home |
| Compliance record | The accepted timestamp + terms version is stored permanently against the user — this is the audit trail, not just a UI gate |
| Cannot be skipped | There is no "decline" path that lets the user continue — declining logs the user out back to Login |

---

## API Touchpoints (indicative)
- `GET /legal/terms-version` — current published version
- `POST /auth/accept-terms` — records acceptance

---

## Related Docs
- `01-login-flow.md` — Where this sits, right after OTP verification
- `02-after-login-flow.md` — What comes after acceptance
