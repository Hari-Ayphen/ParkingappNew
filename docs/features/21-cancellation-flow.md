# Cancellation Flow

- **Status:** agreed
- **Milestone:** `v0.4` (work item `v0.4-D`)
- **Owner:** unassigned

## Overview
Two distinct cancellation paths that were only implied (via the Booking History "Cancelled" tab) but never actually specified: a Parker cancelling before a session starts, and an Owner cancelling a booking they already approved.

---

## Parker-Initiated Cancellation

```
BOOKING HISTORY (Active tab) → open a not-yet-started booking
              ↓
┌─────────────────────────────────────┐
│         BOOKING DETAIL                  │
│  "Cancel Booking" button (only visible     │
│   before the session has started —            │
│   i.e., before "Arriving" state begins)          │
└─────────────────────────────────────┘
              ↓
        Tap "Cancel Booking"
              ↓
┌─────────────────────────────────────┐
│      CANCEL CONFIRMATION                │
│  - Reason (optional dropdown)              │
│  - Warning: "Cancelling frequently may       │
│    affect your account standing"                 │
│  - [ Keep Booking ]   [ Confirm Cancel ]              │
└─────────────────────────────────────┘
              ↓
        POST /bookings/:id/cancel
              ↓
        Owner notified
        Booking moves to "Cancelled" tab
        (see 07-booking-history-flow.md)
```

## Owner-Initiated Cancellation

```
ACTIVE BOOKINGS (Owner) or BOOKING REQUESTS → an approved,
not-yet-started booking
              ↓
┌─────────────────────────────────────┐
│      OWNER: CANCEL BOOKING              │
│  - Reason (required dropdown:              │
│    "Space unavailable", "Emergency",           │
│    "Other")                                        │
│  - [ Keep Booking ]   [ Confirm Cancel ]               │
└─────────────────────────────────────┘
              ↓
        POST /bookings/:id/owner-cancel
              ↓
        Parker notified with reason
        Parker's search re-opens automatically
        Booking moves to "Cancelled" tab (both sides)
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Parker | Cancels their own not-yet-started booking, with an optional reason |
| Owner | Cancels a booking they already approved, with a **required** reason |
| Admin | Cannot cancel from this flow. Reviews accounts flagged for frequent cancellation in the moderation queue |

## User stories

### US-1 — Cancel my booking before it starts (Parker)

As a **Parker**, I can **cancel a booking I no longer need, before the session starts** so that
**the owner isn't left holding a slot for someone who won't arrive**.

- **AC1:** Given an approved booking that has not reached "Arriving", when I open its detail, then
  a "Cancel Booking" button is visible.
- **AC2:** Given I tap "Cancel Booking", when the confirmation sheet opens, then it offers an
  optional reason and warns that frequent cancellation may affect my account standing.
- **AC3:** Given I confirm, when the request succeeds, then the booking moves to my Cancelled tab
  and the owner is notified.
- **AC4:** Given I tap "Keep Booking", when the sheet closes, then nothing changes.
- **AC5:** Given the session has moved past "Arriving", when I open the booking, then **no cancel
  action is offered** and the normal session/exit flow applies.
- **AC6:** Given the booking was already cancelled by the owner, when I confirm a cancel, then the
  request is rejected and I see the current state rather than a double cancellation.

### US-2 — Cancel a booking I approved (Owner)

As an **Owner**, I can **cancel a booking I already approved when my space becomes unavailable**
so that **the parker finds out in time to park somewhere else**.

- **AC1:** Given an approved, not-yet-started booking on my space, when I open it, then a cancel
  action is available.
- **AC2:** Given I open the cancel sheet, when I try to confirm without picking a reason, then it
  is blocked — the reason is **required** for owner cancellation.
- **AC3:** Given I confirm with a reason, when it succeeds, then the parker is notified **with
  that reason** and the booking moves to Cancelled on both sides.
- **AC4:** Given the session has moved past "Arriving", when I open the booking, then no cancel
  action is offered.

### US-3 — Get back to searching after an owner cancels (Parker)

As a **Parker**, I can **be returned to search automatically when an owner cancels on me** so that
**I'm not stranded holding a booking that no longer exists**.

- **AC1:** Given an owner cancels my booking, when the event reaches my device, then I receive a
  notification carrying the owner's reason.
- **AC2:** Given I am in the app when it happens, when the Socket.IO event arrives, then my UI
  updates in place and search re-opens without me refreshing.
- **AC3:** Given I was offline, when I next open the app, then the booking shows as
  owner-cancelled with the reason.

### US-4 — Track cancellation as a trust signal

As the **system**, I can **count cancellations per account in a rolling window and flag accounts
that exceed a threshold for admin review** so that **serial cancellers are visible to the only
safety net this product has**.

- **AC1:** Given a cancellation is recorded, when it commits, then it is attributed to the party
  who initiated it — parker or owner — with its timestamp and reason.
- **AC2:** Given an account exceeds the threshold in the rolling window, when the next
  cancellation commits, then the account is flagged for admin moderation review.
- **AC3:** Given an account is flagged, when the flag is created, then **no charge, fee, penalty
  or refund is generated** — the record is a trust signal only.
- **AC4:** Given an account is flagged, when the user cancels again, then they are not blocked by
  this flow; only an admin action can restrict them.

### US-5 — Keep cancellation independent of billing and availability

As an **Owner**, I can **cancel a booking without my space toggling off or my billing changing**
so that **one bad day doesn't cost me the rest of the day's bookings**.

- **AC1:** Given my space is toggled ON, when I cancel a booking on it, then the space remains ON
  and stays on the map.
- **AC2:** Given I cancel a booking, when that day's platform fee is computed, then the day still
  counts exactly as it did before — cancellation does not remove a billable day.
- **AC3:** Given I cancel a booking, when I check my invoices, then no credit, adjustment, or
  refund line has been created.

## Business rules

- **BR-1:** Cancellation is only possible **before the session moves past "Arriving"**. Once past
  it, only the normal session/exit flow applies (`06-booking-flow.md`).
- **BR-2:** **Cancellation cannot trigger a refund.** SpotKey holds no Parker→Owner money — there
  is nothing charged in-app to refund. Building a refund path would imply a guarantee the product
  cannot honour.
- **BR-3:** Repeat cancellation is a **trust signal only, never a financial penalty**. It flags an
  account for admin review; it never produces a fee, a charge, or a deduction.
- **BR-4:** Owner cancellation **requires** a reason and that reason is shown to the Parker. Parker
  cancellation's reason is optional and is not shown to the Owner as a demand for justification.
- **BR-5:** **Cancelling a booking does not toggle the space OFF and does not affect that day's
  billing count.** Availability, billing, and bookings are independent (`14-billing-logic.md`).
- **BR-6:** A cancelled booking is terminal. It cannot be un-cancelled, revived, or re-approved —
  the parker re-books instead.
- **BR-7:** A cancelled booking is **not ratable** by either side (`24-rating-review-flow.md`),
  which stops cancellation becoming a revenge-rating vector.
- **BR-8:** Cancellation notifications are ordinary, mutable categories — unlike admin
  suspension/restriction notices, which are always sent.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `booking` | changed | `cancelled_at` (nullable timestamptz), `cancelled_by_user_id`, `cancellation_reason_id`, free-text note |
| `booking_status` | existing (seed) | Needs distinct rows for parker-cancelled vs owner-cancelled — both surface in the Cancelled tab |
| `cancellation_reason` | new (seed) | Lookup — "Space unavailable", "Emergency", "Other", plus the parker-side set. Not a `text` enum |
| `account_flag` | new | Trust flag raised when the rolling-window threshold is crossed; reason FK, raised_at, admin resolution |

**Invariants this introduces:** `cancelled_at`, `cancelled_by_user_id` and the status are set
together or not at all; a booking whose session passed "Arriving" can never acquire a
`cancelled_at`; **no row in this feature touches any billing, invoice, or fee table** — the absence
is the rule. Record in [`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Booking Detail (Parker, cancel entry) | `/(app)/bookings/[id]` | `pages/booking-detail.md` |
| Cancel Confirmation (Parker) | `/(app)/bookings/[id]/cancel` | `pages/cancel-booking.md` |
| Owner Cancel Booking | `/(app)/my-space/bookings/[id]/cancel` | `pages/owner-cancel-booking.md` |
| Admin — flagged accounts | `/moderation/flags` | `pages/admin-account-flags.md` |

