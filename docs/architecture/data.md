# Data Architecture

*Written 2026-07-20 (Stage 5). **Derived from the feature specs, not from code — no code exists
yet.** Every claim cites `docs/features/*.md` rather than a source file. When implementation
begins, this doc becomes a contract to verify against, and citations should migrate to `path:line`.*

Anything inferred rather than specified is marked `[ASSUMPTION]` and needs confirmation before it
becomes load-bearing.

---

## Conventions

Fixed by [`../../CLAUDE.md`](../../CLAUDE.md) — not per-table choices:

| Rule | Detail |
|---|---|
| **Primary keys** | UUIDv7 everywhere — time-ordered, btree-friendly, no sequence contention |
| **Timestamps** | `created_at` / `updated_at`, `timestamptz`, on every table |
| **Money** | Integer **paise** (`*_paise`) + ISO 4217 code. Never a float, never rupees-as-decimal |
| **Statuses** | **Lookup table + FK.** Never `text` enums, never `pgEnum` |
| **Tenancy** | **Single-tenant.** No `org_id` on any table. Ownership is a plain `user_id` FK |
| **Soft delete** | Per-table and deliberate — not a blanket `deleted_at` |
| **Migrations** | Drizzle generate + commit. `db:push` is banned |

> **Why lookup tables matter disproportionately here.** This domain is almost entirely state
> machines — booking status, six session sub-states, space status, invoice status, mandate status,
> ticket status. A `text` enum for each would put a dozen state vocabularies in application code
> where the DB can't enforce them, and every rename would be a migration plus a deploy.

---

## Domain map

```
                    ┌──────────┐
                    │   user   │  (Better Auth owns user/session/account/verification)
                    └────┬─────┘
        ┌────────────────┼────────────────┬──────────────┐
        │                │                │              │
   ┌────▼────┐     ┌─────▼─────┐    ┌─────▼──────┐  ┌────▼───────┐
   │ vehicle │     │   space   │    │  booking   │  │  invoice   │
   └────┬────┘     └─────┬─────┘    │ (as parker)│  │ (as owner) │
        │                │          └─────┬──────┘  └────┬───────┘
        └────────────────┼────────────────┘              │
                         │                                │
                  ┌──────▼─────────┐            ┌─────────▼────────┐
                  │ space_live_day │───────────▶│   invoice_line   │
                  │  (the meter)   │            └──────────────────┘
                  └────────────────┘
```

The same `user` row is both parker and owner — `docs/features/15-profile-flow.md:37` is explicit
that there is one profile, not two. **There is no `role` column on `user`.** Role is contextual:
you are an owner *of a space*, and a parker *on a booking*.

---

## Identity & compliance

| Table | Purpose | Notes |
|---|---|---|
| `user` | Better Auth's table, **extended** | Adds `first_name`, `last_name`, `email`, `phone`, `country_id`, `upi_id`, `is_profile_complete`, `photo_url`. Never renamed |
| `country` | Lookup | Dial code, phone-validation pattern, **vehicle-plate pattern** (`20-vehicle-management-flow.md:50`) |
| `terms_version` | Published T&C / privacy versions | `version`, `published_at`, `body_url` |
| `terms_acceptance` | **Immutable audit trail** | `user_id`, `terms_version_id`, `accepted_at`. Append-only (`19-terms-acceptance-flow.md:48`) |
| `user_preference` | Theme, notification toggles | 1:1 with user (`16-settings-flow.md`) |

`phone` + `country_id` is the login identity (`01-login-flow.md`). OTPs are **not** a table — they
belong in Redis with a TTL, since they expire in minutes and must not accumulate. `[ASSUMPTION]`

---

## Vehicles

| Table | Purpose |
|---|---|
| `vehicle` | `user_id`, `registration_number`, `vehicle_type_id`, `nickname`, `is_default` |
| `vehicle_type` | Lookup — 2-wheeler / 4-wheeler / EV (`20-vehicle-management-flow.md:21`) |

`vehicle_type` is load-bearing beyond display: it feeds **space compatibility filtering**
(`04-map-search-flow.md:33`) *and* the **platform rate table** (`14-billing-logic.md` §2).

---

## Spaces

