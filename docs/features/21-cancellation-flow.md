# Cancellation Flow

## Overview
Two distinct cancellation paths that were only implied (via the Booking History "Cancelled" tab) but never actually specified: a Parker cancelling before a session starts, and an Owner cancelling a booking they already approved.

---

## Parker-Initiated Cancellation

```
BOOKING HISTORY (Active tab) → open a not-yet-started booking
              ↓
┌─────────────────────────────────────┐
│         BOOKING DETAIL                  │
│  "Cancel Booking" button (only visible     │
│   before the session has started —            │
│   i.e., before "Arriving" state begins)          │
└─────────────────────────────────────┘
              ↓
        Tap "Cancel Booking"
              ↓
┌─────────────────────────────────────┐
│      CANCEL CONFIRMATION                │
│  - Reason (optional dropdown)              │
│  - Warning: "Cancelling frequently may       │
│    affect your account standing"                 │
│  - [ Keep Booking ]   [ Confirm Cancel ]              │
└─────────────────────────────────────┘
              ↓
        POST /bookings/:id/cancel
              ↓
        Owner notified
        Booking moves to "Cancelled" tab
        (see 07-booking-history-flow.md)
```

## Owner-Initiated Cancellation

```
ACTIVE BOOKINGS (Owner) or BOOKING REQUESTS → an approved,
not-yet-started booking
              ↓
┌─────────────────────────────────────┐
│      OWNER: CANCEL BOOKING              │
│  - Reason (required dropdown:              │
│    "Space unavailable", "Emergency",           │
│    "Other")                                        │
│  - [ Keep Booking ]   [ Confirm Cancel ]               │
└─────────────────────────────────────┘
              ↓
        POST /bookings/:id/owner-cancel
              ↓
        Parker notified with reason
        Parker's search re-opens automatically
        Booking moves to "Cancelled" tab (both sides)
```

---

## Key Behavior

| Element | Behavior |
|---|---|
| Cut-off point | Once a session has moved past "Arriving" into any active sub-state (see `06-booking-flow.md`), cancellation is no longer available — only the normal session/exit flow applies |
| No in-app penalty processing | Since there's no in-app payment, cancellation cannot trigger a refund flow — there's nothing charged in-app to refund. Repeated cancellations are tracked as a **trust signal** only (see below) |
| Frequent-cancellation flag | If a Parker or Owner cancels beyond a threshold in a rolling window, their account is flagged for admin review (`MODERATION.md` in the admin panel) — this is a trust/safety measure, not a billing one |
| Owner cancelling a live-toggle day | Cancelling a booking does **not** toggle the space OFF or affect that day's billing count in `14-billing-logic.md` — those are independent |

---

## API Touchpoints (indicative)
- `POST /bookings/:id/cancel` (Parker)
- `POST /bookings/:id/owner-cancel` (Owner)

---

## Related Docs
- `06-booking-flow.md` — The session states that gate when cancellation is allowed
- `07-booking-history-flow.md` — Where cancelled bookings land
- `10-booking-requests-flow.md` — The approved-booking state this cancels from (Owner side)
