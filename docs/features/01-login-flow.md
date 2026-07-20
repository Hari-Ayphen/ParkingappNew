# Mobile App — Authentication Flow

- **Status:** agreed
- **Milestone:** `v0.1` (work item `v0.1-D`)
- **Owner:** unassigned

## Overview
SpotKey uses **OTP-based phone authentication** — no passwords for the mobile app. This is the very first thing every user goes through, regardless of which role (Parker/Owner) they intend to use later.

**Important:** Login happens BEFORE profile completion. Profile completion is a separate, later step — never merged into the login screen itself.

---

## Step-by-Step Flow

```
APP OPENED
    ↓
IS USER LOGGED IN? (check stored token)
    │
    ├── YES → Skip to POST_LOGIN_FLOW.md
    │
    └── NO  → Continue below
              ↓
        ┌─────────────────────────┐
        │      LOGIN SCREEN       │
        ├─────────────────────────┤
        │  - Country picker       │
        │    (flag + dial code)   │
        │  - Phone number input   │
        │  - "Send OTP" button    │
        └─────────────────────────┘
              ↓
        User enters phone → taps Send OTP
              ↓
        POST /auth/request-otp
        { phone, countryId }
              ↓
        Backend:
          - Validates phone format for country
          - Generates 6-digit OTP
          - Sends via SMS provider
          - Returns success (+ devOtp in dev/staging only)
              ↓
        ┌─────────────────────────┐
        │    VERIFY OTP SCREEN    │
        ├─────────────────────────┤
        │  - 6-digit OTP input    │
        │  - Countdown timer      │
        │  - Resend OTP option    │
        │  - Edit phone number    │
        └─────────────────────────┘
              ↓
        User enters OTP → taps Verify
              ↓
        POST /auth/verify-otp
        { phone, countryId, otp }
              ↓
        Backend:
          - Validates OTP (correct + not expired)
          - Creates user record if new (isProfileComplete = false)
          - Fetches user record if existing
          - Generates JWT access token (7-day expiry)
          - Generates refresh token (30-day expiry)
              ↓
        Response: { token, refreshToken, user }
              ↓
        Mobile app:
          - Stores token + refreshToken (SecureStore)
          - Stores user object (Zustand store)
              ↓
        ┌─────────────────────────────────────┐
        │  GATE 1 — has the user accepted the  │
        │  CURRENT terms version?              │
        └─────────────────────────────────────┘
              │
              ├── NO  → ACCEPT TERMS screen
              │         (see 19-terms-acceptance-flow.md)
              │         → records acceptance, then falls through
              │
              └── YES ↓
        ┌─────────────────────────────────────┐
        │  GATE 2 — user.isProfileComplete?    │
        └─────────────────────────────────────┘
              │
              ├── FALSE → Profile Completion
              │           (see 02-after-login-flow.md)
              │
              └── TRUE  → Home Screen
                          (see 02-after-login-flow.md)
```

> **Terms comes before Profile Completion, always.** Profile Completion collects name, email and
> UPI ID. Collecting personal data *before* the user has accepted the privacy policy that governs
> its processing is backwards — consent precedes collection, not the other way round.
>
> Gate 1 also fires for **returning** users whose accepted version is older than the current one
> (`19-terms-acceptance-flow.md`), so it is a version check, not a new-account check.

---

## Users & roles

| Role | What they can do here |
|---|---|
| Unauthenticated visitor | Enter a phone number, request an OTP, verify it |
| Authenticated user | Nothing — already past this flow; relaunching silently refreshes instead |
| Admin | Nothing. Admin authenticates separately on the desktop panel, not by OTP |

## User stories

### US-1 — Request an OTP

As an **unauthenticated visitor**, I can **enter my country and phone number and request a
one-time code** so that **I can prove I own the number without a password**.

- **AC1:** Given a valid phone for the selected country, when I tap "Send OTP", then a 6-digit
  code is sent by SMS and I land on the Verify screen.
- **AC2:** Given a phone that fails the country's format rule, when I tap "Send OTP", then the
  field shows an inline error and no SMS is sent.
- **AC3:** Given I have exceeded the rate limit, when I tap "Send OTP", then I see a "too many
  attempts, try again in N minutes" message and no SMS is sent.
- **AC4:** Given the app is running in dev or staging, when the OTP is generated, then it is
  returned in the response body; in production it never is.

### US-2 — Verify an OTP and get signed in

As an **unauthenticated visitor**, I can **enter the code I received** so that **I get a session
and reach the app**.

- **AC1:** Given a correct, unexpired OTP, when I tap "Verify", then I receive an access token
  (7d) and refresh token (30d), both stored in SecureStore.
- **AC2:** Given this is my first successful verify, when the tokens are issued, then a `user`
  row exists with `is_profile_complete = false`.
- **AC3:** Given an incorrect OTP, when I tap "Verify", then I see an error, remain on the
  screen, and my attempt is counted.
- **AC4:** Given an expired OTP, when I tap "Verify", then I am told it expired and offered a
  resend.
