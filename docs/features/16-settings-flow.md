# Settings Flow

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
