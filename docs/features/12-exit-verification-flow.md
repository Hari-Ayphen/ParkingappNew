# Exit Verification Flow (Owner)

## Overview
The final step of a session from the Owner's side — confirming the Parker has left, the space condition is fine, and finalizing the amount before payment.

---

## Flow Diagram

```
ACTIVE BOOKINGS → Session reaches "Exit Verification Pending"
  (or push notification when Parker marks themselves as leaving)
              ↓
┌─────────────────────────────────────┐
│          EXIT VERIFICATION              │
├─────────────────────────────────────┤
│  - Session summary (start time, duration)   │
│  - Final amount (auto-calculated from          │
│    duration × hourly rate)                        │
│  - Space condition photo (owner takes one)            │
│  - "Confirm Exit" button                                  │
└─────────────────────────────────────┘
              ↓
        Owner taps Confirm Exit
              ↓
┌─────────────────────────────────────┐
│      PAYMENT (Owner's side)             │
├─────────────────────────────────────┤
│  - QR code shown (generated from Owner's   │
│    UPI ID, captured at profile completion)     │
│  - Parker scans this QR to pay directly           │
│  - No in-app payment confirmation — this is        │
│    purely a display, not a tracked transaction        │
└─────────────────────────────────────┘
              ↓
        Session marked COMPLETE
              ↓
        Moves to Booking History (both sides)
        Space becomes available again
        (still live if toggle remains ON)
```

---

## Key Behavior

| Element | Behavior |
|---|---|
| Amount is calculated, not entered | Final amount is system-calculated from duration × rate — the owner cannot manually override it (prevents disputes) |
| QR code | Same QR shown here and on the Parker's Session Complete screen — generated once from the Owner's UPI ID, not per-session |
| No payment tracking | SpotKey never confirms whether the payment actually happened — see `../overview/product.md` for why |
| Dispute path | If either side disputes the amount, it routes to admin (`BOOKINGS.md` in the admin panel) |

---

## API Touchpoints (indicative)
- `POST /bookings/:id/verify-exit`
- `GET /users/:id/qr-code` (Owner's UPI QR)

---

## Related Docs
- `11-active-bookings-owner-flow.md` — Where this is reached from
- `06-booking-flow.md` — The Parker's matching Session Complete screen
- `../overview/product.md` — Why there's no in-app payment tracking