- **AC5:** Given too many failed attempts, when I tap "Verify", then the code is invalidated and
  I must request a new one.

### US-3 — Resend a code, or fix a wrong number

As an **unauthenticated visitor**, I can **resend the code after a countdown, or go back and
correct my number** so that **a mistyped number or an undelivered SMS doesn't trap me**.

- **AC1:** Given I am on the Verify screen, when it opens, then "Resend" is disabled and a
  countdown runs.
- **AC2:** Given the countdown has finished, when I tap "Resend", then a new OTP is issued and
  the countdown restarts.
- **AC3:** Given I tap "Edit phone number", when I return to Login, then no previously entered
  OTP is retained.

### US-4 — Stay signed in across launches

As an **authenticated user**, I can **reopen the app without logging in again** so that **I'm not
re-authenticating every week**.

- **AC1:** Given a valid access token, when the app launches, then I skip login entirely.
- **AC2:** Given an expired access token but a valid refresh token, when the app launches, then a
  new access token is obtained silently with no visible login step.
- **AC3:** Given both tokens are expired, when the app launches, then I am returned to the Login
  screen and stored tokens are cleared.

## Business rules

- **BR-1:** Login and profile completion are **separate steps**, never merged into one screen. A
  user may exist, fully authenticated, with `is_profile_complete = false`.
- **BR-2:** Phone number format is validated per country, using the pattern on the `country`
  lookup row — not a single global regex.
- **BR-3:** An OTP is 6 digits, single-use, and expires. It is invalidated on success, on
  expiry, or after N failed attempts.
- **BR-4:** The development OTP is returned in the response **only** in dev and staging. Leaking
  it in production would make every account trivially takeover-able.
- **BR-5:** Access token 7 days, refresh token 30 days, both in SecureStore — never
  AsyncStorage, which is unencrypted.
- **BR-6:** A verified phone number cannot be changed from this flow. Changing it needs a
  re-verification flow that does not yet exist.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `user` | new | Better Auth's table, extended with `phone`, `country_id`, `is_profile_complete` |
| `country` | new (seed) | Dial code, phone-validation pattern, plate pattern |
| — | Redis, not a table | OTP + attempt counters live in Redis with a TTL — they expire in minutes and must not accumulate |

**Invariants this introduces:** a user is uniquely identified by (`country_id`, `phone`) —
enforced by a unique index. Recorded in [`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Login | `/(auth)/login` | `pages/login.md` |
| Verify OTP | `/(auth)/verify` | `pages/verify-otp.md` |

## Out of scope

- **Password or social login.** OTP is the only mechanism.
- **Changing a verified phone number** — needs its own re-verification flow.
- **Terms acceptance** — separate feature, `19-terms-acceptance-flow.md`.
- **Profile completion** — separate feature, `02-after-login-flow.md`.
- **Admin authentication** — the desktop panel does not use OTP.
- **Account recovery** — there is nothing to recover; the phone *is* the identity.

## Open questions

- [ ] OTP expiry duration and the failed-attempt ceiling — not specified anywhere.
- [ ] Rate-limit thresholds for `request-otp`, per phone and per IP.
- [x] ~~**Does Accept Terms sit between verify and profile completion?**~~ **Resolved 2026-07-20
      (Known Gotcha 2):** yes. Terms is Gate 1, Profile Completion is Gate 2 — consent must precede
      collecting the personal data on the profile screen. `19-terms-acceptance-flow.md` is the
      authority; this doc and `02` were stale and are now updated.

---

## Screens in This Flow

### 1. LOGIN Screen
| Element | Detail |
|---|---|
| Country picker | Dropdown with flag, dial code, country name |
| Phone input | Numeric, validated per country rules |
| Primary action | "Send OTP" → calls `POST /auth/request-otp` |
| Errors handled | Invalid phone format, rate limit (429), network error |

### 2. VERIFY OTP Screen
| Element | Detail |
|---|---|
| OTP input | 6 boxes / single field, numeric |
| Resend | Enabled after countdown (e.g. 30s), re-calls request-otp |
| Edit phone | Navigates back to Login, preserves nothing |
| Primary action | "Verify" → calls `POST /auth/verify-otp` |
| Errors handled | Wrong OTP, expired OTP, network error, too many attempts |

---

## Token Handling

| Token | Lifetime | Storage | Purpose |
|---|---|---|---|
| Access token (JWT) | 7 days | SecureStore | Sent with every API call (Authorization header) |
| Refresh token | 30 days | SecureStore | Used to silently get a new access token when expired |

- On app launch, if access token is expired but refresh token is valid → silently refresh, no re-login needed.
- If refresh token is also expired → force logout → back to Login screen.

---

## Key Rule
**Login (phone + OTP) always happens first, and is fully separate from Profile Completion.** A user can technically have a verified phone/account with `isProfileComplete = false` — they're logged in, but the app will route them to complete their profile before letting them use Search/Book or My Spaces fully (see `02-after-login-flow.md`).

---

## Related Docs
- `../overview/product.md` — App overview
- `02-after-login-flow.md` — What happens right after successful login
