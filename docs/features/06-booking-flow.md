# Parker Flow (Book a Space)

- **Status:** agreed
- **Milestone:** `v0.3` (work items `v0.3-F`, `v0.3-H`, `v0.3-K`)
- **Owner:** unassigned

## Overview
This is the flow a user follows when they choose **"Book a Space"** from Home. It covers searching, booking, the active session, and exit — with **zero in-app payment processing**. All money movement happens outside the app via UPI apps.

---

## Flow Diagram

```
HOME → "Book a Space" tapped
              ↓
┌─────────────────────────────┐
│      SEARCH PARKING          │
│  (Map view / List view)      │
├─────────────────────────────┤
│  - Nearby live spaces shown  │
│  - Filters: price, distance, │
│    amenities                 │
│  - Search bar                │
└─────────────────────────────┘
              ↓
        Tap a space
              ↓
┌─────────────────────────────┐
│        SPACE DETAIL          │
├─────────────────────────────┤
│  - Photos                    │
│  - Hourly rate                │
│  - Amenities                  │
│  - Owner rating/reviews       │
│  - Availability                │
│  - "Book Now" button          │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│       BOOKING CONFIRM         │
├─────────────────────────────┤
│  - Select vehicle              │
│  - Choose duration              │
│  - Estimated price shown        │
│    (informational only —        │
│     NOT charged in-app)         │
│  - Confirm booking               │
└─────────────────────────────┘
              ↓
        Request sent to Owner
        (see OWNER_FLOW.md — Booking Requests)
              ↓
        Owner Approves
              ↓
┌───────────────────────────────────┐
│         ACTIVE SESSION             │
│        (6 sub-states)               │
├───────────────────────────────────┤
│  1. Arriving                        │
│  2. Condition Check (photos)         │
│  3. OTP Acknowledgement               │
│  4. OTP Display (shown to Owner)       │
│  5. Active Session (live timer,         │
│     real-time price counting up)         │
│  6. Exit Verification (Owner confirms)    │
└───────────────────────────────────┘
              ↓
┌───────────────────────────────────┐
│         SESSION COMPLETE            │
├───────────────────────────────────┤
│  - Final amount calculated           │
│  - Invoice/receipt shown              │
│  - PAYMENT SECTION:                    │
│      • Owner's QR code (from UPI ID)    │
│      • "Pay with Google Pay" button      │
│      • "Pay with PhonePe" button          │
│      • Tapping ONLY opens/navigates        │
│        to that external app —               │
│        NO payment processed inside            │
│        SpotKey                                │
│  - Rate the space + owner                        │
└───────────────────────────────────┘
              ↓
        Back to HOME
        (can switch to Owner mode anytime)
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Parker | Compose and send a booking request, run the six session sub-states, see the amount due, pay outside the app, rate afterwards |
| Owner | Approves or rejects the request (`10`), verifies exit (`12`). Their UPI QR is displayed here — they are never charged or credited by SpotKey |
| Admin | Nothing in the happy path. Can adjust a disputed amount after the fact, via `admin_action` (`25-issue-dispute-report-flow.md`) |

> Three work items, in order. `v0.3-F` — Booking Confirm and the request/approval outcome (US-1 to
> US-2). `v0.3-H` — the six session sub-states (US-3 to US-8). `v0.3-K` — Session Complete, the
> payment display, and rating (US-9 to US-11).

## User stories

### US-1 — Compose and send a booking request

As a **Parker**, I can **pick my vehicle and duration, see an estimate, and send a request to the
owner** so that **the owner can decide, and my rate is fixed from that moment**.

- **AC1:** Given I arrive from Space Detail, when Booking Confirm loads, then my default vehicle is
  pre-selected and I can switch to any other saved vehicle.
- **AC2:** Given I have **no** saved vehicle, when Booking Confirm loads, then Confirm is blocked
  and "+ Add a vehicle" is offered inline (see `20-vehicle-management-flow.md`).
- **AC3:** Given I choose a duration, when the screen updates, then an estimated price is shown and
  labelled **informational only, not charged in-app**.
- **AC4:** Given I tap Confirm, when the booking is created, then the space's current
  `hourly_rate_paise` is copied into `booking.locked_hourly_rate_paise` on that row.
- **AC5:** Given the owner edits the space's price after my booking is created, when I later view
  this booking at any stage, then it still uses the locked rate — never the new one.
- **AC6:** Given the booking is created, when I see its status, then it reads **requested**, not
  booked or confirmed — approval has not happened.
- **AC7:** Given the request payload is inspected, when it is validated, then it contains **no
  amount field of any kind**.
- **AC8:** Given the space became occupied, toggled OFF or suspended between Space Detail and my
  Confirm tap, when I tap Confirm, then the request is rejected server-side with a reason and no
  booking row is created.

### US-2 — Find out what the owner decided

As a **Parker who has sent a request**, I can **be told promptly whether it was approved, rejected
or expired** so that **I'm not standing next to a driveway guessing**.

- **AC1:** Given the owner approves, when the decision lands, then I receive a push notification
  that deep-links to this booking's session screen — never just to Home.
- **AC2:** Given the owner rejects, when the decision lands, then I am notified with the owner's
  optional reason and offered a path back to search.
- **AC3:** Given the owner does not respond within the expiry window, when the request expires,
  then its status becomes **expired**, I am notified to look elsewhere, and the owner can no
  longer approve it.
- **AC4:** Given another Parker requested the same space and the owner approved them first, when
  their approval lands, then my request is auto-resolved as lost and I am notified the slot is
  taken — I never reach a session for a space with an active session (Invariant 4).
- **AC5:** Given I have the app open, when any of these outcomes occurs, then the status updates
  live over Socket.IO without me refreshing.
- **AC6:** Given the request was approved, when the booking transitions, then a session exists in
  sub-state **Arriving**.

### US-3 — Arriving

As a **Parker with an approved booking**, I can **see the Arriving state with the space's location
and what happens next** so that **I can get there and know the sequence I'm about to run**.

- **AC1:** Given my booking is approved, when I open it, then the session shows sub-state
  **Arriving** with the space address and the owner's display name.
- **AC2:** Given I am in Arriving, when I look at the screen, then the next required step
  (Condition Check) is stated, along with an action to proceed to it.
- **AC3:** Given I am in Arriving, when the state advances, then the transition is written to the
  append-only session state log with from, to and timestamp.
- **AC4:** Given no clock has started, when I am in Arriving, then no elapsed time and no running
  cost are displayed — billing time has not begun.

### US-4 — Condition Check

As a **Parker**, I can **photograph the space's condition before I park** so that **a later dispute
about damage has evidence from both ends**.

- **AC1:** Given I enter Condition Check, when the camera is first needed, then the camera
  permission is requested at that moment — not earlier in the app.
- **AC2:** Given I take condition photos, when they upload, then they are stored against this
  session and tagged as condition-check photos, distinct from exit photos.
- **AC3:** Given I have not captured the required photos, when I try to proceed, then advancing is
  blocked with a clear reason.
- **AC4:** Given the photos are captured, when I proceed, then the session advances to **OTP
  Acknowledgement** and the transition is logged.
- **AC5:** Given a photo upload fails, when I retry, then no duplicate session photo rows result
  from the retry.

### US-5 — OTP Acknowledgement

As a **Parker**, I can **acknowledge that I'm ready to hand over the start-of-session code** so
that **the session only starts when both of us are actually at the space**.

- **AC1:** Given Condition Check is complete, when the session enters OTP Acknowledgement, then I
  see what the code is for and that the owner must verify it.
- **AC2:** Given I acknowledge, when the state advances, then the session moves to **OTP Display**
  and the transition is logged.
- **AC3:** Given I am in OTP Acknowledgement, when I look at the screen, then no session timer is
  running and no cost is accruing.

### US-6 — OTP Display and session start

As a **Parker**, I can **show a code to the Owner for them to verify** so that **the session can't
start without the Owner physically present and agreeing it started**.

- **AC1:** Given the session is in OTP Display, when the screen renders, then the code is shown to
  me large enough to read aloud or show on-screen.
- **AC2:** Given the Owner verifies the code, when verification succeeds, then the session advances
  to **Active**, `started_at` is set, and the transition is logged.
- **AC3:** Given the Owner enters a wrong code, when verification fails, then the session stays in
  OTP Display and no `started_at` is written.
- **AC4:** Given the session advances to Active, when it does, then the space stops being bookable
  by anyone else (Invariant 4).

### US-7 — Active session

As a **Parker parked in the space**, I can **watch a live timer and the cost accruing against my
locked rate** so that **I always know what I'll owe before I decide to leave**.

- **AC1:** Given the session is Active, when the screen renders, then a live timer counts up from
  `started_at`.
- **AC2:** Given the session is Active, when the running cost renders, then it is computed from
  elapsed duration × `locked_hourly_rate_paise` — never the space's current rate.
- **AC3:** Given the owner edits the space's price mid-session, when I look at the running cost,
  then it does not change.
- **AC4:** Given the session is Active, when I look at the screen, then there is **no Pay button
  and no payment surface of any kind** — payment display belongs to Session Complete.
- **AC5:** Given I am ready to leave, when I tap the leave action, then the session moves to
  **Exit Verification** and the Owner is notified.
- **AC6:** Given I close and reopen the app mid-session, when I return, then the timer and running
  cost reflect real elapsed time, not time the app was foregrounded.

### US-8 — Exit Verification

As a **Parker leaving**, I can **wait on a clear "owner is verifying" state** so that **I know the
session isn't finished until they confirm, and the clock's end is not disputed**.

- **AC1:** Given I mark myself leaving, when the state changes, then the session reads **Exit
  Verification** and the Owner receives a push notification.
- **AC2:** Given the session is in Exit Verification, when I look for a way to finalise it myself,
  then there is none — only the Owner's confirm ends it.
- **AC3:** Given the Owner confirms exit, when confirmation lands, then `ended_at` is set, the
  booking status becomes **completed**, and I move to Session Complete.
- **AC4:** Given the Owner confirms exit, when the final amount is computed, then it equals the
  session duration × `locked_hourly_rate_paise`, calculated server-side.
- **AC5:** Given the exit-verification request payload is inspected, when it is validated, then it
  contains **no amount field** — the Owner cannot type or override the figure (Invariant 2).
- **AC6:** Given the session completes, when it does, then the space becomes bookable again if its
  toggle is still ON.

### US-9 — Session Complete: see what I owe

As a **Parker**, I can **see an itemised final amount and receipt** so that **I know exactly what
to hand over and how it was arrived at**.

- **AC1:** Given the session completed, when Session Complete loads, then it shows start time, end
  time, duration, the locked hourly rate and the final amount.
- **AC2:** Given the amount is displayed, when I read the label, then it says amount **due** —
  never amount **paid**.
- **AC3:** Given the amount is displayed, when it renders, then it matches
  duration × locked rate exactly, in integer paise.
- **AC4:** Given the owner edited the space's price at any point after Booking Confirm, when the
  receipt renders, then it uses the locked rate.
- **AC5:** Given I later open this booking from Booking History, when it renders, then it shows the
  same amount due and never claims a payment status.

### US-10 — Pay the Owner outside the app

As a **Parker**, I can **scan the Owner's UPI QR, jump to my UPI app, or simply hand over cash** so
that **I can settle up with the Owner directly, with SpotKey merely getting out of the way**.

- **AC1:** Given Session Complete is shown, when the payment section renders, then it displays the
  Owner's UPI QR generated from their profile UPI ID.
- **AC2:** Given the payment section renders, when I look at the buttons, then GPay and PhonePe
  appear as **navigation-only** deep links, and tapping one opens that app.
- **AC3:** Given I tap a UPI app button, when the deep link fires, then SpotKey passes **no
  amount** — the link does not prefill a value.
- **AC4:** Given I return to SpotKey from the UPI app, when the screen resumes, then nothing about
  the booking has changed: no payment status, no confirmation, no "paid" flag anywhere.
- **AC5:** Given the payment section renders, when I look for a Pay button that charges me inside
  SpotKey, then there is none — no gateway, no card entry, no wallet, no checkout.
- **AC6:** Given I choose to pay cash instead, when I skip the QR entirely, then the flow completes
  identically — cash is equally valid and the app neither requires nor discourages it.
- **AC7:** Given the Owner has no UPI ID on their profile, when the payment section renders, then
  it degrades to a stated amount due with no QR, rather than a broken or empty QR.
- **AC8:** Given any part of this booking's data is inspected, when it is read, then **no field
  records whether payment occurred** — there is no such field to write.

### US-11 — Rate the space and the Owner

As a **Parker**, I can **leave a rating and review after the session** so that **the next Parker has
the only signal there is, since nothing was vetted up front**.

- **AC1:** Given the session completed, when Session Complete renders, then I can rate the space
  and the Owner and optionally write a review.
- **AC2:** Given I submit a rating, when it saves, then it is linked to this booking and appears on
  the space's detail screen.
- **AC3:** Given I skip rating, when I leave the screen, then the session is still complete — rating
  is never a gate on finishing.
- **AC4:** Given rating is possible, when I rate, then it is entirely **independent of payment** —
  I can rate having paid cash, by QR, or not at all, because the app cannot tell.
- **AC5:** Given I leave the screen, when I return to Home, then I can immediately switch to Owner
  mode without any pending step blocking me.

## Business rules

- **BR-1:** **SpotKey processes no Parker→Owner payment.** No gateway, no card entry, no wallet, no
  checkout, no transaction record. The failure this prevents: an in-app Pay button creates an
  implied guarantee SpotKey cannot honour — refunds, chargebacks and PSP compliance for money it
  never held.
- **BR-2:** **The app never learns whether payment happened.** It shows amount **due**, never
  amount **paid**. There is no field to record it and no code path that could set one. This is why
  a "he never paid me" ticket goes to human mediation — there is no record to check, by design.
- **BR-3:** UPI deep links pass **no amount**. They open the app; that is all they do.
- **BR-4:** **Cash is equally valid.** The QR and app buttons are conveniences, not required rails.
- **BR-5:** **The rate is frozen at Booking Confirm** into `locked_hourly_rate_paise` (Invariant 1).
  A later space price edit must never re-price an in-flight or completed session. The failure this
  prevents: a Parker agreeing to one price and being billed another after the fact.
- **BR-6:** **The final amount is system-calculated** from duration × locked rate (Invariant 2).
  The Owner cannot type or override it, and **no API field accepts an amount**. The failure this
  prevents: exit becoming a negotiation, which is exactly the dispute the design removes.
- **BR-7:** **Bookings are request-approve, not instant.** Owner approval is required and requests
  auto-expire. Tapping Confirm buys nothing but a place in the Owner's queue.
- **BR-8:** **One active session per slot** (Invariant 4, ADR-0005). A space accepts as many
  concurrent sessions as it has active slots. Two Parkers may request the last free slot
  simultaneously; whichever the Owner approves first wins and the other is auto-notified. The
  server assigns the slot at approval — the Parker never picks one.
- **BR-9:** **At least one vehicle must exist before a booking can be confirmed.**
- **BR-10:** The session has **exactly six sub-states**: Arriving, Condition Check, OTP
  Acknowledgement, OTP Display, Active, Exit Verification. They are a lookup table, not a `text`
  enum, and every transition is appended to the session state log.
- **BR-11:** **The billable clock runs from OTP verification to the Parker signalling exit.**

  - **Starts** when the OTP handshake completes and the session enters **Active** — not at
    approval, not at arrival. Only the Active sub-state accrues cost.
  - **Stops** the moment the **Parker** signals departure and the session enters **Exit
    Verification** — *not* when the Owner later confirms it.

  > **Why it starts at the OTP handshake.** That is the first moment both parties have agreed the
  > car is in the space. Starting at approval would bill the Parker for travelling; starting at
  > arrival would bill them for traffic and for the condition-check photos, neither of which is
  > parking.
  >
  > **Why it stops at the Parker's signal, not the Owner's confirmation.** The Owner may be
  > asleep, at work, or simply slow. If the clock ran until they tapped confirm, **the Parker
  > would pay for the Owner's latency** — an amount the Parker cannot influence, cannot predict,
  > and (since payment is external and untracked) has no mechanism to dispute except human
  > mediation. Worse, it gives the Owner a standing financial incentive to delay. Ending the
  > clock at the Parker's signal removes both problems; the Owner's confirmation still validates
  > condition and closes the session, it just cannot inflate the bill.

- **BR-11b:** Billable duration is then rounded per `12-exit-verification-flow.md` BR-0 — up to the
  next 15 minutes, 30-minute minimum, amount rounded up to whole rupees.
- **BR-12:** Only the **Owner** ends a session, via exit verification. The Parker can signal intent
  to leave but cannot finalise.
- **BR-13:** All money is **integer paise**. Never a float, never rupees-as-decimal.
- **BR-14:** Every notification in this flow **deep-links to its screen**, never just to Home.
- **BR-15:** Camera permission is requested **at the first Condition Check**, just-in-time.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `booking` | new | `space_id`, `parker_id`, `vehicle_id`, `requested_start`, `duration_minutes`, `booking_status_id`, **`locked_hourly_rate_paise`**, `final_amount_paise` |
| `booking_status` | new (seed) | requested, approved, rejected, expired, cancelled_by_parker, cancelled_by_owner, active, completed |
| `booking_session` | new | 1:1 with an approved booking. Current `session_state_id`, `started_at`, `ended_at` |
| `session_state` | new (seed) | The six sub-states. Lookup table + FK, never a `text` enum |
| `session_state_event` | new | Append-only transition log — from, to, at. The audit trail behind a dispute |
| `session_photo` | new | Condition-check and exit-verification photos, tagged by which |
| `rating` / `rating_tag_link` | new | Two-way rating after the session |
| `vehicle` | read | The selected vehicle |
| `space` | read | Rate is read **once**, at confirm, then never again for this booking |
| `user` | read | Owner's `upi_id` for QR generation — read at display time, never copied onto the booking |
| — | **no payment table** | Deliberately absent. There is nowhere to record that money moved |

**Invariants this introduces / relies on:**
- **Invariant 1** — rate frozen at confirm. Enforced by copying at creation; `locked_hourly_rate_paise`
  must appear in **no** DTO. `architecture/data.md` flags the absence of DB-level immutability as a
  real hole.
- **Invariant 2** — amount calculated, never entered. Enforced by the exit DTO having no amount field.
- **Invariant 4** — one active session per **slot**. Enforced by a partial unique index on
  `booking_session(space_slot_id) WHERE ended_at IS NULL`. The DB is the authority because the race
  is real.

All recorded in [`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Booking Confirm | `/bookings/confirm` | `pages/booking-confirm.md` |
| Request Pending | `/bookings/[id]/pending` | `pages/booking-pending.md` |
| Active Session (six sub-states) | `/bookings/[id]/session` | `pages/active-session.md` |
| Session Complete | `/bookings/[id]/complete` | `pages/session-complete.md` |

