# In-Session Issue / Dispute Reporting Flow

## Overview
`17-support-flow.md` covers general help tickets. This covers the more urgent, session-specific case: reporting a problem **while a booking is active or immediately after** — wrong vehicle at the space, safety concern, space not matching its listing, damage dispute, etc.

---

## Flow Diagram

```
ACTIVE SESSION or SESSION COMPLETE / EXIT VERIFICATION
  → "Report an Issue" (always visible, not buried in a menu)
              ↓
┌─────────────────────────────────────┐
│           REPORT AN ISSUE               │
├─────────────────────────────────────┤
│  Category (required):                     │
│    - Safety concern (urgent)                  │
│    - Space not as described                       │
│    - Damage / condition dispute                        │
│    - Wrong vehicle / unauthorized parking                   │
│    - Amount dispute                                             │
│    - Other                                                          │
│  Description                                                            │
│  Photo attachment (pulls from Condition                                     │
│    Check / Exit Verification photos already                                    │
│    taken, or new upload)                                                          │
│  Submit                                                                              │
└─────────────────────────────────────┘
              ↓
┌───────────────────────────────────────┐
│   IS THIS FLAGGED "SAFETY CONCERN"?      │
└───────────────────────────────────────┘
      YES                         NO
       ↓                           ↓
Routed to admin            Routed to admin
MODERATION queue,           MODERATION/BOOKINGS
priority/urgent lane          queue, standard lane
(see admin MODERATION.md)     (see admin BOOKINGS.md)
       ↓                           ↓
┌─────────────────────────────────────┐
│           TICKET STATUS                 │
│  Same thread view as 17-support-flow.md,   │
│  but linked directly to the booking id        │
└─────────────────────────────────────┘
```

---

## Key Behavior

| Element | Behavior |
|---|---|
| Always accessible | Unlike general support (menu-driven), this is a visible button during and right after an active session — urgency matters here |
| Safety priority lane | "Safety concern" reports get routed to a faster admin queue than a routine amount dispute |
| Session context auto-attached | The report automatically carries the booking id, both parties' info, and any Condition Check / Exit Verification photos already on file — the user doesn't have to re-explain what session this is about |
| Amount disputes | These specifically reference the system-calculated final amount from `12-exit-verification-flow.md` — since SpotKey doesn't process the actual payment, admin mediation here is about correcting the record/amount shown, not issuing an in-app refund |
| Does not block session completion | Reporting an issue does not prevent the session from completing normally — it opens a parallel resolution track |

---

## API Touchpoints (indicative)
- `POST /bookings/:id/report-issue`
- `GET /bookings/:id/issue-status`

---

## Related Docs
- `17-support-flow.md` — General (non-session-specific) support
- `06-booking-flow.md`, `12-exit-verification-flow.md` — Where the "Report an Issue" entry point lives
