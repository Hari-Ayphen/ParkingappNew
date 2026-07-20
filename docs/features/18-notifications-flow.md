# Notifications Flow

- **Status:** agreed
- **Milestone:** `v0.4` (work item `v0.4-A`)
- **Owner:** unassigned

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

## Users & roles

| Role | What they can do here |
|---|---|
| Parker | Receives booking, session, and ticket notifications; reads and clears the in-app centre; mutes categories except the always-on set |
| Owner | Everything a Parker receives, plus booking requests, invoice, auto-debit, and space-suspension notices |
| Admin | Causes notifications (suspension, restriction, ticket reply) from the desktop panel. Does not receive app notifications and cannot read a user's centre |

## User stories

### US-1 — Register a device for push

As a **user**, I can **have my device registered for push after Profile Completion** so that
**events reach me when the app is closed**.

- **AC1:** Given I have just completed my profile, when the push permission prompt is shown and I
  accept, then an FCM token is stored against my user and device.
- **AC2:** Given I deny the permission, when I continue, then no token is stored, the app does not
  re-prompt on every launch, and the in-app centre still receives everything.
- **AC3:** Given my FCM token is refreshed by the OS, when the app next starts, then the stored
  token is replaced and the stale one removed.
- **AC4:** Given the same account signs in on a second device, when it registers, then both tokens
  receive push — registering one does not evict the other.

### US-2 — See notifications in the in-app centre

As a **user**, I can **open the bell from Home and see every notification, newest first** so that
**nothing is lost when my device was offline or push was denied**.

- **AC1:** Given notifications exist for me, when I open the centre, then they render newest-first
  with a type icon, short message, and timestamp.
- **AC2:** Given my device was offline when an event fired, when I next open the centre, then that
  notification is present.
- **AC3:** Given unread notifications exist, when I am on Home, then the bell shows an unread
  indicator; when I tap "Mark all as read", then the indicator clears.
- **AC4:** Given I have no notifications, when I open the centre, then I see an empty state, not a
  blank screen or a spinner.

### US-3 — Deep-link from a notification to its screen

As a **user**, I can **tap a notification and land on the thing it is about** so that **I don't
have to hunt for the booking, invoice, or ticket myself**.

- **AC1:** Given a booking-request notification, when I tap it, then I land on that booking's
  detail screen, not Home.
- **AC2:** Given an invoice notification, when I tap it, then I land on that invoice.
- **AC3:** Given a ticket-reply notification, when I tap it, then I land on that ticket thread.
- **AC4:** Given the app was closed, when I tap a push notification, then after launch and auth I
  land on the same target screen.
- **AC5:** Given the target no longer exists or I no longer have access, when I tap it, then I see
  an explanatory screen rather than a crash or a blank route.

### US-4 — Mute the categories I don't want

As a **user**, I can **turn off individual notification categories from Settings** so that
**routine events don't overwhelm me**.

- **AC1:** Given I mute a category, when an event in that category fires, then no push is sent and
  the in-app entry is still recorded.
- **AC2:** Given I mute everything I am permitted to mute, when an OTP, invoice email, or admin
  suspension/restriction event fires, then it is still delivered.
- **AC3:** Given I view Settings, when I look at the always-on categories, then they are shown as
  non-toggleable with a stated reason, not silently absent.

### US-5 — Receive an admin action instantly

As a **user affected by an admin action**, I can **have my app reflect a suspension or restriction
the moment it happens** so that **I am never acting on a state the admin has already revoked**.

- **AC1:** Given an admin suspends my space, when the mutation commits, then a
  `spaces:live-updates` / `space:{id}:availability` event updates my UI in place with no refresh
  or re-login.
- **AC2:** Given an admin restricts my account, when the mutation commits, then an
  `admin:{userId}:account-status` event arrives and a push notification is sent as the alert.
- **AC3:** Given my socket is disconnected at the time, when it reconnects or I next open the app,
  then the current state is reconciled and the notification is present in the centre.
