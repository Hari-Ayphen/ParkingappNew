# Space Detail Flow (Parker)

## Overview
Shown when a Parker taps a space from the Map/Search screen. Gives full information about the space before booking.

---

## Flow Diagram

```
MAP/SEARCH → Tap a space
              ↓
┌─────────────────────────────────────┐
│            SPACE DETAIL                │
├─────────────────────────────────────┤
│  - Photo carousel                        │
│  - Space name / address                    │
│  - Hourly rate                                │
│  - Amenities list (icons)                       │
│  - Owner name + rating (from past sessions)       │
│  - Parker reviews (list, most recent first)         │
│  - Map preview (mini, non-interactive)                │
│  - Live availability indicator                          │
│    ("Available now" / "Currently occupied")                │
│  - "Book Now" button (disabled if occupied)                  │
└─────────────────────────────────────┘
              ↓
        Tap "Book Now"
              ↓
        Navigate to BOOKING_CONFIRM
        (see 06-booking-flow.md)
```

---

## Key Behavior

| Element | Behavior |
|---|---|
| Live availability | Updated via Socket.IO — if another Parker books first, this screen updates in real time to "Currently occupied" |
| Rating | Average of past session ratings left by other Parkers (see `07-booking-history-flow.md`) |
| Booking disabled | If space is occupied, toggled OFF while viewing, or **suspended by admin**, "Book Now" disables with an inline reason. Admin suspension arrives over Socket.IO and disables the button in place, mid-view (see `08-my-space-flow.md` — Admin Sync) |

---

## API Touchpoints (indicative)
- `GET /spaces/:id` — full space detail
- `GET /spaces/:id/reviews` — reviews list
- Socket.IO channel: `space:{id}:availability` — live occupancy state

---

## Related Docs
- `04-map-search-flow.md` — Where the Parker comes from
- `06-booking-flow.md` — What happens after "Book Now"
