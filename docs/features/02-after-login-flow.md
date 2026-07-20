# Post-Login Flow

- **Status:** agreed
- **Milestone:** `v0.1` (work items `v0.1-F` and `v0.1-H`)
- **Owner:** unassigned

## Overview
This document covers everything that happens **immediately after a successful login/OTP verification**, up to and including the Home screen where the user picks a role (Parker or Owner) for that session.

---

## Flow Diagram

```
LOGIN + OTP VERIFIED SUCCESSFULLY
              ↓
┌───────────────────────────────────────┐
│  GATE 1 — accepted the CURRENT terms   │
│  version? (19-terms-acceptance-flow)   │
│  NO → Accept Terms, then fall through  │
└───────────────────────────────────────┘
              ↓
┌───────────────────────────────────────┐
│  GATE 2 — user.isProfileComplete?      │
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

## Users & roles

| Role | What they can do here |
|---|---|
| Authenticated user, profile incomplete | Fill and save the Profile Completion form. Cannot reach Home until it is saved |
| Authenticated user, profile complete | Land on Home and enter Parker or Owner mode; switch between them freely |
| Admin | Nothing. Admin has no mobile Home screen and no profile completion step |

## User stories

### US-1 — Complete my profile once

As an **authenticated user with an incomplete profile**, I can **enter my name, email and UPI ID
on a dedicated screen** so that **the app has what it needs to show my QR and email my invoices**.

- **AC1:** Given `isProfileComplete` is false, when OTP verification succeeds, then I am routed to
  Profile Completion and cannot reach Home by navigating back.
- **AC2:** Given the form is open, when it renders, then Country is shown pre-filled from the
  login step and is read-only.
- **AC3:** Given any of first name, last name, email or UPI ID is empty, when I tap "Save &
  Continue", then the empty fields show inline errors and no request is sent.
- **AC4:** Given an email that is not a valid address, when I tap "Save & Continue", then the
  email field shows an inline error and no request is sent.
- **AC5:** Given all fields are valid, when I tap "Save & Continue", then `PUT
  /users/me/complete-profile` succeeds, `isProfileComplete` becomes true, and I land on Home.
- **AC6:** Given the save request fails, when the error returns, then I stay on the form with my
  entered values intact and can retry.

### US-2 — Never be asked again

As an **authenticated user with a complete profile**, I can **go straight to Home on every
subsequent login** so that **I'm not re-entering details I already gave**.

- **AC1:** Given `isProfileComplete` is true, when OTP verification succeeds, then I land on Home
  and Profile Completion is not shown.
- **AC2:** Given `isProfileComplete` is true, when I try to navigate to the Profile Completion
  route directly, then I am redirected to Home.
- **AC3:** Given I have completed my profile, when the flag is set, then it is never reset by any
  action in this flow.

### US-3 — Choose a mode from Home

As an **authenticated user**, I can **pick "Book a Space" or "My Space" from Home** so that **one
account serves both sides without a role choice at signup**.

- **AC1:** Given I am on Home, when it renders, then both "Book a Space" and "My Space" are
  visible regardless of whether I own a space.
- **AC2:** Given I tap "Book a Space", when navigation completes, then I enter Parker mode
  (`06-booking-flow.md`).
- **AC3:** Given I own no space, when I tap "My Space", then I enter the Add Space flow
  (`09-add-space-flow.md`).
- **AC4:** Given I own one or more spaces, when I tap "My Space", then I land on the My Spaces
  dashboard (`08-my-space-flow.md`).
- **AC5:** Given I am inside either mode, when I return to Home, then I can enter the other mode
  with no logout, no reload, and no confirmation.
- **AC6:** Given I am on Home, when it renders, then the bottom nav shows Home | Profile |
  Settings.

## Business rules

- **BR-1:** Login and Profile Completion are separate steps. Login screens never ask for name,
  email or UPI ID.
- **BR-2:** All four editable profile fields — first name, last name, email, UPI ID — are
  mandatory. There is no "skip for now".
- **BR-3:** `isProfileComplete` flips to true exactly once and is never flipped back by this flow.
- **BR-4:** UPI ID is collected here and nowhere else. No other screen in the app asks for payment
  details again.
- **BR-5:** The UPI ID serves two unrelated purposes — generating the Parker-facing QR, and
  identifying the Owner for the platform-fee autopay mandate. It is **not** a payment instrument
  SpotKey charges; SpotKey never moves Parker→Owner money.
- **BR-6:** Country is derived from the login step and is not editable here.
- **BR-7:** There is no role selection and no role column. The same account is both Parker and
  Owner; "mode" is a navigation choice per session, not stored state.
- **BR-8:** Home is always reachable from either mode. Entering a mode never locks the user into
  it.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `user` | changed | Populates `first_name`, `last_name`, `email`, `upi_id`; sets `is_profile_complete = true` |
| `country` | read-only | Country was resolved at login; displayed here, not written |

**Invariants this introduces:** `is_profile_complete = true` implies all four fields are non-null
— enforced at the write, not just in the form, so no code path can set the flag on a partial row.
Record in [`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Profile Completion | `/(auth)/complete-profile` | `pages/complete-profile.md` |
| Home (mode selection) | `/(tabs)/home` | `pages/home.md` |

## Out of scope

- **Login and OTP** — `01-login-flow.md`.
- **Terms acceptance** — `19-terms-acceptance-flow.md`.
- **Editing a profile after completion** — `15-profile-flow.md`.
- **Everything inside either mode** — `06-booking-flow.md` (Parker), `08-my-space-flow.md` (Owner).
- **The autopay mandate that later uses this UPI ID** — `23-upi-autopay-mandate-flow.md`.
- **Invoice content and delivery** — `14-billing-logic.md`.
- **Push permission prompt fired right after this screen** — `00-splash-onboarding-flow.md`.

## Open questions

- [x] ~~**Does Accept Terms sit between OTP verify and Profile Completion?**~~ **Resolved
      2026-07-20 (Known Gotcha 2):** yes — Terms is Gate 1, Profile Completion is Gate 2. Consent
      must precede collecting the name, email and UPI ID this screen asks for.
      `19-terms-acceptance-flow.md` is the authority; this doc's flow diagram is now updated.
- [ ] Is the UPI ID validated for format, and is it verified against a real VPA before being
      saved? A typo here silently breaks both the exit QR and the owner's mandate, and the doc is
      silent on both.
- [ ] Is `email` required to be unique across accounts? The doc makes it mandatory but says
      nothing about collisions.

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