- **AC4:** Given I have muted every category I can, when an admin suspension or restriction fires,
  then I still receive it.

### US-6 — Fan out an event to its channels

As the **system**, I can **route each event type to exactly the channels in the Notification Types
table** so that **delivery is a data-driven rule rather than scattered call sites**.

- **AC1:** Given an event fires, when it is dispatched, then it reaches every channel listed for
  its type and no others.
- **AC2:** Given push delivery to FCM fails, when the dispatch completes, then the in-app entry is
  still created and the failure is logged, not swallowed.
- **AC3:** Given an event fires twice for the same entity and state, when dispatched, then the
  user sees one notification, not duplicates.

## Business rules

- **BR-1:** Every notification carries a deep-link target. A notification that can only open Home
  is not shippable — it makes the user do the search the notification was meant to save.
- **BR-2:** Three categories are **always sent and cannot be muted**: the login OTP, the 7-day
  invoice email (financially required), and admin suspension/restriction notices. A user must
  always be told why their space vanished or their account changed.
- **BR-3:** Muting a category suppresses the **push** only. The in-app centre remains a complete
  record — muting is about interruption, not about hiding history.
- **BR-4:** Admin actions reach mobile over **Socket.IO immediately**, never on next app open. The
  push is the alert; the socket event is what updates the UI in place. With no listing approval
  gate (ADR-0002), takedown latency *is* the safety margin.
- **BR-5:** Push is FCM. Invoice delivery is email + WhatsApp; the WhatsApp BSP is not yet chosen,
  so the WhatsApp leg must sit behind an interface, not a hardcoded vendor call.
- **BR-6:** Push permission is requested **after Profile Completion**, never on splash. Asking
  upfront raises denial rates.
- **BR-7:** Offline is not a lost notification — if FCM cannot deliver, the in-app centre shows it
  on next open.
- **BR-8:** English only. No i18n framework and no per-user language on a notification template.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `notification` | new | Recipient user, type FK, title/body, deep-link target, `read_at` |
| `notification_type` | new (seed) | Lookup — one row per event in the Notification Types table, with its channel set and whether it is mutable |
| `device_token` | new | FCM token per user per device, with last-seen; unique on token |
| `notification_preference` | new | Per-user, per-category mute flag. No row = default on |

**Invariants this introduces:** a notification type flagged non-mutable can have no preference row
that suppresses it — enforced in the dispatcher, not only in the Settings UI. A device token is
unique across users; re-registering reassigns rather than duplicates. Record in
[`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Notification Centre | `/(app)/notifications` | `pages/notifications.md` |
| Notification Settings | `/(app)/settings/notifications` | `pages/settings-notifications.md` |

## Out of scope

- **The preferences UI itself** — owned by `16-settings-flow.md`; this doc only states what may
  and may not be muted.
- **Invoice content and its WhatsApp template** — `14-billing-logic.md`.
- **SMS as a general channel.** SMS is OTP only; it is not a fallback for push.
- **Inbox search, filtering, or archiving.** The centre is a reverse-chronological list.
- **Admin-side composing.** Admin does not send free-text messages to users.
- **Digests or any scheduled summary.** All notifications are event-driven.
- **Quiet hours / do-not-disturb.** Muting is per-category, not time-based.

## Open questions

- [ ] **WhatsApp BSP is unchosen** and template approval has lead time — blocks the invoice
      notification's WhatsApp leg *(Known Gotcha 5)*.
- [ ] How long are notifications retained in the centre before pruning? No retention is specified.
- [ ] Is there a per-user daily cap, and does any category coalesce (e.g. three booking requests
      in a minute)?
- [ ] Does an admin restriction notice carry the admin's stated reason, or only that it happened?
      The spec says a user must be told *why*, but no reason field is defined anywhere.
- [ ] What does the centre show for an event whose target the user has since lost access to?

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
