# Booking Requests Flow (Owner)

## Overview
Where an Owner sees and responds to incoming booking requests from Parkers for their live (toggle-ON) spaces.

---

## Flow Diagram

```
MY SPACE DASHBOARD → "Pending Requests" badge tapped
  (or push notification tapped)
              ↓
┌─────────────────────────────────────┐
│          BOOKING REQUESTS               │
├─────────────────────────────────────┤
│  List of incoming requests:               │
│    - Parker name + rating                    │
│    - Vehicle details                            │
│    - Requested duration                            │
│    - Requested start time                            │
│    - [ Approve ]   [ Reject ]                            │
└─────────────────────────────────────┘
              ↓
        Owner taps Approve or Reject
              ↓
        ┌─────────────┐        ┌─────────────┐
        │  APPROVED    │        │  REJECTED    │
        └─────────────┘        └─────────────┘
              ↓                       ↓
   Parker notified                Parker notified
   Booking moves to               with (optional)
   Active Bookings                reason, can search
   (see 11-active-bookings-        another space
   owner-flow.md)
```

---

## Key Behavior

| Element | Behavior |
|---|---|
| Request expiry | If the owner doesn't respond within a set window (e.g. 5 minutes), the request auto-expires and the Parker is notified to look elsewhere |
| Multiple requests | If two Parkers request the same slot, whichever the Owner approves first wins; the other is auto-notified the slot is taken |
| Real-time | New requests arrive via push notification + Socket.IO event so the list updates live without refresh |
| Space must be ON | Requests can only come in while the space's toggle is ON — toggling OFF removes it from search, stopping new requests (in-flight ones are unaffected) |

---

## API Touchpoints (indicative)
- `GET /bookings/space/:id/requests`
- `POST /bookings/:id/approve`
- `POST /bookings/:id/reject`
- Socket.IO channel: `owner:{id}:booking-requests`

---

## Related Docs
- `08-my-space-flow.md` — Dashboard this is reached from
- `11-active-bookings-owner-flow.md` — Where approved bookings go next
- `06-booking-flow.md` — Parker's side of the same request
