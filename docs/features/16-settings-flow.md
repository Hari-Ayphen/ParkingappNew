# Settings Flow

- **Status:** agreed
- **Milestone:** `v1.0` (work item `v1.0-A`)
- **Owner:** unassigned

## Overview
App-level preferences — distinct from Profile (personal info). Covers theme, notifications, and language.

---

## Flow Diagram

```
HOME → Bottom nav "Settings" tapped
              ↓
┌─────────────────────────────────────┐
│               SETTINGS                  │
├─────────────────────────────────────┤
│  Appearance                               │
│    - Theme: Light / Dark / System            │
│                                                  │
│  Notifications                                     │
│    - Push notifications: On/Off                      │
│    - Booking request alerts: On/Off                      │
│    - Invoice/billing alerts: On/Off                          │
│    - WhatsApp notifications: On/Off                              │
│                                                                       │
│  Language                                                               │
│    - App language selector                                                 │
│      (English default; see note below)                                        │
│                                                                                    │
│  Account                                                                            │
│    - Log out                                                                          │
│    - Delete account (with confirmation flow)                                             │
└─────────────────────────────────────┘
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Authenticated user (either mode) | Set theme, toggle notification channels, log out, request account deletion |
| Unauthenticated visitor | Nothing — the screen is behind auth |
| Admin | Nothing from this screen. Admin suspension/restriction notices are sent regardless of any toggle here |

## User stories

### US-1 — Choose a theme

As an **authenticated user**, I can **set the app to Light, Dark or System** so that **the screen
is readable in a dark car at night**.

- **AC1:** Given Settings is open, when I select Light, Dark or System, then the app repaints
  immediately without a restart.
- **AC2:** Given I selected Dark, when I close and relaunch the app, then Dark is still applied.
- **AC3:** Given I selected System and the OS switches to dark, when I return to the app, then it
  follows the OS.
- **AC4:** Given a fresh install with no choice made, when the app first renders, then System is
  the default.

### US-2 — Turn push notifications on or off

As an **authenticated user**, I can **turn the push master switch off** so that **the app stops
buzzing me when I'm not using it**.

- **AC1:** Given push is on, when I turn the master switch off, then no push of any category is
  delivered.
- **AC2:** Given the master switch is off, when I view the per-category toggles, then they are
  visibly disabled or clearly shown as having no effect.
- **AC3:** Given OS-level notification permission was never granted, when I turn the master
  switch on, then the OS permission is requested at that moment.
- **AC4:** Given I denied the OS permission, when I return to Settings, then the screen explains
  that push is blocked at the OS level and links to system settings.

### US-3 — Tune notifications per category

As an **authenticated user**, I can **keep booking alerts on while turning billing pushes off**
so that **I only get the alerts I act on**.

- **AC1:** Given booking request alerts are on and billing alerts are off, when an invoice is
  raised, then I receive no billing push but the booking alerts still arrive.
- **AC2:** Given billing alerts are off, when an invoice is raised, then the **invoice email is
  still sent** — the toggle only stops the redundant push.
- **AC3:** Given every toggle on this screen is off, when an OTP is requested, then the OTP is
  still delivered.
- **AC4:** Given every toggle on this screen is off, when an admin suspends or restricts my
  account, then I am still notified.
- **AC5:** Given I change a toggle, when `PUT /users/me/preferences` succeeds, then the new value
  survives a relaunch.

### US-4 — Control WhatsApp notifications

As an **authenticated user**, I can **turn WhatsApp notifications off** so that **I'm not
messaged on a channel I don't use for this**.

- **AC1:** Given the WhatsApp toggle is off, when a notification that supports WhatsApp fires,
  then it is not sent over WhatsApp.
- **AC2:** Given the WhatsApp toggle is off, when an invoice is raised, then the invoice email is
  still sent.
- **AC3:** Given I turn WhatsApp on, when the preference saves, then subsequent WhatsApp-capable
  notifications are delivered on that channel.

### US-5 — See that the app is English-only

As an **authenticated user**, I can **see the language setting reflect that English is the only
option** so that **I'm not left waiting for a translation that isn't coming**.

- **AC1:** Given Settings is open, when I look at Language, then English is shown as the current
  and only value.
- **AC2:** Given the Language row, when I tap it, then no other language can be selected.

### US-6 — Log out

As an **authenticated user**, I can **log out** so that **my session doesn't stay on a device I'm
handing over or done with**.

- **AC1:** Given I tap "Log out" and confirm, when logout completes, then the access and refresh
  tokens are cleared from SecureStore.
- **AC2:** Given logout completed, when the app navigates, then I land on the Login screen.
- **AC3:** Given I relaunch after logging out, when the app starts, then I am asked to log in
  again.
- **AC4:** Given I tap "Log out" and cancel the confirmation, when I return, then I am still
  signed in.

### US-7 — Request account deletion

As an **authenticated user**, I can **request that my account be deleted** so that **I can leave
the platform**.

- **AC1:** Given I tap "Delete account", when the confirmation appears, then it states what is
  removed and requires an explicit confirming action — not a single tap.
- **AC2:** Given I cancel the confirmation, when I return, then nothing is deleted and I am still
  signed in.
- **AC3:** Given deletion proceeds, when it completes, then my tokens are cleared and I land on
  the Login screen.

> The behaviour of US-7 when a billing cycle is active or an auto-debit is pending is **not
> defined** — see Open questions. Do not implement US-7 for owner accounts before that is
> resolved.

## Business rules

- **BR-1:** Theme supports **Light / Dark / System**, defaults to System, and persists across
  launches. Dark mode is not cosmetic — the app is used at night, inside cars.
- **BR-2:** Notification preferences are **granular per category**, with three exceptions that
  are never suppressible: **the login OTP**, **the invoice email**, and **admin
  suspension/restriction notices**.
- **BR-3:** Turning off billing alerts stops the **redundant push only**. The invoice email is
  always sent — it is financially required, and suppressing it would leave a user billed with no
  record of it.
- **BR-4:** Admin account-status notices bypass every preference. A user who has muted everything
  must still learn their account was restricted.
- **BR-5:** The push master switch gates all categories. Turning it off makes per-category values
  moot but does not erase them — turning it back on restores the previous selections.
- **BR-6:** The app is **English-only**. There is no i18n framework and no second locale.
  Multi-language is future scope, not built.
- **BR-7:** Log out clears both tokens from SecureStore. Leaving a refresh token behind would let
  the next holder of the device silently resume the session.
- **BR-8:** Settings holds **app preferences only**. Personal information lives in
  `15-profile-flow.md`.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `user_preference` | new | One row per user: theme, push master, per-category flags, WhatsApp flag |
| `notification_category` | new (seed) | Lookup table of categories — a status/enum set, so a table + FK, not a text enum |
| `user` | read | Identifies the preference owner |

**Invariants this introduces:** exactly one preference row per user; the always-on notifications
(OTP, invoice email, admin account-status) have **no** preference row and cannot be represented as
one. Recorded in [`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Settings | `/(tabs)/settings` | `pages/settings.md` |
| Delete account confirmation | `/(tabs)/settings/delete-account` | `pages/delete-account.md` |

