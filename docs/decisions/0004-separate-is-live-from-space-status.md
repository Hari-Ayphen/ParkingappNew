# ADR 0004: Keep `is_live` separate from `space_status`

- **Status**: Accepted
- **Date**: 2026-07-20
- **Deciders**: Claude during Stage 5 schema design; needs product-owner ratification

## Context

Two different things can stop a space appearing on the map:

1. The **owner** switches the toggle off — they are closed for the evening
   (`docs/features/08-my-space-flow.md`).
2. **Admin** suspends the space — it may not operate at all
   (`docs/features/09-add-space-flow.md`, post-ADR-0002).

Both produce the same visible outcome: the space vanishes from search. The obvious modelling
shortcut is a single `status` column with values like `active` / `off` / `suspended`.

## Decision

Two independent columns on `space`:

- `space_status_id` → lookup (`active`, `suspended`) — **admin's lever**, "may this space operate"
- `is_live` → boolean — **owner's lever**, "is the owner open right now"

A space is visible on the map only when `space_status = active AND is_live = true`.

## Consequences

**Positive**: The two states stay distinguishable, which matters because **only one of them is
billable.** An owner toggling off is a normal free action; an admin suspension is an enforcement
event. Collapsing them into one column would make it impossible to answer "was this space billable
on the 14th?" without replaying an event log — and billing correctness is the revenue line.

It also keeps the owner's toggle state intact across a suspension: when admin un-suspends, the
space returns to whatever the owner had chosen, rather than defaulting to a guess.

**Negative**: Every visibility query must check both columns. Forgetting one shows a suspended
space on the map — the exact failure ADR-0002's reactive-moderation model cannot tolerate.
Mitigated by Invariant 11 in `docs/architecture/data.md` and a recommended DB `CHECK`.

**Neutral**: A third state (owner-deleted) is handled by soft-delete on the row, not by either
column.

## Alternatives considered

- **Single `status` enum with `active` / `off` / `suspended`** — rejected. Conflates two actors'
  intentions, loses the owner's preference during a suspension, and makes billing history
  ambiguous.
- **`is_live` only, with suspension implemented by force-setting it false** — rejected outright.
  Admin would silently overwrite the owner's setting, and un-suspending could not restore it.

## Evidence in code

- *No code yet.* Verify at implementation: `space` has both columns; every map/search query filters
  on both; a `CHECK (NOT (is_live AND space_status_id = suspended))` constraint exists.
- Spec basis: `docs/architecture/data.md` — Spaces, Invariant 11.

---

*Captured pre-implementation on 2026-07-20. **Ratification pending** — this is a Claude-originated
modelling call, not a product-owner decision.*
