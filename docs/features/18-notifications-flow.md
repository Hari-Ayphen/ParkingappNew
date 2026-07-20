# Notifications Flow

## Overview
Covers both push notifications (device-level) and the in-app notification center, across every event type in the app.

---

## Notification Types

| Event | Channel(s) | Recipient |
|---|---|---|
| OTP code | SMS | Whoever is logging in |
| Booking request received | Push + in-app + Socket.IO (live) | Owner |
| Booking approved/rejected | Push + in-app | Parker |
| Booking request auto-expired | Push + in-app | Parker |
| Session state change (arriving, active, etc.) | In-app + Socket.IO (live) | Both |
| Exit verification pending | Push + in-app | Owner |
| Session complete | Push + in-app | Both |
| 7-day invoice generated | **Email + WhatsApp** (see `14-billing-logic.md`) + in-app | Owner |
| Auto-debit successful/failed | Push + in-app + Email | Owner |
| Support ticket reply | Push + in-app | Ticket raiser |
| Space suspended / restored by admin | Push + in-app + Socket.IO (live) | Owner |
| Account restricted by admin | Push + in-app + Socket.IO (live) | Affected user |

---

## In-App Notification Center

```
HOME → Bell icon tapped
              ↓
┌─────────────────────────────────────┐
│           NOTIFICATIONS                 │
├─────────────────────────────────────┤
│  List, most recent first:                  │
│    - Icon by type                              │
│    - Short message                                │
│    - Timestamp                                        │
│    - Tap → deep-links to the relevant screen              │
│      (booking, invoice, ticket, etc.)                          │
│  - "Mark all as read"                                              │
└─────────────────────────────────────┘
```

---

## Key Behavior

| Element | Behavior |
|---|---|
| Granular control | Users can turn off categories individually from `16-settings-flow.md` — except OTP (always sent), the invoice email (always sent, financially required), and **admin suspension/restriction notices (always sent** — a user must always be told why their space vanished or their account changed) |
| Admin actions are live, not polled | Anything an admin does in the desktop panel reaches mobile over Socket.IO immediately, not on next app open — see `08-my-space-flow.md` (Admin Sync). The push notification is the *alert*; the Socket.IO event is what actually updates the UI in place |
| Delivery reliability | Push uses FCM; if the device is offline, the in-app notification center still shows it on next open |
| Deep-linking | Every notification tap routes directly to the relevant screen (booking detail, invoice, ticket thread) — never just opens the app to Home |

---

## Related Docs
- `14-billing-logic.md` — The invoice notification specifics (Email + WhatsApp)
- `16-settings-flow.md` — Where notification preferences are controlled
- `10-booking-requests-flow.md`, `11-active-bookings-owner-flow.md` — Real-time event sources
