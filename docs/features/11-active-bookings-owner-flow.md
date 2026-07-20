# Active Bookings Flow (Owner)

## Overview
Lets an Owner track all currently in-progress sessions across all of their spaces, from a single screen.

---

## Flow Diagram

```
MY SPACE DASHBOARD → "Active Bookings" tapped
              ↓
┌─────────────────────────────────────┐
│           ACTIVE BOOKINGS               │
├─────────────────────────────────────┤
│  List of live sessions (across all spaces):│
│    - Space name                             │
│    - Parker name + vehicle                     │
│    - Session state badge:                         │
│        Arriving / Condition Check /                  │
│        OTP Acknowledgement / OTP Display /               │
│        Active / Exit Verification Pending                   │
│    - Live running timer + running amount                        │
│    - Tap → SESSION DETAIL (owner view)                             │
└─────────────────────────────────────┘
              ↓
        Session reaches "Exit Verification Pending"
              ↓
        Navigate to EXIT_VERIFICATION
        (see 12-exit-verification-flow.md)
```

---

## Key Behavior

| Element | Behavior |
|---|---|
| Multi-space view | A single owner with several live spaces sees every active session in one list, not per-space |
| Live sync | Timer and running amount update in real time via Socket.IO — mirrors what the Parker sees on their side |
| No action needed mid-session | Owner mostly observes here; the only required action is at Exit Verification |

---

## API Touchpoints (indicative)
- `GET /bookings/owner/active`
- Socket.IO channel: `owner:{id}:active-sessions`

---

## Related Docs
- `10-booking-requests-flow.md` — How a booking becomes "active"
- `12-exit-verification-flow.md` — What happens when the session ends
- `06-booking-flow.md` — The Parker's mirrored view of the same session
