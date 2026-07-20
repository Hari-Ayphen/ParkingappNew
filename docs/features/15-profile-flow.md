# Profile Flow

- **Status:** agreed
- **Milestone:** `v1.0` (work item `v1.0-B`)
- **Owner:** unassigned

## Overview
Where a user (in either Parker or Owner mode — it's the same profile) views and edits their personal info.

---

## Flow Diagram

```
HOME → Bottom nav "Profile" tapped
              ↓
┌─────────────────────────────────────┐
│               PROFILE                   │
├─────────────────────────────────────┤
│  - Profile photo (optional upload)         │
│  - First name / Last name                     │
│  - Phone number (read-only, verified)             │
│  - Email                                              │
│  - UPI ID (editable — same one used for               │
│    QR generation + auto-debit mandate)                    │
│  - Country (read-only)                                        │
│  - "Edit" → inline field editing → "Save"                        │
└─────────────────────────────────────┘
              ↓
        PUT /users/me
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Authenticated user (Parker mode) | View and edit their one profile — photo, name, email, UPI ID |
| Authenticated user (Owner mode) | Exactly the same. There is no second profile and no per-mode field |
| Unauthenticated visitor | Nothing — the screen is behind auth |
| Admin | Views a user's profile from the desktop panel; does not edit it from this flow |

## User stories

### US-1 — View my profile

As an **authenticated user**, I can **open Profile from the bottom nav and see my current
details** so that **I can check what the app holds about me before changing anything**.

- **AC1:** Given I am signed in, when I tap "Profile", then `GET /users/me` populates photo,
  first name, last name, phone, email, UPI ID and country.
- **AC2:** Given I am in Owner mode, when I open Profile, then I see the same single profile as
  in Parker mode — no mode-specific fields and no mode switcher on this screen.
- **AC3:** Given the phone and country fields, when the screen renders, then both are displayed
  read-only and are not focusable for editing.
- **AC4:** Given I have never uploaded a photo, when the screen renders, then a placeholder is
  shown and the rest of the screen still functions.

### US-2 — Edit my name and email

As an **authenticated user**, I can **change my first name, last name and email** so that **my
details stay correct as they change**.

- **AC1:** Given I tap "Edit", when the editable fields unlock, then phone and country remain
  locked.
- **AC2:** Given I change a name field and tap "Save", when `PUT /users/me` succeeds, then the
  screen returns to read mode showing the new value.
- **AC3:** Given I enter a malformed email, when I tap "Save", then an inline error appears and
  no request is sent.
- **AC4:** Given the save request fails, when the error returns, then my typed values are still
  in the fields and I can retry without re-entering them.

### US-3 — Upload or replace my profile photo

As an **authenticated user**, I can **set or replace my profile photo** so that **owners and
parkers can recognise who they are dealing with**.

- **AC1:** Given I tap the photo, when I pick an image, then it uploads and the new photo is
  shown on Profile after save.
- **AC2:** Given camera or photo-library access has never been granted, when I first tap the
  photo, then the permission is requested at that moment — not earlier in the app.
- **AC3:** Given I decline the permission, when I return to Profile, then the rest of the screen
  is still fully editable.
- **AC4:** Given a photo already exists, when I upload a new one, then it replaces the old one.

### US-4 — Edit my UPI ID

As an **authenticated user in Owner mode**, I can **change the UPI ID on my profile** so that
**future exit QRs and my auto-debit mandate point at the right account**.

- **AC1:** Given I save a new UPI ID, when the save succeeds, then every exit QR generated after
  that moment uses the new ID.
- **AC2:** Given I save a new UPI ID, when the save succeeds, then the auto-debit mandate target
  used for future platform-fee cycles is the new ID.
- **AC3:** Given invoices already generated before the change, when I view them, then they still
  show the UPI ID that was in effect when they were generated.
- **AC4:** Given a UPI ID that fails format validation, when I tap "Save", then an inline error
  appears and no request is sent.

### US-5 — Understand why I can't change my phone number

As an **authenticated user**, I can **see that my phone is verified and locked** so that **I
don't hunt for a setting that doesn't exist**.

- **AC1:** Given the Profile screen, when it renders, then the phone field is marked as verified
  and read-only.
- **AC2:** Given I tap the phone field, when nothing happens, then helper text explains that
  changing a verified number is not currently supported.
- **AC3:** Given any request that attempts to change `phone` or `country_id`, when it reaches
  `PUT /users/me`, then the API rejects or ignores that field.

## Business rules

- **BR-1:** There is **one profile per account**, shared by Parker mode and Owner mode. No
  "Parker profile" vs "Owner profile", and no role column on the profile.
- **BR-2:** The verified phone number **cannot be changed from this screen**. Changing it needs a
  re-verification flow that does not exist yet — allowing an unverified edit would break the
  (`country_id`, `phone`) identity that login depends on.
- **BR-3:** Country is read-only here. It is set at login and pins the phone and plate validation
  patterns.
- **BR-4:** Editing the UPI ID updates the **exit-QR source** and the **auto-debit mandate
  target** going forward. It never rewrites an already-generated invoice — restating history
  would make past invoices unreconcilable against the account that was actually paid.
- **BR-5:** The profile photo is optional. No flow may block on its absence.
- **BR-6:** SpotKey processes no parking payments. The UPI ID is display and mandate data only —
  it is never used to move Parker→Owner money through the app.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `user` | changed | `first_name`, `last_name`, `email`, `photo_url`, `upi_id` become editable here |
| `user` | read-only here | `phone`, `country_id` — set at login, not writable from this flow |
| `country` | read | Referenced for the read-only country display |

**Invariants this introduces:** exactly one profile row per account — no per-mode duplication; and
`phone` / `country_id` are immutable through this flow's endpoint. Recorded in
[`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Profile | `/(tabs)/profile` | `pages/profile.md` |

## Out of scope

- **Changing the verified phone number** — needs its own re-verification flow, which does not
  exist.
- **Changing country** — set at login.
- **Any separate owner profile or business profile.** One profile, both modes.
- **Profile completion (first-run capture of these fields)** — that is
  `02-after-login-flow.md`.
- **App preferences** — theme, notifications, language and account deletion live in
  `16-settings-flow.md`.
- **Editing another user's profile** — admin-side, not this flow.
- **Public profile / how a counterparty sees me** — not specified here.

## Open questions

- [ ] Is `email` required or optional on the profile? `02-after-login-flow.md` captures it, but
      this doc doesn't say whether it can be cleared.
- [ ] Is the UPI ID validated only by format, or verified against the UPI network before save?
- [ ] Should changing the UPI ID while an active mandate exists require re-authorising the
      mandate? (`23-upi-autopay-mandate-flow.md` doesn't cover a mid-mandate change.)
- [ ] Photo constraints — max size, accepted formats, and whether photos are moderated.

---

## Key Behavior

| Element | Behavior |
|---|---|
| Phone number | Cannot be changed here — changing the verified phone requires a re-verification flow (out of scope for this doc) |
| UPI ID change | Editing this updates both the QR generation source and the auto-debit mandate target going forward — does not affect already-generated invoices |
| Shared across roles | This is one profile — there's no separate "Parker profile" vs "Owner profile" |

---

## API Touchpoints (indicative)
- `GET /users/me`
- `PUT /users/me`

---

## Related Docs
- `02-after-login-flow.md` — Where UPI ID is first captured (Profile Completion)
- `16-settings-flow.md` — App-level preferences, separate from personal info
