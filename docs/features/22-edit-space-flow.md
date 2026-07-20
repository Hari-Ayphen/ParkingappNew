# Edit Space Flow (Owner)

- **Status:** agreed
- **Milestone:** `v0.2` (work items `v0.2-D` and `v0.2-E`)
- **Owner:** unassigned

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

## Users & roles

| Role | What they can do here |
|---|---|
| Owner (of this space) | Edit every field — location, photos, type & size, amenities, pricing, availability — and delete the space |
| Owner (of another space) | Nothing. A user can only edit spaces they own |
| Parker | Nothing directly, but sees updated details in real time if the space is live |
| Admin | May edit a space's details from the panel, and may suspend it. Admin never touches the owner's `is_live` toggle |

## User stories

### US-1 — Edit a space's details *(work item `v0.2-D`)*

As an **owner**, I can **change any detail of a published space and have it apply at once** so
that **a price change or a new photo doesn't need anyone's permission**.

- **AC1:** Given I tap "Edit" on Space Detail, when the edit screen opens, then all seven sections
  are shown pre-filled with the current values and there is no separate review step.
- **AC2:** Given I change any field — including location pin and space type/size — when I tap
  "Save Changes", then `PUT /spaces/:id` applies it immediately.
- **AC3:** Given any saved edit, when the space is inspected afterwards, then `space_status` is
  unchanged, no review state exists, and no field has been classified as "major".
- **AC4:** Given the space was toggled ON before the edit, when the edit saves, then `is_live` is
  still `true` — nothing auto-toggles OFF.
- **AC5:** Given a field fails validation, when I tap "Save Changes", then nothing is persisted
  and the offending field shows an inline error.
- **AC6:** Given a space I do not own, when an edit is attempted against its id, then the API
  rejects it and no field changes.

### US-2 — Edited details reach Parkers in real time *(work item `v0.2-D`)*

As an **owner**, I can **have my changes show up for Parkers immediately** so that **nobody books
against stale details**.

- **AC1:** Given the space is live, when an edit saves, then the updated fields push to Parkers
  over `space:{id}:availability` with no app refresh.
- **AC2:** Given the space is OFF, when an edit saves, then no push occurs — there is nobody
  viewing it on the map.
- **AC3:** Given admin edits the space from the panel, when the change saves, then the owner's
  Space Detail updates live over the same channel.

### US-3 — A price change never rewrites what already happened *(work item `v0.2-D`)*

As an **owner**, I can **change my hourly rate mid-cycle** so that **I can respond to demand
without disturbing bookings and billing already in flight**.

- **AC1:** Given a completed session, when I change the price, then that session's amount is
  unchanged.
- **AC2:** Given a session already in progress, when I change the price, then that session keeps
  the rate it locked at Booking Confirm.
- **AC3:** Given the current 7-day billing cycle has already counted live days, when I change the
  price, then those counted days are unaffected — the platform fee is a function of slot count and
  vehicle type, not of my hourly rate.
- **AC4:** Given a new booking made after the change, when its rate is set, then it uses the new
  price.

### US-4 — Delete a space *(work item `v0.2-E`)*

As an **owner**, I can **remove a space I no longer rent out** so that **I stop being offered
bookings for it**.

- **AC1:** Given a space with no active or pending booking and `is_live = false`, when I confirm
  deletion, then `DELETE /spaces/:id` succeeds and the space leaves my dashboard.
- **AC2:** Given a space with an active or pending booking, when I attempt deletion, then it is
  refused with a reason naming the blocking booking.
- **AC3:** Given a space with `is_live = true`, when I attempt deletion, then I am told to toggle
  it OFF first and the space is not deleted.
- **AC4:** Given a deleted space, when past sessions, invoices, or ratings referencing it are
  read, then they still resolve — deletion must not orphan billing or review history.

## Business rules

- **BR-1:** **All edits apply immediately.** No field is "major", nothing re-enters review, and
  nothing auto-toggles OFF (ADR-0002). The major/minor split existed only to route edits back
  through admin approval; with the gate gone, a rule that classifies edits and then does nothing
  is dead weight later readers mistake for a real gate.
- **BR-2:** An edit never changes `is_live` and never changes `space_status`. The owner's toggle
  and admin's enforcement state are separate columns and are untouched by this flow (ADR-0004).
- **BR-3:** Location pin and space type/size are editable on a live space, like every other field.
- **BR-4:** A price change is forward-only. It never rewrites a completed session, a session in
  progress, or already-counted days in the current billing cycle.
- **BR-5:** Deletion requires no active or pending booking, and requires the toggle OFF.
- **BR-6:** An edit is never a billable event. Only days a space was live are billed, at a rate
  that is a function of slot count and vehicle type — **whose values are undecided; never invent
  one**.
- **BR-7:** Editing slot count or supported vehicle types changes the platform-fee inputs for
  **future** live days only, never for days already counted.
- **BR-8:** Admin can suspend an edited space at any time; that suspension reaches mobile
  instantly. Reactive suspension is the only control over edit content.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `space` | changed | Every descriptive column is mutable; `is_live` and `space_status_id` are **not** written by this flow |
| `space_photo` | changed | Rows added and removed; ordering preserved |
| `space_amenity` | changed | Join rows added and removed |
| `space` | new column | `deleted_at` — deletion is soft, so sessions, invoices, and ratings keep resolving (US-4 AC4) |

**Invariants this introduces:** an edit never mutates `is_live` or `space_status_id`; a soft-deleted
space is excluded from every map, search, and dashboard query but remains joinable from historical
rows. Record in [`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Edit Space | `/(owner)/spaces/[id]/edit` | `pages/edit-space.md` |
| Delete confirmation | modal on Edit Space | `pages/edit-space.md` |

## Out of scope

- **Creating a space** — `09-add-space-flow.md`.
- **Toggling live, and the billing it starts** — `08-my-space-flow.md`, `14-billing-logic.md`.
- **Any re-review, re-approval, or moderation queue.** None exists (ADR-0002).
- **Admin's own edit and suspension screens.** Only the mobile-side effect is specified here.
- **Edit history or an audit trail.** Nothing records who changed what, when.
- **Transferring a space to another owner.** Single-tenant, one account, no transfer.
- **Resetting or migrating ratings on edit** — see Open questions; not built.

## Open questions

- [ ] **Bait-and-switch: an owner can edit a well-reviewed space's location or type into something
      else entirely and keep its ratings.** The approval gate was the only thing preventing this,
      and ADR-0002 removed it while explicitly leaving the question open. Should a location move
      beyond some distance reset or flag reviews? Should a space-type change? Today the only
      answer is reactive admin suspension, which fires after a Parker has already been misled.
      *(Known Gotcha 9 — decide before v0.2 closes; retro-fitting a review reset is a data
      migration.)*
- [ ] No edit audit trail is specified. With no gate and no history, an admin investigating a
      complaint cannot see what the listing said when it was booked.
- [ ] What happens to a pending booking request when the space it targets is edited materially
      before the owner approves it — the Parker agreed to different details.
- [ ] "Editing while a session is active is allowed for most fields" — *which* fields are excluded
      is not stated anywhere.
- [ ] Whether deleting a space is soft or hard is asserted above as soft to preserve history, but
      no doc or ADR decides it. Needs ratification.
- [ ] Whether the owner is notified, or Parkers with the space favourited are notified, when a
      live space's location changes.

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