## Out of scope

- **Refunds, cancellation fees, penalties, or credits of any kind.** There is no in-app money to
  move.
- **Cancelling after "Arriving".** That is the session/exit flow, `06` and `12`.
- **Rejecting a booking request** before approval — that is `10-booking-requests-flow.md`, a
  different act with a different status.
- **Auto-expiry of an unanswered request** — also `10`.
- **Toggling a space off**, which is `08-my-space-flow.md` and independent of this flow.
- **Admin-initiated cancellation.** Admin suspends spaces and restricts accounts; it does not
  reach into an individual booking here.
- **Rating a cancelled booking.** Explicitly not allowed.

## Open questions

- [ ] **The frequent-cancellation threshold and rolling-window length are unconfirmed** — the doc
      says "beyond a threshold in a rolling window" with no numbers. Are they the same for parkers
      and owners?
- [ ] Is "Arriving" itself cancellable, or is the cut-off the moment "Arriving" begins? The Parker
      diagram says "before Arriving state begins"; the Key Behavior table says "past Arriving".
      These are not the same boundary and one booking will fall in the gap.
- [ ] Does the flag threshold count owner and parker cancellations against the same account
      separately, or as one combined count for one-account-two-modes?
- [ ] What is the exact parker-side reason list? The Owner list is specified; the Parker's is only
      "optional dropdown".
- [ ] Does a flagged account see any warning in-app before admin acts, or only the generic
      confirmation-sheet warning?
- [ ] Are cancellations by an owner whose space was admin-suspended counted against them? The
      cancellation was not really their choice.

---

## Key Behavior

| Element | Behavior |
|---|---|
| Cut-off point | Once a session has moved past "Arriving" into any active sub-state (see `06-booking-flow.md`), cancellation is no longer available — only the normal session/exit flow applies |
| No in-app penalty processing | Since there's no in-app payment, cancellation cannot trigger a refund flow — there's nothing charged in-app to refund. Repeated cancellations are tracked as a **trust signal** only (see below) |
| Frequent-cancellation flag | If a Parker or Owner cancels beyond a threshold in a rolling window, their account is flagged for admin review (`MODERATION.md` in the admin panel) — this is a trust/safety measure, not a billing one |
| Owner cancelling a live-toggle day | Cancelling a booking does **not** toggle the space OFF or affect that day's billing count in `14-billing-logic.md` — those are independent |

---

## API Touchpoints (indicative)
- `POST /bookings/:id/cancel` (Parker)
- `POST /bookings/:id/owner-cancel` (Owner)

---

## Related Docs
- `06-booking-flow.md` — The session states that gate when cancellation is allowed
- `07-booking-history-flow.md` — Where cancelled bookings land
- `10-booking-requests-flow.md` — The approved-booking state this cancels from (Owner side)
