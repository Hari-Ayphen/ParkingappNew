# Earnings Flow (Owner)

- **Status:** agreed
- **Milestone:** `v0.5` (work item `v0.5-F`)
- **Owner:** unassigned

## Overview
Where an Owner sees how much they've made — per space, per billing cycle, and historically. Important: this tracks the Owner's **gross earnings from Parkers** (which SpotKey never touches, since payment is external) separately from the **platform fee SpotKey auto-debits** from the Owner (see `14-billing-logic.md`).

---

## Flow Diagram

```
MY SPACE DASHBOARD → "Earnings" tapped
              ↓
┌─────────────────────────────────────┐
│              EARNINGS                   │
├─────────────────────────────────────┤
│  Summary cards (top):                     │
│    - This week's gross earnings estimate     │
│    - Total sessions completed                    │
│    - Platform fee due (current 7-day cycle)          │
│                                                           │
│  Per-space breakdown:                                       │
│    - Space name                                                │
│    - Sessions this cycle                                          │
│    - Estimated gross earnings                                        │
│                                                                           │
│  Billing history (links to invoices):                                       │
│    - Cycle date range                                                          │
│    - Active days that cycle                                                       │
│    - Platform fee charged + auto-debit status                                        │
│    - Tap → Invoice detail / download                                                    │
└─────────────────────────────────────┘
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Owner | View their own estimated gross earnings, current-cycle platform fee, per-space breakdown, and billing history; open an invoice |
| Parker | Nothing. Earnings are owner-only and never shown to a Parker |
| Admin | Sees the same invoice records from the admin panel (`INVOICES.md`), not this screen |

## User stories

### US-1 — See this cycle at a glance

As an **owner**, I can **see my estimated gross earnings and my platform fee due side by side but
clearly separate** so that **I never mistake the fee for a cut of my parking income**.

- **AC1:** Given completed sessions this cycle, when I open Earnings, then a summary card shows
  estimated gross earnings, total sessions completed, and the platform fee due for the current
  7-day cycle.
- **AC2:** Given the summary, when it renders, then gross earnings and platform fee appear as
  **two visually separate figures** — never netted into a single number and never shown as a
  percentage of each other.
- **AC3:** Given the gross earnings figure, when it is displayed, then it is explicitly labelled
  an **estimate**, with an explanation that payment is external and SpotKey cannot confirm receipt.
- **AC4:** Given the platform fee due, when it is displayed, then it reflects only the days so far
  in the current cycle on which a space was live, and it is a running total, not a forecast.
- **AC5:** Given an owner who has never activated a space, when they open Earnings, then the
  platform fee due is zero and no cycle dates are shown.

### US-2 — Break earnings down by space

As an **owner with several spaces**, I can **see which space earned what** so that **I can tell
which of my spaces is worth keeping live**.

- **AC1:** Given more than one space, when I open Earnings, then each space is listed with its
  name, sessions this cycle, and estimated gross earnings.
- **AC2:** Given a space that was live but had no sessions, when the breakdown renders, then it
  appears with zero sessions — it is not hidden, because it still accrued a platform fee.
- **AC3:** Given a space that has never been toggled ON, when the breakdown renders, then it
  contributes zero to both earnings and fees.
- **AC4:** Given a suspended or deleted space, when it had sessions in the current cycle, then it
  still appears in the breakdown — history is not rewritten by a later state change.

### US-3 — Review billing history and open an invoice

As an **owner**, I can **look back over past cycles and open the invoice for each** so that **I
can reconcile what I was actually debited**.

- **AC1:** Given at least one closed cycle, when I open billing history, then each row shows the
  cycle date range, active days in that cycle, the platform fee charged, and the auto-debit
  status.
- **AC2:** Given a history row, when I tap it, then I reach the invoice detail with the per-space
  lines that produced the total.
- **AC3:** Given an invoice issued before a rate change, when I open it later, then it shows the
  amounts **as charged at the time**, not recalculated at today's rate.
- **AC4:** Given a cycle whose auto-debit failed, when I view its row, then the failed state is
  visible and distinguishable from paid.
- **AC5:** Given no closed cycles yet, when I open billing history, then I see an empty state
  explaining that the first invoice arrives at the end of the current 7-day cycle.

## Business rules

- **BR-1:** Gross earnings can only ever be an **estimate**. Parker→Owner payment is external (QR
  / deep-link / cash) and untracked; SpotKey cannot confirm receipt and must never imply it has.
- **BR-2:** Every gross-earnings figure carries an "estimated" qualifier in the UI. An unqualified
  number reads as a settlement statement SpotKey cannot stand behind.
- **BR-3:** **Platform fee and gross earnings are two separate money flows**, always displayed
  separately. They are never netted, and the fee is never expressed as a percentage of earnings —
  it is not a commission.
- **BR-4:** Billing history is read directly from the `invoice` / `invoice_line` records produced
  by `14-billing-logic.md`. This screen **computes no billing of its own** and must never
  re-derive a total from current rates.
- **BR-5:** All amounts are integer paise, formatted for display only at the edge.
- **BR-6:** This screen is read-only. There is no pay, retry, dispute, or withdraw action here.
- **BR-7:** Estimated gross earnings derive from sessions finalised at exit verification
  (`12-exit-verification-flow.md`) — not from bookings created, which may never have been parked.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `invoice` | read-only | Billing history rows, totals, status |
| `invoice_line` | read-only | Per-space lines behind each invoice |
| `billing_cycle` | read-only | Cycle date ranges, current open cycle |
| `space_live_day` | read-only | Active-days count per cycle, current running fee |
| `session` | read-only | Completed sessions and their finalised amounts, for the estimate |
| `space` | read-only | Space names for the breakdown |

**Invariants this introduces:** none — this flow is entirely read-only. It **depends on**
Invariant 6 (one billing row per space per calendar day) and on `space_live_day.charged_paise`
storing the rate as applied, without which historical figures would drift.

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Earnings | `/(owner)/earnings` | `pages/earnings.md` |
| Invoice detail | `/(owner)/invoices/[id]` | `pages/invoice-detail.md` |

## Out of scope

- **Confirming or reconciling actual Parker payments.** SpotKey never sees the money.
- **Payouts, withdrawals, or a wallet balance.** There is nothing to pay out — owners are paid
  directly by Parkers.
- **Paying, retrying, or disputing a platform-fee invoice from this screen.** Read-only.
- **Tax documents, GST breakdowns, or statements.** Not specified anywhere.
- **Invoice generation and auto-debit** — `14-billing-logic.md`.
- **Mandate setup or status** — `23-upi-autopay-mandate-flow.md`.
- **CSV / accounting export.** Not requested.
- **Parker-side spend history.** This is an owner surface only.

## Open questions

- [ ] **The `platform_rate` table has no values**, so "platform fee due" cannot be computed or
      tested end to end. Blocks this screen along with the rest of the milestone.
- [ ] **"ON for a calendar day" is still undefined**, so "active days this cycle" — a number shown
      directly on this screen — has no agreed meaning yet. *(Known Gotcha 3.)*
- [ ] What is the exact basis of the gross-earnings estimate — the finalised session amount from
      exit verification, or booked duration? These diverge when a Parker overstays or leaves early.
- [ ] Does the estimate include sessions where the Parker disputed the amount, and if so at which
      value — original or admin-adjusted?
- [ ] Is a downloadable invoice (PDF) in scope, or only the in-app detail view? The flow diagram
      says "download" but no format or generator is specified.
- [ ] How far back does billing history go, and is it paginated?
- [ ] Does this screen surface an unpaid or failed invoice prominently, or only inside the history
      row? A failed debit the owner never notices becomes a support ticket.

---

## Key Behavior

| Element | Detail |
|---|---|
| "Gross earnings" is an estimate | Since payment is external (QR/app navigation), SpotKey can only estimate what the Owner *should* have received based on completed sessions — it cannot confirm actual receipt |
| Platform fee ≠ gross earnings | The platform fee (auto-debited every 7 days) is a small usage-based charge for the days the space was live — **not** a cut of the Owner's parking income. These are two separate money flows, shown separately |
| Billing history | Pulls directly from the invoice records generated in `14-billing-logic.md`'s 7-day cycle |

---

## API Touchpoints (indicative)
- `GET /owner/earnings/summary`
- `GET /owner/earnings/by-space`
- `GET /owner/invoices` (billing history)

---

## Related Docs
- `08-my-space-flow.md` — Dashboard entry point
- `14-billing-logic.md` — Full detail on the platform fee shown here
- `12-exit-verification-flow.md` — Where each session's amount is finalized
