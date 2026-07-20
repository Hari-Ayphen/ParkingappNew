# Profile Flow

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
