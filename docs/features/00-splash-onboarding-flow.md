# Splash / Onboarding / Permissions Flow

## Overview
What happens between the user tapping the app icon and reaching the Login screen (first install) or Home screen (returning user). Covers the splash screen, first-run intro slides, and the OS-level permission prompts the rest of the app depends on.

---

## Flow Diagram

```
APP ICON TAPPED
              ↓
┌─────────────────────────────┐
│           SPLASH SCREEN         │
│  - Logo, brief load (session       │
│    token check happens here)          │
└─────────────────────────────┘
              ↓
┌───────────────────────────────────────┐
│      IS THIS THE FIRST-EVER LAUNCH?     │
│      (local flag, not server-side)       │
└───────────────────────────────────────┘
        YES                      NO
         ↓                        ↓
┌─────────────────────┐   ┌─────────────────────────┐
│   ONBOARDING SLIDES   │   │  IS USER LOGGED IN?        │
│  (2-3 screens)          │   │  (see 01-login-flow.md)      │
│  - What SpotKey is         │   └─────────────────────────┘
│  - Book a space in min.       │
│  - List your space, earn         │
│  - "Get Started" button             │
└─────────────────────┘
         ↓
   Continue to Login
   (see 01-login-flow.md)
```

---

## Permission Requests (Requested Just-in-Time, Not All Upfront)

| Permission | Requested When | Used For | If Denied |
|---|---|---|---|
| **Location** | First time Map/Search screen opens | Centering the map, distance-based search/filters | Map falls back to a manually-entered location/city search; a persistent banner offers to enable it later |
| **Push Notifications** | Right after Profile Completion (first login only) | Booking alerts, session updates, invoice notices (see `18-notifications-flow.md`) | User can still use the app; re-prompted once from Settings, not repeatedly |
| **Camera** | First time Condition Check or Exit Verification photo is needed | Space condition photos during a session (see `06-booking-flow.md`, `12-exit-verification-flow.md`) | That step shows an inline "Camera access needed" state with a link to device settings |

---

## Key Behavior

| Element | Behavior |
|---|---|
| Onboarding slides | Shown once, ever, on first install — never shown again even after logout/reinstall on the same account (tracked locally, not server-side) |
| Session check | Splash screen is also where the stored JWT/refresh token is validated silently (see `01-login-flow.md` token handling) before deciding where to route the user |
| Permission philosophy | Never request a permission before the screen that needs it — asking for camera access on the splash screen (before the user has even booked anything) causes higher denial rates |

---

## Related Docs
- `01-login-flow.md` — Where this flow hands off to
- `04-map-search-flow.md` — Consumes the location permission
- `18-notifications-flow.md` — Consumes the push permission