## Out of scope

- **Any in-app payment processing.** No gateway, no card entry, no wallet, no saved payment
  method, no checkout, no refund flow. Razorpay exists solely for the Owner's platform-fee autopay
  mandate and touching a booking with it is a product violation.
- **Payment status tracking, reconciliation, or receipts of payment.** Only amount due exists.
- **Splitting, tipping, discounts, coupons, or promo codes.**
- **Scheduling a booking for a future date.** Requests are for now.
- **Extending a session mid-park**, unless raised as an open question below.
- **Owner-side screens.** Approval is `10-booking-requests-flow.md`, exit verification is `12`.
- **Booking history.** `07-booking-history-flow.md`.
- **Disputes and issue reports.** `25-issue-dispute-report-flow.md`.
- **The rating screen's own detail.** `24-rating-review-flow.md` owns it; this flow only launches it.
- **Platform-fee billing.** That is the Owner's cycle (`14-billing-logic.md`), unrelated to a session.

## Open questions

- [ ] **The request expiry window is unstated.** `10-booking-requests-flow.md:44` gives "e.g. 5
      minutes" as an illustration, not a decision. This is load-bearing — it decides how long a
      Parker waits at a kerb.
- [x] ~~**What starts the billing clock, precisely?**~~ **Resolved 2026-07-20 (ADR-0006):** it runs
      from OTP verification (entry to Active) until the **Parker** signals exit — not until the
      Owner confirms, so Owner latency can never inflate the bill. See BR-11.
