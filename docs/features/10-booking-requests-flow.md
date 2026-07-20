# Booking Requests Flow (Owner)

- **Status:** agreed
- **Milestone:** `v0.3` (work item `v0.3-G`)
- **Owner:** unassigned

## Overview
Where an Owner sees and responds to incoming booking requests from Parkers for their live (toggle-ON) spaces.

---

## Flow Diagram

```
MY SPACE DASHBOARD → "Pending Requests" badge tapped
  (or push notification tapped)
              ↓
┌─────────────────────────────────────┐
│          BOOKING REQUESTS               │
├─────────────────────────────────────┤
│  List of incoming requests:               │
│    - Parker name + rating                    │
│    - Vehicle details                            │
│    - Requested duration                            │
│    - Requested start time                            │
│    - [ Approve ]   [ Reject ]                            │
└─────────────────────────────────────┘
              ↓
        Owner taps Approve or Reject
              ↓
        ┌─────────────┐        ┌─────────────┐
        │  APPROVED    │        │  REJECTED    │
        └─────────────┘        └─────────────┘
              ↓                       ↓
   Parker notified                Parker notified
   Booking moves to               with (optional)
   Active Bookings                reason, can search
   (see 11-active-bookings-        another space
   owner-flow.md)
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Owner | See incoming requests for their own live spaces, approve one, or reject one with an optional reason |
| Parker | Nothing on this screen — they wait on their side (`06-booking-flow.md`) and are notified of the outcome |
| Admin | Nothing here. Admin can suspend a space, which stops new requests, but never approves on an owner's behalf |

## User stories

### US-1 — See incoming requests for my spaces

As an **owner**, I can **see every pending booking request across my live spaces in one list** so
that **I can respond before the request expires**.

- **AC1:** Given I have pending requests, when I open Booking Requests, then each row shows the
  parker's name and rating, the vehicle, the requested start time, and the requested duration.
- **AC2:** Given I own several live spaces, when the list loads, then requests for all of them
  appear together, each labelled with the space it is for.
- **AC3:** Given I have no pending requests, when I open the screen, then I see an empty state, not
  a spinner or a blank list.
- **AC4:** Given a request belongs to another owner's space, when the list loads, then it is never
  returned to me.

### US-2 — Approve a request

As an **owner**, I can **approve a request** so that **the parker knows the space is theirs and can
start heading over**.

- **AC1:** Given a pending request, when I tap Approve, then its `booking_status` becomes
  `approved` and a `booking_session` is created in the `arriving` sub-state.
- **AC2:** Given the approval succeeds, when it lands, then the parker receives a push notification
  that deep-links to their session screen, not to Home.
- **AC3:** Given the booking is approved, when the session row is created, then
  `locked_hourly_rate_paise` is copied from the space's current rate and never changes afterwards
  (Invariant 1).
- **AC4:** Given the approval succeeds, when I return to the list, then that request is gone and the
  booking is visible in Active Bookings (`11-active-bookings-owner-flow.md`).

### US-3 — Reject a request

As an **owner**, I can **reject a request, optionally saying why** so that **the parker stops
waiting and can search elsewhere**.

- **AC1:** Given a pending request, when I tap Reject, then its status becomes `rejected` and it
  leaves my list.
- **AC2:** Given I supply a reason, when the parker is notified, then the reason is included; when I
  supply none, the notification still sends without one.
- **AC3:** Given a request is rejected, when the parker opens the notification, then they land on
  search, able to look for another space.

### US-4 — Lose the race gracefully when two parkers want the same slot

As an **owner**, I can **approve only one request per space at a time** so that **I never
double-book a slot I only have once**.

- **AC1:** Given two parkers have requested the same space, when I approve one, then the other
  request is automatically closed and its parker is notified the slot is taken.
- **AC2:** Given every active slot on a space is already busy, when an approval for a further
  booking on that space is attempted, then the server rejects it — the partial unique index on
  `booking_session(space_slot_id) WHERE ended_at IS NULL` is the authority (Invariant 4).
- **AC2b:** Given a multi-slot space with free slots, when I approve a request, then the server
  assigns a free `space_slot` to the booking and other requests remain approvable up to capacity.
- **AC3:** Given I tap Approve on a request that has already been resolved by the race, when the
  call returns, then I see a "this request is no longer pending" message rather than a generic
  error.

### US-5 — Watch requests arrive and expire without refreshing

As an **owner**, I can **have the list update itself** so that **I am not acting on a request that
has already expired**.

- **AC1:** Given the screen is open, when a new request arrives on
  `owner:{id}:booking-requests`, then it appears in the list without a manual refresh.
- **AC2:** Given a request reaches its expiry window with no response, when it expires, then its
  status becomes `expired`, it disappears from my list, and the parker is notified to look
  elsewhere.
- **AC3:** Given a request is displayed, when it is nearing expiry, then a countdown makes the
  remaining time visible.
- **AC4:** Given the app was backgrounded, when I return to the screen, then the list is
  reconciled with the server rather than replayed from stale socket state.

### US-6 — Stop new requests by toggling a space off

As an **owner**, I can **toggle a space OFF and stop receiving requests for it** so that **I can
close for the evening without abandoning anyone already parked**.

- **AC1:** Given a space is toggled OFF, when a parker searches, then that space is not returned and
  no new request can be created for it.
- **AC2:** Given a space has pending requests, when I toggle it OFF, then those in-flight requests
  are still shown to me and remain answerable.
- **AC3:** Given a space has an in-progress session, when I toggle it OFF, then that session
  continues untouched through to Exit Verification.

## Business rules

- **BR-1:** Bookings are **request-approve**, never instant-book. A parker's request creates a
  `requested` booking; only the owner's approval makes it real.
- **BR-2:** A request **auto-expires** if the owner does not respond within the configured window.
  An expired request cannot later be approved — the parker has already been told to move on.
- **BR-3:** **Only one active session per slot** (Invariant 4, ADR-0005). A space can run as many
  concurrent sessions as it has active slots; approval assigns a free slot. Where two requests
  compete for the last free slot, the first approval wins and the loser is auto-notified. The DB
  partial unique index on `space_slot_id` is the authority; a service-layer check alone is not
  sufficient under a real race.
- **BR-4:** Approval **locks the hourly rate** onto the booking. A later edit to the space's rate
  must never re-price a booking that is already approved (Invariant 1).
- **BR-5:** Requests only reach an owner while the space's toggle is **ON**. Toggling OFF removes
  the space from search and stops new requests; it never cancels in-flight requests or sessions.
- **BR-6:** An owner may only see and act on requests for spaces they own. Ownership is a plain
  `user_id` check — there is no org and no delegation.
- **BR-7:** Every notification sent from this flow **deep-links to the relevant screen**, never to
  Home.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `booking` | changed | `booking_status_id` moves `requested` → `approved` / `rejected` / `expired`; `locked_hourly_rate_paise` written at approval |
| `booking_status` | existing lookup | Uses `requested`, `approved`, `rejected`, `expired` |
| `booking_session` | new row | Created on approval, in the `arriving` sub-state |
| `session_state_event` | new row | Append-only: the first transition into `arriving` |
| `notification` | new rows | Approval / rejection / expiry / slot-taken, each with a `deep_link` |

**Invariants this flow relies on:** Invariant 4 (one active session per **slot**) and Invariant 1
(rate frozen at confirm time). Both recorded in
[`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Booking Requests | `/(owner)/requests` | `pages/booking-requests.md` |

