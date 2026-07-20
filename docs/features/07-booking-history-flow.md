# Booking History Flow (Parker)

- **Status:** agreed
- **Milestone:** `v0.4` (work item `v0.4-C`)
- **Owner:** unassigned

## Overview
Lets a Parker see all their past (and current) bookings in one list — separate from the live "Active Bookings" state during a session.

---

## Flow Diagram

```
HOME (Parker mode) → "Booking History" tapped
              ↓
┌─────────────────────────────────────┐
│           BOOKING HISTORY              │
├─────────────────────────────────────┤
│  Tabs: [ Active ] [ Completed ] [ Cancelled ] │
│                                           │
│  List of booking cards:                    │
│    - Space name + photo thumbnail            │
│    - Date + duration                            │
│    - Final amount                                 │
│    - Status badge                                    │
│    - Tap → BOOKING DETAIL                                │
└─────────────────────────────────────┘
              ↓
        Tap a completed booking
              ↓
┌─────────────────────────────────────┐
│           BOOKING DETAIL                │
├─────────────────────────────────────┤
│  - Full invoice/receipt                    │
│  - Download invoice (PDF)                     │
│  - Space + owner info                            │
│  - Rating given (if any) / "Rate now" if not        │
│  - Re-book same space shortcut                          │
└─────────────────────────────────────┘
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Parker | Sees their own bookings across Active / Completed / Cancelled, opens any booking's detail, downloads the receipt, rates, re-books, or cancels an eligible one |
| Owner | Nothing here — this is the Parker-side history. The owner's equivalent lives in `11-active-bookings-owner-flow.md` |
| Admin | Reads any booking from the desktop panel when mediating a dispute. Cannot alter history from the mobile surface |

## User stories

### US-1 — See my bookings grouped by state

As a **Parker**, I can **open Booking History and see my bookings split into Active, Completed and
Cancelled** so that **I can find a past session without scrolling through everything**.

- **AC1:** Given I have bookings in each state, when I open Booking History, then three tabs
  render and each lists only bookings in that state, most recent first.
- **AC2:** Given a booking card renders, when I look at it, then it shows the space name and photo
  thumbnail, the date and duration, the amount, and a status badge.
- **AC3:** Given a tab has no bookings, when I select it, then I see an empty state naming that
  tab, not a blank list.
- **AC4:** Given the list is loading or the request fails, when I open the tab, then I see a
  loading state or an error state with a retry — never an indefinite spinner.

### US-2 — Jump from Active into the live session

As a **Parker**, I can **tap a booking in the Active tab and land in the live session screen** so
that **history is a way back into what's happening now, not a dead end**.

- **AC1:** Given I have an in-progress session, when I tap it in the Active tab, then I land on
  the live Active Session screen from `06-booking-flow.md`, not a static detail page.
- **AC2:** Given I have an approved but not-yet-started booking, when I tap it, then I land on its
  Booking Detail with the cancel action available (see `21-cancellation-flow.md`).
- **AC3:** Given the session's state changes while I'm on the list, when the socket event
  arrives, then the card updates in place without a manual refresh.

### US-3 — Open a completed booking's detail and receipt

As a **Parker**, I can **open a completed booking and see its full breakdown** so that **I have a
record of what I was charged for**.

- **AC1:** Given a completed booking, when I open its detail, then I see the full line-item
  breakdown, the space and owner info, and the session times.
- **AC2:** Given a completed booking, when I look at the amount, then it is labelled as the amount
  **due** — never "paid", "received", or "settled".
- **AC3:** Given a completed booking, when I tap Download, then I get a PDF receipt containing the
  same figures as the screen.
- **AC4:** Given the booking has no rating from me yet, when I open the detail, then I see
  "Rate now"; given I have rated, then I see the rating I gave.
- **AC5:** Given I open any booking that is not mine, when the request is made, then it is refused.

### US-4 — Re-book the same space

As a **Parker**, I can **start a new booking for a space I've used before, from its history entry**
so that **a repeat park takes one tap instead of a fresh search**.

- **AC1:** Given a completed booking, when I tap "Book again", then I land on that space's detail
  with a fresh booking, not a copy of the old one.
- **AC2:** Given the space has since been deleted or suspended by admin, when I tap "Book again",
  then I am told it is unavailable and no booking is started.
- **AC3:** Given the space's price or details have changed since my last session, when I re-book,
  then I see the current values, never the historical ones.

### US-5 — See cancelled bookings and why

As a **Parker**, I can **see bookings that were cancelled or rejected and the reason given** so
that **I'm not left guessing why a space I booked never happened**.

- **AC1:** Given a booking the owner rejected, when I open it, then the Cancelled tab shows it
  with the rejection reason.
- **AC2:** Given a booking the owner cancelled after approving, when I open it, then I see the
  owner's required reason.
- **AC3:** Given a booking I cancelled myself, when I open it, then it shows as cancelled by me
  with my optional reason if I gave one.
- **AC4:** Given a booking request that auto-expired, when I open it, then it appears in Cancelled
  labelled as expired, distinct from a rejection.

## Business rules

- **BR-1:** **The app shows the amount DUE, never the amount PAID.** SpotKey processes no
  Parker→Owner payment and has no transaction record — displaying "paid" would assert something
  the system cannot know, and would imply a guarantee SpotKey cannot honour.
- **BR-2:** For the same reason there is **no payment status field** anywhere in history — no
  "pending payment", no "settled", no reconciliation badge.
- **BR-3:** History is read-only about the past. Amounts on a completed booking are frozen at
  completion; the only thing that changes them is an admin adjustment following a dispute
  (`25-issue-dispute-report-flow.md`).
- **BR-4:** A booking belongs to exactly one Parker; history is scoped to the authenticated user.
  Single-tenant, no org scoping.
- **BR-5:** Every booking lands in exactly one of the three tabs. Rejected, parker-cancelled,
  owner-cancelled and auto-expired all land in Cancelled but remain distinguishable by status.
- **BR-6:** Money is stored and computed as integer paise with an ISO 4217 code, formatted only at
  the display edge.
- **BR-7:** The receipt is a **record of the session**, not a tax invoice for a payment SpotKey
  processed. The 7-day platform-fee invoice is a separate document (`14-billing-logic.md`).

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `booking` | changed | Reads existing rows; needs indexes on (`parker_user_id`, `status_id`, `created_at`) for tab paging |
| `booking_status` | existing (seed) | Lookup — must distinguish rejected / parker-cancelled / owner-cancelled / expired within the Cancelled tab |
| `session` | existing | Start/end times and computed `amount_due_paise` shown on detail |
| `rating` | existing | Read-only here, to show "Rate now" vs the rating given (`24-rating-review-flow.md`) |

**Invariants this introduces:** no table in this feature stores a payment state — the absence is
deliberate and should be asserted in review. `amount_due_paise` is immutable after session
completion except by an audited admin adjustment. Record in
[`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Booking History | `/(app)/bookings` | `pages/booking-history.md` |
| Booking Detail | `/(app)/bookings/[id]` | `pages/booking-detail.md` |

