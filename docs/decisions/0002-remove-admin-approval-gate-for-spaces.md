# ADR 0002: Remove the admin approval gate for new spaces

- **Status**: Accepted
- **Date**: 2026-07-20
- **Deciders**: Product owner

## Context

The original specs routed every new space through admin approval before it could go live
(`docs/features/09-add-space-flow.md`, pre-revision): submit → `Pending Approval` → admin reviews →
approved/rejected. `docs/features/22-edit-space-flow.md` extended this, sending "major" edits
(location, space type) back through review and auto-toggling the space OFF for the review window.

An approval queue throttles supply growth and puts a human between an owner and their first
earnings. For a marketplace whose core risk at launch is an empty map
(`docs/features/04-map-search-flow.md:52`), that latency is expensive.

## Decision

Spaces are created directly in `Active` status. **No approval gate, no `Pending Approval` state,
no approved/rejected branch.** Edits apply immediately — no field is "major", nothing re-enters
review.

Publishing is separated from going live: publishing is free and instant, while **toggle-ON**
remains the billable act, still gated by the first-time confirmation toast and the autopay
mandate.

## Consequences

**Positive**: An owner can list at 9pm and be earning by 9:05pm. Supply growth is unthrottled, and
the admin team is not a bottleneck on the critical path. The major/minor edit distinction — which
existed only to route edits back through approval — disappears entirely, removing a rule that
would otherwise classify fields and then do nothing.

**Negative**: **Nobody vets a listing before a stranger parks there.** Trust becomes entirely
reactive — ratings, in-session issue reports, and admin takedown after the fact. Admin moderation
stops being a back-office nicety and becomes the only safety net, which raises the stakes on the
five admin docs that do not yet exist (`SPACES.md`, `BOOKINGS.md`, `MODERATION.md`, `PAYMENTS.md`,
`INVOICES.md`).

A second, subtler cost: **bait-and-switch on edit is now possible.** An owner can edit a
well-reviewed space's location or type into something else entirely and keep the ratings. The
approval gate was the only thing preventing this. Whether a large location change should reset
reviews is an open product question.

**Neutral**: Admin retains full takedown power — it moved from *before* publication to *after*.
The `space_status` lookup drops `pending_approval` and keeps `active` / `suspended`.

## Alternatives considered

- **Keep approval for first-time owners only** — rejected as a reasonable compromise that still
  puts a human in the path of exactly the users who most need a fast first win.
- **Auto-approve with post-hoc audit sampling** — deferred, not rejected. A sampled review queue
  would recover much of the safety benefit without the latency, and is worth revisiting once
  volume justifies it.
- **Keep the major/minor edit split without approval** — rejected. With nothing to route to, it
  classifies edits and changes nothing, which later readers would mistake for a real gate.

## Evidence in code

- *No code yet.* Verify at implementation: `space_status` seed data contains no `pending_approval`
  row; `POST /spaces/create` sets status `active`.
- Spec basis: `docs/features/09-add-space-flow.md`, `docs/features/22-edit-space-flow.md`.

---

*Captured pre-implementation on 2026-07-20.*
