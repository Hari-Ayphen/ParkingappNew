# ADR 0005: Model parking slots as rows, not as a count

- **Status**: Accepted
- **Date**: 2026-07-20
- **Deciders**: Claude during story backfill; needs product-owner ratification

## Context

`docs/features/09-add-space-flow.md` Step 3 lets an owner declare a **number of slots**, stored as
`space.slot_count`. A driveway is 1; a commercial lot might be 10.

Invariant 4 in `docs/architecture/data.md` was originally written as *"one active session per
space"*, enforced by a partial unique index on `booking_session(space_id) WHERE ended_at IS NULL`.

These two are incompatible, and the failure is not cosmetic. A 10-slot lot would admit exactly one
car. The other nine slots would be unbookable forever — while the owner was billed at the 10-slot
rate, because the platform fee is a function of slot count and vehicle type (ADR-0003). **The owner
pays for capacity the product refuses to sell.**

The conflict was surfaced independently by two agents during the story backfill, in
`docs/features/05-space-detail-flow.md` and `docs/features/06-booking-flow.md`.

## Decision

Introduce a **`space_slot`** table — one row per bookable slot (`space_id`, `label`, `is_active`).

- The partial unique index moves down one level: `booking_session(space_slot_id) WHERE ended_at IS NULL`.
- `booking` gains `space_slot_id`, null while the booking is merely *requested*, assigned when the
  owner **approves**.
- A space is "occupied" only when **every** active slot has a live session. Availability becomes a
  count (`3 of 10 free`), not a boolean.
- **Slot assignment is a system concern.** A parker books the space; the server picks a free slot.

## Consequences

**Positive**: Multi-slot spaces work, and enforcement stays in the database — the strongest
property of the original invariant is preserved rather than traded away. Availability gets more
informative for free: a parker can see "3 of 10 free" instead of a binary.

**Negative**: More tables and one more join on the hot search path. Space creation and editing must
now keep `slot_count` and the slot rows in step (Invariant 4b), and nothing at the DB level
enforces that yet — this is a new, real gap.

Occupancy semantics change in three feature docs (`04`, `05`, `06`): "occupied" now means *all
slots busy*, and the map/detail screens need the count rather than a boolean.

**Neutral**: 1-slot spaces — the overwhelming majority — behave exactly as before, with a single
slot row.

## Alternatives considered

- **Keep `slot_count` as a number; check `COUNT(active) < slot_count` in the service layer** —
  rejected. It cannot be made race-safe without an explicit lock, and two parkers requesting the
  same space simultaneously is precisely the scenario Invariant 4 exists to prevent
  (`10-booking-requests-flow.md:45`). Trading a database guarantee for an application check, in the
  one place the race is known to be real, is the wrong direction.
- **Restrict every space to one slot; drop `slot_count`** — rejected. It would remove commercial
  lots from the product, and slot count is an input to the platform rate (ADR-0003), so the pricing
  model assumes multi-slot spaces exist.
- **Let the parker choose a slot** — rejected. A parker cannot verify from a photo which slot is
  which, and it makes them responsible for a detail the system should own.

## Evidence in code

- *No code yet.* Verify at implementation: a `space_slot` table exists; the partial unique index is
  on `space_slot_id`, not `space_id`; `booking.space_slot_id` is null for `requested` and non-null
  from `approved` onward; no UI exposes slot selection to a parker.
- Spec basis: `docs/architecture/data.md` Invariants 4 and 4b.

## Open

- Should `space.slot_count` be dropped and derived from `space_slot`? (data.md open question 7 —
  deriving is cleaner; the column is a denormalisation that buys little.)
- Can an owner deactivate one slot of a multi-slot space, and does that re-rate them mid-cycle?
  (data.md open question 8.)

---

*Captured pre-implementation on 2026-07-20. **Ratification pending** — Claude-originated modelling
call, not a product-owner decision.*