## Out of scope

- **Any notion of payment status, receipts of payment, or reconciliation.** There is no
  transaction to reconcile.
- **Refunds.** Nothing was charged in-app; there is nothing to refund.
- **The owner's booking history.** `11-active-bookings-owner-flow.md`.
- **The live session UI itself.** `06-booking-flow.md` — this doc only links into it.
- **Cancelling a booking.** `21-cancellation-flow.md` owns the action; history only shows the
  outcome and hosts the entry point.
- **Submitting a rating.** `24-rating-review-flow.md`.
- **Raising a dispute about an amount.** `25-issue-dispute-report-flow.md`.
- **Exporting history in bulk** (CSV, date-range statements).

## Open questions

- [ ] How far back does history go, and is the list paginated or infinite-scroll? No volume or
      retention rule is stated.
- [ ] Is the PDF receipt generated on demand or stored at session completion? This decides whether
      an admin amount adjustment silently rewrites a receipt the Parker already downloaded.
- [ ] When an admin adjusts a disputed amount, does the Parker see the old figure, the new one, or
      both with an audit note?
- [ ] Should the Cancelled tab surface *who* cancelled as a distinct badge, or only in detail?
- [ ] Does "Book again" carry the previous duration and vehicle as defaults, or start empty?

---

## Key Behavior

| Element | Behavior |
|---|---|
| Active tab | Shows any in-progress session — tapping jumps straight into the live Active Session screen (see `06-booking-flow.md`) |
| Completed tab | Fully finished sessions, invoice always available |
| Cancelled tab | Bookings rejected by owner or cancelled by parker before session start |
| No payment status shown | Since payment is external (QR/app navigation), the app shows the amount **due**, not amount **paid** — it does not track whether the Parker actually completed the external payment |

---

## API Touchpoints (indicative)
- `GET /bookings/me?status=active|completed|cancelled`
- `GET /bookings/:id/invoice`

---

## Related Docs
- `06-booking-flow.md` — The live session this history is built from
- `02-after-login-flow.md` — Home screen entry point