## Out of scope

- **The parker's side of the request** — `06-booking-flow.md`.
- **What happens after approval** — the session itself lives in
  `11-active-bookings-owner-flow.md`.
- **Instant booking / auto-approve.** Every booking passes through an owner decision.
- **Counter-offers or negotiating price or duration.** Approve or reject only.
- **The toggle itself** — `08-my-space-flow.md`.
- **Any payment.** No money moves anywhere in this flow.
- **Admin's view of bookings** — the admin panel spec does not exist yet (Known Gotcha 4).

## Open questions

- [ ] **The exact request-expiry window is unconfirmed.** The doc says "e.g. 5 minutes" — an
      example, not a decision. It must be a seeded config value, not a hardcoded constant.
- [ ] Does the expiry countdown start at request creation, or at the moment the owner's device
      first receives it? These differ under poor connectivity.
- [ ] Is the rejection reason free text or a fixed set of choices? A lookup table is implied by the
      repo's status conventions if it is a fixed set.
- [ ] When two requests overlap in *time* on the same space but do not overlap *now* (e.g. one for
      later today), may both be approved? Invariant 4 only constrains concurrent sessions.
- [ ] Is there a cap on how many pending requests one space can accumulate?

---

## Key Behavior

| Element | Behavior |
|---|---|
| Request expiry | If the owner doesn't respond within a set window (e.g. 5 minutes), the request auto-expires and the Parker is notified to look elsewhere |
| Multiple requests | If two Parkers request the same slot, whichever the Owner approves first wins; the other is auto-notified the slot is taken |
| Real-time | New requests arrive via push notification + Socket.IO event so the list updates live without refresh |
| Space must be ON | Requests can only come in while the space's toggle is ON — toggling OFF removes it from search, stopping new requests (in-flight ones are unaffected) |

---

## API Touchpoints (indicative)
- `GET /bookings/space/:id/requests`
- `POST /bookings/:id/approve`
- `POST /bookings/:id/reject`
- Socket.IO channel: `owner:{id}:booking-requests`

---

## Related Docs
- `08-my-space-flow.md` — Dashboard this is reached from
- `11-active-bookings-owner-flow.md` — Where approved bookings go next
- `06-booking-flow.md` — Parker's side of the same request