## Out of scope

- **Multi-language / i18n.** English only; not built, not stubbed.
- **Editing personal info** — name, email, photo, UPI ID are `15-profile-flow.md`.
- **The delivery mechanics of each notification** — that is `18-notifications-flow.md`.
- **Per-space or per-booking notification muting.** Preferences here are account-wide.
- **Data export / "download my data"** — not specified.
- **Any way to disable the OTP, the invoice email, or admin account-status notices.**
- **Deleting an account that has an active billing cycle or pending auto-debit** — unresolved,
  see Open questions.

## Open questions

- [ ] **What happens when an account with an active billing cycle or a pending auto-debit is
      deleted?** Whether deletion is blocked, deferred to cycle end, or proceeds with the debt
      outstanding is undecided. *(Known Gotcha 8 — must be resolved before US-7 is built for
      owner accounts.)*
- [ ] Is deletion immediate and hard, or soft with a grace period? This decides whether `user`
      needs `deleted_at`.
- [ ] What happens to an owner's listed spaces and a parker's in-flight bookings on deletion?
- [ ] The exact category list behind the toggles — this doc names four, `18-notifications-flow.md`
      may name more. They must agree before the lookup table is seeded.
- [ ] WhatsApp delivery depends on an unchosen BSP. *(Known Gotcha 5.)*

---

## Key Behavior

| Element | Behavior |
|---|---|
| Notification toggles | Granular — a user can, for example, keep booking alerts on but turn off marketing/promo pushes |
| Billing alerts | These map directly to the Email + WhatsApp invoice notifications described in `14-billing-logic.md` — turning this off does **not** stop the invoice email (still legally/financially required), only stops the redundant in-app push |
| Language | Single-language (English) by default per current scope; multi-language is a future consideration, not yet built |
| Delete account | Owner accounts with an active billing cycle or pending payout may need a confirmation/blocking step — flagged as an open question for the architecture stage |

---

## API Touchpoints (indicative)
- `GET /users/me/preferences`
- `PUT /users/me/preferences`

---

## Related Docs
- `15-profile-flow.md` — Personal info, separate from these app preferences
- `18-notifications-flow.md` — What each notification toggle actually controls