- [ ] **Duration is chosen at Confirm, but nothing enforces it.** Is the requested duration a cap,
      an estimate, or ignored at billing? What happens when a Parker overstays it?
- [ ] **Can a Parker cancel a request or an approved booking?** `booking_status` has
      `cancelled_by_parker` and `cancelled_by_owner`, but no flow doc describes either path.
- [ ] **What if the Owner never confirms exit?** The session has no terminal timeout and the
      Parker cannot end it — the clock could run indefinitely.
- [ ] **How many condition-check photos are required, and is there a minimum?**
- [ ] **How is the OTP generated, how long is it valid, and can it be regenerated?** No spec.
- [ ] **How is duration rounded into the amount** — to the minute, up to the hour, with a minimum
      charge? Invariant 2 makes the calculation authoritative but not defined.
- [ ] **Does the session survive the Parker losing connectivity** at Condition Check or OTP
      Display, and what is the recovery path?
- [ ] Are condition-check photos visible to the Owner, and exit photos to the Parker?
- [x] ~~Does a space's `slot_count` > 1 conflict with Invariant 4's one-active-session-per-space?~~
      **Resolved 2026-07-20 (ADR-0005):** it did. Slots are now rows (`space_slot`) and Invariant 4
      is one active session per **slot**. `booking.space_slot_id` is assigned by the server at
      approval; the parker never picks a slot.

