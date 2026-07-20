# Post-Login Flow

## Overview
This document covers everything that happens **immediately after a successful login/OTP verification**, up to and including the Home screen where the user picks a role (Parker or Owner) for that session.

---

## Flow Diagram

```
LOGIN + OTP VERIFIED SUCCESSFULLY
              ↓
┌───────────────────────────────────────┐
│  CHECK: user.isProfileComplete?        │
└───────────────────────────────────────┘
              ↓
        FALSE            TRUE
          ↓                ↓
┌─────────────────────┐   │
│ PROFILE COMPLETION   │   │
│ SCREEN               │   │
├─────────────────────┤   │
│ - First name         │   │
│ - Last name           │   │
│ - Email address        │   │
│ - UPI ID                │   │
│   (for QR + auto-debit) │   │
│ - Country (auto-shown,  │   │
│   from login step)      │   │
│ - "Save & Continue"     │   │
└─────────────────────┘   │
          ↓                │
  PUT /users/me/complete-profile
  { firstName, lastName, email, upiId }
          ↓
  Backend:
    - Updates user record
    - Sets isProfileComplete = true
          ↓
          └────────────────┘
              ↓
┌───────────────────────────────────────┐
│              HOME SCREEN                │
│      (Role selection / dual mode)       │
├───────────────────────────────────────┤
│                                         │
│   ┌─────────────┐   ┌─────────────┐    │
│   │  BOOK A      │   │  MY SPACE    │    │
│   │  SPACE       │   │  (Manage &   │    │
│   │  (Parker)    │   │   Earn)      │    │
│   └─────────────┘   └─────────────┘    │
│                                         │
│   Bottom Nav: Home | Profile | Settings │
└───────────────────────────────────────┘
```

---

## Rule: Login Always Comes Before Profile Completion
- The Login + OTP Verify screens **never** ask for name/email/UPI.
- Profile Completion is a **separate, dedicated screen** shown only after OTP is verified, and only if `isProfileComplete` is `false`.
- Once completed, the flag flips to `true` permanently — the user is never asked again on subsequent logins.

---

## Profile Completion Screen — Fields

| Field | Required | Purpose |
|---|---|---|
| First Name | Yes | Display name across app |
| Last Name | Yes | Display name across app |
| Email | Yes | Weekly invoice delivery (Owner billing) |
| UPI ID | Yes | Exit QR code generation (Parker payment) + auto-debit mandate (Owner billing) |
| Country | Auto-filled (read-only) | Already captured at Login step |

> UPI ID is collected **once, here** — nowhere else in the app asks for payment details again.

---

## Home Screen — Dual Mode Entry Point

After profile completion (or directly, if already complete), the user lands on the **Home Screen**. This is the single hub from which the user chooses what they want to do *this session*:

- **Book a Space** → enters Parker mode → see `06-booking-flow.md`
- **My Space** → enters Owner mode → see `08-my-space-flow.md`

There is no locking into one role — the same user can go back to Home and switch to the other mode at any time. Both entry points are always visible on Home, regardless of whether the user owns a space yet or not.

- If the user has never added a space, tapping "My Space" leads them into the Add Space flow.
- If the user already has space(s), tapping "My Space" leads to the My Spaces Dashboard.

---

## Related Docs
- `01-login-flow.md` — Login & OTP steps before this
- `06-booking-flow.md` — What happens in Parker mode
- `08-my-space-flow.md` — What happens in Owner mode
- `14-billing-logic.md` — Owner billing details
