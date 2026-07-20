# Booking History Flow (Parker)

## Overview
Lets a Parker see all their past (and current) bookings in one list — separate from the live "Active Bookings" state during a session.

---

## Flow Diagram

```
HOME (Parker mode) → "Booking History" tapped
              ↓
┌─────────────────────────────────────┐
│           BOOKING HISTORY              │
├─────────────────────────────────────┤
│  Tabs: [ Active ] [ Completed ] [ Cancelled ] │
│                                           │
│  List of booking cards:                    │
│    - Space name + photo thumbnail            │
│    - Date + duration                            │
│    - Final amount                                 │
│    - Status badge                                    │
│    - Tap → BOOKING DETAIL                                │
└─────────────────────────────────────┘
              ↓
        Tap a completed booking
              ↓
┌─────────────────────────────────────┐
│           BOOKING DETAIL                │
├─────────────────────────────────────┤
│  - Full invoice/receipt                    │
│  - Download invoice (PDF)                     │
│  - Space + owner info                            │
│  - Rating given (if any) / "Rate now" if not        │
│  - Re-book same space shortcut                          │
└─────────────────────────────────────┘
```

---

## Key Behavior

| Element | Behavior |
|---|---|
| Active tab | Shows any in-progress session — tapping jumps straight into the live Active Session screen (see `06-booking-flow.md`) |
| Completed tab | Fully finished sessions, invoice always available |
| Cancelled tab | Bookings rejected by owner or cancelled by parker before session start |
| No payment status shown | Since payment is external (QR/app navigation), the app shows the amount **due**, not amount **paid** — it does not track whether the Parker actually completed the external payment |

---

## API Touchpoints (indicative)
- `GET /bookings/me?status=active|completed|cancelled`
- `GET /bookings/:id/invoice`

---

## Related Docs
- `06-booking-flow.md` — The live session this history is built from
- `02-after-login-flow.md` — Home screen entry point
