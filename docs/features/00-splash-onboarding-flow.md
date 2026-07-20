# Splash / Onboarding / Permissions Flow

- **Status:** agreed
- **Milestone:** `v0.1` (work item `v0.1-G`)
- **Owner:** unassigned

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

## Users & roles

| Role | What they can do here |
|---|---|
| First-install user | See the splash, page through the onboarding slides, tap "Get Started" |
| Returning unauthenticated user | See the splash and be routed to Login — no slides |
| Returning authenticated user | See the splash and be routed to Home while the stored token is validated |
| Admin | Nothing. The admin panel is a desktop web app with no splash or onboarding |

## User stories

### US-1 — Land somewhere correct from a cold start

As a **user**, I can **open the app and be routed to the right screen automatically** so that **I
never see a screen I've already passed**.

- **AC1:** Given the local first-launch flag is unset, when the splash finishes, then I see the
  onboarding slides.
- **AC2:** Given the first-launch flag is set and no valid token exists, when the splash finishes,
  then I land on the Login screen (`01-login-flow.md`) and the slides are not shown.
- **AC3:** Given the first-launch flag is set and a valid session exists, when the splash
  finishes, then I land on Home without seeing Login.
- **AC4:** Given the access token is expired but the refresh token is valid, when the splash runs
  the session check, then the token is refreshed silently and I still land on Home.
- **AC5:** Given both tokens are expired, when the splash finishes, then I land on Login and the
  stored tokens are cleared.

### US-2 — See the intro once and never again

As a **first-install user**, I can **page through the onboarding slides and tap "Get Started"** so
that **I know what SpotKey does before being asked for my phone number**.

- **AC1:** Given I am on the first slide, when I swipe forward, then I advance through the slides
  in order and the final slide shows "Get Started".
- **AC2:** Given I tap "Get Started", when the app navigates, then the local first-launch flag is
  written and I land on Login.
- **AC3:** Given I have completed the slides once, when I log out and relaunch, then I go straight
  to Login with no slides.
- **AC4:** Given I kill the app mid-slides without reaching "Get Started", when I relaunch, then
  the slides are shown again from the start.

### US-3 — Grant location only when the map needs it

As a **Parker**, I can **be asked for location permission at the moment I open the map** so that
**I'm not asked for something before I know why**.

- **AC1:** Given I have never opened Map/Search, when the app launches or I sit on Home, then no
  location prompt appears.
- **AC2:** Given I open Map/Search for the first time, when the screen mounts, then the OS
  location prompt is shown.
- **AC3:** Given I deny location, when the map renders, then it falls back to manual
  location/city search and a persistent banner offers to enable location later.
- **AC4:** Given I already granted or denied location once, when I reopen Map/Search, then the OS
  prompt is not shown again.

### US-4 — Grant push right after finishing my profile

As a **user**, I can **be asked for push permission immediately after Profile Completion** so
that **I opt in when the app has just proven it has something to tell me**.

- **AC1:** Given I complete Profile Completion for the first time, when the save succeeds, then
  the OS push prompt is shown.
- **AC2:** Given I deny push, when I continue, then I reach Home with full app function and no
  repeat prompt on later launches.
- **AC3:** Given I denied push earlier, when I trigger the re-prompt from Settings, then it is
  offered once from there and not automatically thereafter.

### US-5 — Grant camera at the first photo step

As a **Parker**, I can **be asked for camera permission when a photo is actually required** so
that **camera access is never requested before I've booked anything**.

- **AC1:** Given I reach a Condition Check or Exit Verification photo step for the first time,
  when the capture UI opens, then the OS camera prompt is shown.
- **AC2:** Given I deny camera, when the photo step renders, then it shows an inline "Camera
  access needed" state with a link to device settings.
- **AC3:** Given I have not reached a photo step, when I use any other part of the app, then no
  camera prompt appears.

## Business rules

- **BR-1:** No permission is requested on the splash screen or during onboarding. Each permission
  is requested by the screen that consumes it, at the moment it consumes it — asking early raises
  denial rates and the denial is sticky.
- **BR-2:** The first-launch flag is **local to the install**, not server-side. Onboarding is a
  property of the device, not the account. It therefore **survives logout but not reinstall**, and
  the slides may legitimately be seen more than once by the same person.

  > **A server-side flag is not merely undesirable here — it is impossible.** Onboarding runs
  > *before* Login (BR-3), so on the first launch after a reinstall the app does not yet know who
  > the user is. There is no account to key a server flag on. Storing it server-side would require
  > authenticating first, which inverts the flow this document specifies.
  >
  > The cost of accepting this is small: a returning user who reinstalls sees two or three intro
  > slides again. The cost of "fixing" it is making every user log in before they are told what
  > the app does.
- **BR-3:** The onboarding slides are shown only before Login, never between Login and Home.
- **BR-4:** The splash performs the session check silently. It never renders a login form, an
  error dialog, or a permission prompt.
- **BR-5:** A denied permission degrades the dependent feature to a documented fallback; it never
  blocks the app or loops the prompt.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| — | none | This flow creates and changes no server data |
| — | device-local, not a table | First-launch flag lives in on-device storage alongside nothing else |
| — | read-only | Reads the tokens written by `01-login-flow.md` from SecureStore |

**Invariants this introduces:** none at the database layer. The one invariant is client-side —
onboarding state is per-install and must never be inferred from, or written to, the `user` row.

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Splash | `/` (root gate) | `pages/splash.md` |
| Onboarding slides | `/(onboarding)/intro` | `pages/onboarding.md` |

## Out of scope

- **Login and OTP** — `01-login-flow.md`.
- **Profile Completion and Home routing** — `02-after-login-flow.md`.
- **Terms acceptance** — `19-terms-acceptance-flow.md`.
- **What the map does with the location grant** — `04-map-search-flow.md`.
- **What is pushed and when** — `18-notifications-flow.md`.
- **The photo steps themselves** — `06-booking-flow.md`, `12-exit-verification-flow.md`.
- **App-store / force-update gating.** Not specified anywhere.

## Open questions

- [x] ~~The reinstall claim contradicts the local flag.~~ **Resolved 2026-07-20:** the storage is
      right, the claim was wrong. Slides survive logout, not reinstall. A server-side flag is
      impossible because onboarding precedes login — see BR-2.
- [ ] Number of onboarding slides — "2-3 screens" is a range, not a decision.
- [ ] What the splash does when the session check cannot reach the API (offline / API down):
      route to Login, retry, or show an offline state? Unspecified, and it decides whether an
      offline launch silently logs a user out.

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
| Onboarding slides | Shown once per install. **Survives logout** — logging out never replays them. **Does not survive reinstall** — a reinstall wipes the local flag and the slides show again. This is accepted, not a bug; see BR-2 |
| Session check | Splash screen is also where the stored JWT/refresh token is validated silently (see `01-login-flow.md` token handling) before deciding where to route the user |
| Permission philosophy | Never request a permission before the screen that needs it — asking for camera access on the splash screen (before the user has even booked anything) causes higher denial rates |

---

## Related Docs
- `01-login-flow.md` — Where this flow hands off to
- `04-map-search-flow.md` — Consumes the location permission
- `18-notifications-flow.md` — Consumes the push permission