| Table | Purpose |
|---|---|
| `space` | `owner_id`, name, address, `lat`, `lng`, `space_type_id`, `slot_count`, `hourly_rate_paise`, `space_status_id`, `is_live` |
| `space_slot` | **One row per bookable slot.** `space_id`, `label` (e.g. "A1"), `is_active`. A 1-slot driveway has one row; a 10-slot lot has ten |
| `space_type` | Lookup — driveway / lot / covered / open |
| `space_status` | Lookup — **`active`, `suspended`**. *No `pending_approval`* |
| `space_photo` | 3–8 per space, ordered (`09-add-space-flow.md:22`) |
| `amenity` | Lookup — covered, CCTV, security, EV charging, lighting, washroom |
| `space_amenity` | Join |
| `space_vehicle_type` | Join — which vehicle types this space accepts |
| `space_availability_rule` | Days/hours. **A display hint, not a hard gate** (`09-add-space-flow.md:49`) |

> **`space_status` has no `pending_approval` value** because the approval gate was removed on
> 2026-07-20 (`09-add-space-flow.md`). A space is `active` at creation; `suspended` is
> admin-applied and reactive.

**`is_live` (the toggle) is separate from `space_status`.** They answer different questions:
status is *may this space operate at all* (admin's lever); `is_live` is *is the owner open right
now* (owner's lever). Collapsing them would make an admin suspension indistinguishable from an
owner switching off for the evening — and only one of those is billable.

---

## Bookings & sessions

| Table | Purpose |
|---|---|
| `booking` | `space_id`, **`space_slot_id`** (assigned at approval, null while requested), `parker_id`, `vehicle_id`, `requested_start`, `duration_minutes`, `booking_status_id`, **`locked_hourly_rate_paise`**, `final_amount_paise` |
| `booking_status` | Lookup — requested, approved, rejected, expired, cancelled_by_parker, cancelled_by_owner, active, completed |
| `session_state` | Lookup — the six sub-states: arriving, condition_check, otp_ack, otp_display, active, exit_verification_pending (`06-booking-flow.md:53`) |
| `booking_session` | 1:1 with an approved booking. Current `session_state_id`, `started_at`, `ended_at` |
| `session_state_event` | Append-only transition log — `from`, `to`, `at`. The audit trail behind a dispute |
| `session_photo` | Condition-check and exit-verification photos, tagged by which |

`locked_hourly_rate_paise` is copied onto the booking at confirm time. See Invariant 1 — this is
the single most important column in the schema.

---

## Ratings

| Table | Purpose |
|---|---|
| `rating` | `booking_id`, `rater_id`, `ratee_id`, `target` (space / owner / parker), `stars`, `review_text`, `editable_until` |
| `rating_tag` | Lookup — "Clean", "On time", "As described", … |
| `rating_tag_link` | Join |

Two-way (`24-rating-review-flow.md:62`). Aggregates are **computed, not stored** — a stored
average drifts from its source rows and there's no cheap way to detect that it has. `[ASSUMPTION]`
— revisit if read volume demands a materialised view.

---

## Billing

The revenue subsystem. Small, and the least forgiving part of the schema.

| Table | Purpose |
|---|---|
| `platform_rate` | **The rate table.** `vehicle_type_id`, `slot_count_min`, `slot_count_max`, `paise_per_day`, `effective_from` |
| `space_live_day` | **The meter.** `space_id`, `date`, `was_live`, `charged_paise` — one row per space per calendar day |
| `billing_cycle` | `owner_id`, `cycle_start`, `cycle_end`, `invoice_id` |
| `invoice` | `owner_id`, `cycle_start`, `cycle_end`, `total_paise`, `invoice_status_id`, `issued_at` |
| `invoice_line` | Per space, per cycle — links back to the `space_live_day` rows that produced it |
| `invoice_status` | Lookup — draft, issued, debit_pending, paid, failed, retrying |
| `autopay_mandate` | `user_id`, `razorpay_mandate_id`, `max_amount_paise`, `mandate_status_id`, `authorized_at` |
| `mandate_status` | Lookup — none, pending, active, revoked, lapsed |

> **`platform_rate` carries `effective_from` and is never updated in place.** A price change
> inserts a new row. Without this, recalculating an old invoice would silently use today's price,
> and an owner disputing a three-week-old charge could not be answered.

> **`space_live_day.charged_paise` stores the rate as applied that day**, not a FK to the current
> rate. Same reason: the invoice must stay reproducible after prices change.

> **`[OPEN]` `platform_rate` has no seed values.** The shape is decided (slots × vehicle type);
> the numbers are pending. Nothing may hardcode a rate — see `../../CORE_DOCUMENT.md`.

---

## Support & moderation

| Table | Purpose |
|---|---|
| `support_ticket` | `user_id`, `ticket_category_id`, `ticket_status_id`, optional `booking_id` / `space_id` |
| `ticket_message` | Thread |
| `issue_report` | Session-scoped. `booking_id`, category, `is_safety` (priority lane, `25-issue-dispute-report-flow.md:32`) |
| `admin_action` | **Append-only audit.** `admin_id`, `action`, `target_type`, `target_id`, `reason`, `at` |
| `notification` | In-app centre. `user_id`, `notification_type_id`, payload, `read_at`, `deep_link` |

`admin_action` is not optional bookkeeping. Admin is now the *only* safety net
(`09-add-space-flow.md`), so every suspension and restriction must be attributable and reversible.

---

## Invariants

The rule, the layer that enforces it, and **where it is not enforced**. The gaps are the point.

### 1. A booking's rate is frozen at confirm time

An in-progress or completed session must never re-price because the owner edited the space
(`22-edit-space-flow.md:47`).

- **Enforced by:** copying `hourly_rate_paise` → `booking.locked_hourly_rate_paise` at creation.
- **Gap:** nothing stops a later `UPDATE` of that column. No DB-level immutability. **Mitigation:**
  never expose it in any DTO; consider a trigger rejecting updates once `booking_status` is past
  `approved`. **Not currently designed — this is a real hole.**

### 2. The final amount is calculated, never entered

The owner cannot type an amount at exit (`12-exit-verification-flow.md:49`) — it prevents disputes.

- **Enforced by:** the exit DTO has **no amount field**. Server computes duration × locked rate.
- **Gap:** none at the API. But `final_amount_paise` is a plain column, so a bad migration or admin
  tool could write it. Admin corrections are legitimate (`25-issue-dispute-report-flow.md:57`) —
  those must route through `admin_action` for attribution.

### 3. A space cannot go live without an active autopay mandate

`23-upi-autopay-mandate-flow.md:69` makes this a hard precondition.

- **Enforced by:** service-layer check on toggle-ON against `autopay_mandate.mandate_status`.
- **Gap:** **no DB constraint.** `is_live` is a plain boolean; any direct write bypasses it. A space
  live without a mandate is silent unbillable revenue loss.
- **`[OPEN]`** This invariant is itself disputed — docs 14 and 08 don't know about the gate.
  Resolve before implementing (Known Gotcha 2).

### 4. One active session per **slot** at a time

A space may hold as many concurrent sessions as it has slots — no more.

- **Enforced by:** partial unique index on `booking_session(space_slot_id) WHERE ended_at IS NULL`.
- **Gap:** none. The DB remains the authority, which matters because the race is real: two parkers
  can request the same space simultaneously (`10-booking-requests-flow.md:45`).

> **This was originally written as one session per *space*, which was wrong.** `space.slot_count`
> lets an owner declare a 10-slot lot, but a space-level unique index would let exactly one car
> into it — the other nine slots would be unbookable forever, while the owner was billed at the
> 10-slot rate (`14-billing-logic.md` §2). The owner pays for capacity the product refuses to sell.
>
> Modelling slots as rows fixes it without weakening enforcement: the index just moves down a
> level. The alternative — keeping `slot_count` as a number and checking
> `COUNT(active) < slot_count` in the service layer — cannot be made race-safe without a lock, and
> the concurrent-request race is the exact scenario this invariant exists to prevent. See ADR-0005.

**Slot assignment is a system concern, not a user choice.** A parker books *the space*; the server
assigns a free `space_slot` at approval time. Exposing slot selection would make the parker
responsible for a detail they cannot verify from a photo.

### 4b. `slot_count` must match the number of active slot rows

- **Enforced by:** application code on space create and edit — `slot_count` and the count of
  `space_slot WHERE is_active` are written together.
- **Gap:** **no DB constraint.** They can drift, and drift is expensive in both directions: too few
  rows means unsellable capacity the owner is billed for; too many means overbooking a physical
  space. Either make `slot_count` a derived read (`COUNT(*)` over active slots) and drop the
  column, or add a trigger. **Deriving it is cleaner — the column is a denormalisation that buys
  little.** `[ASSUMPTION]` — needs ratification.

### 5. One default vehicle per user

- **Enforced by:** partial unique index on `vehicle(user_id) WHERE is_default`.
- **Gap:** none.

### 6. One billing row per space per calendar day

- **Enforced by:** unique constraint on `space_live_day(space_id, date)`.
- **Gap:** none at the DB. **But what "live for a day" *means* is still undefined** — any moment of
  ON, or the state at a cutoff? The constraint guarantees one row; it cannot guarantee the row is
  right. See Known Gotcha 3.

### 7. A vehicle in an active booking cannot be deleted

`20-vehicle-management-flow.md:49`.

- **Enforced by:** FK from `booking.vehicle_id` with `ON DELETE RESTRICT`.
- **Gap:** RESTRICT blocks deletion even for *completed* bookings — stricter than the spec, which
  only protects active ones. **Recommended instead:** soft-delete `vehicle` so history survives,
  and move the active-booking check to the service layer.

### 8. Terms acceptance is append-only

- **Enforced by:** no UPDATE/DELETE path in the application.
- **Gap:** **no DB-level protection.** Thin for a legal audit trail — revoke UPDATE and DELETE on
  the table at the role level.

### 9. Money is always integer paise

- **Enforced by:** `bigint` columns named `*_paise`. No `numeric`, no `float`.
- **Gap:** the naming convention is the only thing stopping someone adding `amount numeric(10,2)`.
  A lint rule or schema test would make it enforceable.

### 10. Changing a UPI ID must not alter issued invoices

`15-profile-flow.md:36`.

- **Enforced by:** `invoice` references the mandate used at issue time, not the user's current
  `upi_id`.
- **Gap:** `[ASSUMPTION]` — the specs don't state this explicitly. Needs confirmation.

### 11. A suspended space cannot be toggled live

- **Enforced by:** service check on `space_status`.
- **Gap:** no DB constraint. Could be `CHECK (NOT (is_live AND space_status_id = suspended))`.
  **Recommended** — cheap, and closes a safety-critical hole.

---

## Honest summary of the gaps

Five invariants have **no database enforcement at all** — 1, 3, 8, 9, 11. Each rests entirely on
application code being correct forever.

Two are worth closing with a constraint before launch — cheap, and the failure is severe:

- **11** — a `CHECK` preventing a suspended space from being live. Safety-critical.
- **8** — revoking UPDATE/DELETE on `terms_acceptance`. Legal audit trail.

Two need a design decision rather than a constraint:

- **1** — booking rate immutability: a trigger, or accept the risk behind DTO discipline.
- **3** — mandate-before-live: blocked on resolving the doc contradiction first.

---

## Open questions

| # | Question | Blocks |
|---|---|---|
| 1 | `platform_rate` seed values — shape decided, numbers pending | Billing |
| 2 | What "live for a calendar day" means precisely | `space_live_day` correctness |
| 3 | Mandate-before-toggle: docs 23 vs 14/08 disagree | Invariant 3 |
| 4 | Ratings aggregated on read, or materialised? | Rating reads at scale |
| 5 | Soft-delete or restrict for `vehicle`? | Invariant 7 |
| 6 | Does an issued invoice pin the mandate used? | Invariant 10 |
| 7 | Drop `space.slot_count` and derive it from `space_slot`? | Invariant 4b |
| 8 | Can an owner deactivate one slot of a multi-slot space, and does that change the platform rate mid-cycle? | Billing + `space_slot` |

## Related docs

- [`../../CORE_DOCUMENT.md`](../../CORE_DOCUMENT.md) — product definition
- [`../../CLAUDE.md`](../../CLAUDE.md) — App Profile, Known Gotchas
- [`../features/14-billing-logic.md`](../features/14-billing-logic.md) — the billing rules this models
- [`../decisions/`](../decisions/) — ADRs for the calls made here
