# Edit Space Flow (Owner)

## Overview
`09-add-space-flow.md` covers creating a new space. This covers what happens when an Owner edits an **existing** (published, possibly currently-live) space.

---

## Flow Diagram

```
MY SPACE DASHBOARD → tap an existing space → SPACE DETAIL (Owner)
              ↓
        Tap "Edit"
              ↓
┌─────────────────────────────────────┐
│             EDIT SPACE                  │
│  Same 7 sections as Add Space, pre-filled: │
│    Location · Photos · Type & Size ·          │
│    Amenities · Pricing · Availability ·           │
│    (no separate review step — inline save)            │
└─────────────────────────────────────┘
              ↓
        Tap "Save Changes"
              ↓
┌───────────────────────────────────────┐
│   ALL EDITS APPLY IMMEDIATELY            │
│   No admin re-review, no field is         │
│   "major", toggle state is untouched       │
└───────────────────────────────────────┘
              ↓
        PUT /spaces/:id
              ↓
   Changes live at once. If the space is
   currently toggled ON, updated details
   push to Parkers over Socket.IO
   (space:{id}:availability)
```

> **Why there's no major/minor split any more.** That distinction existed only to decide what got
> routed back through admin approval. With the approval gate removed (`09-add-space-flow.md`),
> there is nothing to route to — a rule that classifies edits but changes nothing is dead weight
> that later readers mistake for a real gate.

---

## Key Behavior

| Element | Behavior |
|---|---|
| All edits | Take effect immediately — price, photos, amenities, availability, **and** location pin and space type/size. No admin gate on any field |
| Toggle is never touched by an edit | A space that was live stays live through an edit. Nothing auto-toggles OFF, because there is no review window to protect |
| Location / type changes on a live space | Allowed, and they push to Parkers in real time. **Open risk:** an owner could bait-and-switch by editing a well-reviewed space into a different location. Admin can suspend reactively (`08-my-space-flow.md` — Admin Sync); whether large location moves should reset reviews is an open product question |
| Price change mid-cycle | Does **not** retroactively change already-completed sessions or the current 7-day billing cycle's already-counted days (see `14-billing-logic.md`) — new price applies to bookings made after the change |
| Editing while a session is active | Allowed for most fields, but a price change never affects a session that's already in progress (that session locked its rate at Booking Confirm) |
| Deleting a space entirely | Only allowed if there's no active or pending booking; if the space has a live toggle, it must be turned OFF first |

---

## API Touchpoints (indicative)
- `PUT /spaces/:id`
- `DELETE /spaces/:id`

---

## Related Docs
- `09-add-space-flow.md` — The original creation flow this mirrors
- `08-my-space-flow.md` — Dashboard entry point
- `14-billing-logic.md` — Why price changes don't retroactively affect billing
