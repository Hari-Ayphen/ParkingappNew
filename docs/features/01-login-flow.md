# Mobile App — Authentication Flow

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
        │   CHECK: user.isProfileComplete?     │
        └─────────────────────────────────────┘
              │
              ├── FALSE → Go to Profile Completion
              │           (see POST_LOGIN_FLOW.md)
              │
              └── TRUE  → Go directly to Home Screen
                          (see POST_LOGIN_FLOW.md)
```

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