---

## Payment Section — Exact Behavior (Important)

At **Session Complete**, the screen shows:

1. **Owner's QR code** — generated from the Owner's UPI ID (captured at their profile completion). Parker scans it with any UPI app to pay directly.
2. **App shortcut buttons** — "Google Pay", "PhonePe" (and similar). These are **navigation-only buttons**:
   - Tapping a button deep-links / opens the corresponding installed app.
   - SpotKey does **not** pass amount, does **not** track payment status, does **not** confirm payment success/failure.
   - Whether or how much the Parker actually pays happens entirely outside SpotKey's control, directly between Parker and Owner.
3. **Cash is equally valid.** The Parker can simply hand the Owner cash. The app neither offers
   nor forbids this — it has no opinion, because it has no visibility either way. The QR and the
   app buttons are conveniences, not required rails.
4. There is **no "Pay" button that processes payment inside the app** — no payment gateway integration, no in-app transaction record beyond showing the invoice/amount due.

> Cash makes the app's blindness explicit rather than accidental: there is no path by which
> SpotKey could learn that a session was paid. This is why `07-booking-history-flow.md:48` shows
> amount **due** and never amount **paid**, and why a "he never paid me" ticket goes to human
> mediation (`17-support-flow.md:55`) — there is no record to check, by design.

---

## Key Points

| Point | Detail |
|---|---|
| Search & Book | Fully in-app, real-time via Socket.IO for availability |
| Pricing shown | Informational / estimate + final calculated amount |
| Payment | 100% external — QR scan or app navigation only |
| No wallet | Parker has no in-app balance or saved payment method |
| Rating | Happens in-app after session, independent of payment |

---

## Related Docs
- `02-after-login-flow.md` — How the user reaches Home/Book a Space
- `08-my-space-flow.md` — Owner side of booking approval and exit verification
- `../overview/product.md` — Why there's no in-app payment
