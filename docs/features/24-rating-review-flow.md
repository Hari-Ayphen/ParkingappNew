# Rating & Review Flow

## Overview
`06-booking-flow.md` mentions rating happens at Session Complete, but doesn't detail the rating UI, how reviews are viewed later, or how an aggregate rating is computed and displayed. This fills that in for both directions — Parker rates Owner/space, and Owner rates Parker.

---

## Flow Diagram — Giving a Rating

```
SESSION COMPLETE (either side)
              ↓
┌─────────────────────────────────────┐
│            RATE THIS SESSION            │
├─────────────────────────────────────┤
│  Parker rates:                            │
│    - Space (1-5 stars)                        │
│    - Owner (1-5 stars)                            │
│    - Optional written review                          │
│    - Optional tags ("Clean", "Easy access",              │
│      "As described")                                        │
│                                                                   │
│  Owner rates:                                                       │
│    - Parker (1-5 stars)                                                │
│    - Optional tags ("On time", "Careful",                                 │
│      "Followed instructions")                                                │
│                                                                                   │
│  "Skip" is allowed — rating is optional,                                            │
│  not a gate to closing the session                                                     │
└─────────────────────────────────────┘
              ↓
        POST /bookings/:id/rate
```

## Flow Diagram — Viewing Ratings

```
SPACE DETAIL (Parker view)
  → "Reviews" section shows Space's aggregate rating
    + list of written reviews, most recent first

PROFILE (any user, viewed by others via Space Detail's
"Hosted by" or Booking Confirm's Parker info)
  → Aggregate rating badge, no written review list
    shown for privacy — only the number + count

BOOKING HISTORY → completed booking → BOOKING DETAIL
  → Shows the rating *you* gave, editable within
    a short window (e.g. 48 hours) after submission
```

---

## Key Behavior

| Element | Behavior |
|---|---|
| Not mandatory | Skipping rating never blocks navigating away from Session Complete |
| Aggregate calculation | Simple average across all ratings received, displayed to one decimal (e.g. 4.7); a minimum count (e.g. 3 sessions) is required before a rating badge shows publicly — prevents one bad/good rating from being misleading |
| Editable window | A submitted rating can be edited or removed within a short window; after that it's locked (prevents retaliatory edit wars) |
| Abuse handling | Reviews containing flagged content route to admin moderation (`MODERATION.md` in the admin panel) before publishing |
| Two-way | Both sides rate — Owner's rating of the Parker affects that Parker's visibility to other Owners (e.g., repeated low ratings could restrict booking privileges — a product decision to confirm later) |

---

## API Touchpoints (indicative)
- `POST /bookings/:id/rate`
- `GET /spaces/:id/reviews`
- `GET /users/:id/rating-summary`

---

## Related Docs
- `06-booking-flow.md` — Where rating is triggered from (Session Complete)
- `05-space-detail-flow.md` — Where a space's aggregate rating + reviews are shown
- `15-profile-flow.md` — Where a user's own rating badge appears
