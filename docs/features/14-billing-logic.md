# Billing Logic (Owner Toggle-Based Billing)

- **Status:** agreed
- **Milestone:** `v0.5` (work items `v0.5-A`, `v0.5-B`, `v0.5-C`, `v0.5-E`)
- **Owner:** unassigned

## Overview
SpotKey does **not** charge owners a subscription. Instead, owners are billed a **usage-based platform fee** determined entirely by their **ON/OFF toggle**, calculated per calendar day, invoiced every 7 days, and auto-debited via UPI mandate the day after.

This is the single most important business logic in the Owner flow — implement it exactly as described below.

---

## Users & roles

| Role | What they can do here |
|---|---|
| Owner | Toggle a space ON/OFF, see the running cycle total, receive the Day-7 invoice, be auto-debited on Day 8 |
| Parker | Nothing. The platform fee is invisible to Parkers and is not part of any parking payment |
| Admin | View invoices and cycles, handle failed auto-debits, adjust a disputed amount (`PAYMENTS.md` / `INVOICES.md`) |
| System (scheduled job) | Close each calendar day's meter row, close the cycle on Day 7, issue the invoice, present the debit on Day 8 |

## User stories

### US-1 — Confirm before a space starts costing money

As an **owner**, I can **see a one-time confirmation before my space ever goes live** so that
**billing never starts on me without my saying yes**.

- **AC1:** Given a space that has never been live, when I tap its toggle to ON, then a
  confirmation toast appears and the space does **not** go live until I tap OK.
- **AC2:** Given the confirmation toast, when I tap Cancel, then the toggle returns to OFF, no
  `space_live_day` row is written, and no billing cycle starts.
- **AC3:** Given the confirmation toast, when I tap OK, then the space goes live, today becomes
  Day 1 of the cycle, and today is metered as a live day.
- **AC4:** Given a space that has been live at least once before, when I toggle it ON or OFF,
  then no toast appears and the change applies immediately.
- **AC5:** Given I own two spaces, when I confirm the toast for the first one, then the second
  space still shows its own first-activation toast — the toast is per space, not per owner.

### US-2 — Resolve a space's daily rate from the rate table

As the **system**, I can **look up a space's daily rate from `platform_rate` using its slot count
and vehicle type** so that **a pricing change is a data change, not a deploy**.

- **AC1:** Given a space with a declared slot count and vehicle type, when its rate is resolved,
  then the value comes from the `platform_rate` row matching (`vehicle_type_id`, slot-count band)
  with the latest `effective_from` not in the future.
- **AC2:** Given the codebase, when it is searched for a rate literal, then none exists — no rate
  value appears in application code, migrations, or config.
- **AC3:** Given a price change, when it is applied, then a **new** `platform_rate` row is
  inserted with a new `effective_from`; no existing row is updated or deleted.
- **AC4:** Given an invoice issued before a price change, when it is recalculated afterwards,
  then it produces the same total — because each day's amount was stored as applied.
- **AC5:** Given a space whose (vehicle type, slot count) has no matching `platform_rate` row,
  when a rate is requested, then the toggle-ON is refused with an explicit error and no day is
  metered — the system never falls back to a default or zero.

### US-3 — Meter only the days a space was actually ON

As an **owner**, I can **be charged only for the calendar days my space was live** so that
**turning it off genuinely costs me nothing**.

- **AC1:** Given a space live for a calendar day, when that day closes, then exactly one
  `space_live_day` row exists for (`space_id`, `date`) with `was_live = true` and
  `charged_paise` set to the rate as applied that day.
- **AC2:** Given a space OFF for a whole calendar day, when that day closes, then it contributes
  `0` paise to the cycle total.
- **AC3:** Given a space listed but never once toggled ON, when any cycle closes, then it has no
  `space_live_day` rows and appears on no invoice — ever.
- **AC4:** Given a space toggled ON and OFF several times in one day, when that day closes, then
  it is still charged at most once for that day (unique constraint on `space_id`, `date`).
- **AC5:** Given an owner with several live spaces, when the cycle total is computed, then it is
  the sum across spaces, each at its own rate.

### US-4 — Get an invoice at the end of every 7-day cycle

As an **owner**, I can **receive an itemised invoice on Day 7** so that **I know what I am about
to be debited and why, before it happens**.

- **AC1:** Given a cycle that began at first-ever activation, when Day 7 ends, then an `invoice`
  is generated whose `total_paise` equals the sum of that cycle's `space_live_day.charged_paise`.
- **AC2:** Given a generated invoice, when it is issued, then it is sent by **email** (to the
  address captured at Profile Completion) **and** by WhatsApp.
- **AC3:** Given an owner who has disabled notifications in Settings, when an invoice is issued,
  then the email is still sent — invoice email is financially required and not opt-out.
- **AC4:** Given the invoice, when I open it, then it shows per space: the space name, the number
  of live days, the rate applied, and that space's subtotal.
- **AC5:** Given Day 8, when it begins, then a new 7-day cycle starts regardless of whether any
  space is currently ON or OFF.
- **AC6:** Given a cycle in which every day was OFF, when Day 7 ends, then the total is zero and
  no debit is presented. *(Whether a zero invoice is still issued for the record is an open
  question below.)*

### US-5 — Be auto-debited on Day 8 without lifting a finger

As an **owner**, I can **have the cycle total collected automatically via my UPI Autopay mandate**
so that **I never have to remember to pay a platform fee**.

- **AC1:** Given an issued invoice with a non-zero total, when Day 8 arrives, then a debit for
  exactly that total is presented against the owner's active Razorpay UPI Autopay mandate.
- **AC2:** Given a successful debit, when the webhook confirms it, then the invoice moves to
  `paid` and the owner is notified by push.
- **AC3:** Given a failed debit (insufficient balance, revoked or lapsed mandate), when the
  webhook reports it, then the invoice moves to `failed`, the owner is notified, and it surfaces
  in the admin panel for handling.
- **AC4:** Given any debit attempt, when it is made, then it uses **only** the Autopay mandate —
  no Parker-facing payment path, checkout, or card entry exists anywhere in this flow.
- **AC5:** Given the owner changed their UPI ID after the invoice was issued, when the debit runs,
  then it still uses the mandate recorded at issue time — the issued invoice is not retargeted.

### US-6 — Turn a space off without disturbing the cycle

As an **owner**, I can **toggle a space OFF freely** so that **I can stop being bookable without
penalty, reset, or losing my place in the cycle**.

- **AC1:** Given a live space mid-cycle, when I toggle it OFF, then the cycle start and end dates
  are unchanged — OFF never pauses, resets, or cancels the cycle.
- **AC2:** Given I toggle a space OFF, when the map is queried, then that space is not returned
  and cannot receive new booking requests.
- **AC3:** Given a session already active or approved on that space, when I toggle it OFF, then
  the session continues to completion and is not cut off.
- **AC4:** Given I toggle a space OFF, when the day closes, then no cancellation fee, penalty, or
  minimum charge of any kind is applied.

## Business rules

- **BR-1:** The platform fee is **not a commission and not a subscription**. It is charged per
  calendar day a space is toggled ON. Zero ON days in a cycle costs zero. SpotKey cannot observe
  parking income, so a percentage model is not merely unwanted — it is unmeasurable.
- **BR-2:** The daily rate is a **function of slot count × vehicle type** (ADR-0003), never a flat
  fee. A flat fee makes a one-slot 2-wheeler driveway subsidise a commercial lot and prices out
  the launch supply.
- **BR-3:** Rates are read from the `platform_rate` lookup table, seeded via `db:seed`. **No rate
  value may appear in application code or a migration** — baking one in turns a pricing change
  into a deploy.
- **BR-4:** `platform_rate` is **append-only** with `effective_from`. A price change inserts a new
  row; nothing is updated in place. Updating in place would silently reprice every historical
  invoice on recalculation.
- **BR-5:** `space_live_day.charged_paise` stores the rate **as applied that day**, not a foreign
  key to the current rate — so an old invoice stays reproducible after a price change.
- **BR-6:** One `space_live_day` row per (`space_id`, `date`), enforced by a unique constraint.
  Double-metering a day is a real overcharge on a real card.
- **BR-7:** The cycle is a **rolling 7 days from first-ever activation**, per owner. Invoice on
  Day 7, auto-debit on Day 8, next cycle starts Day 8 regardless of current toggle state.
- **BR-8:** Toggling OFF never pauses, resets, or cancels the cycle, and carries no penalty.
- **BR-9:** The first-activation toast is shown **once per space**, not once per owner.
  Publishing a space is free and instant; **toggling ON is the billable act**. A space is never
  auto-activated on publish.
- **BR-10:** Razorpay is used for the mandate debit and nothing else. Parker→Owner payment is
  fully external (QR / deep-link / cash) and untracked.
- **BR-11:** All money is an **integer in paise**. No floats, anywhere, at any layer.
- **BR-12:** Invoice email is always sent, regardless of the owner's notification preferences —
  it is a financial record, not a marketing message.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `platform_rate` | new | `vehicle_type_id`, `slot_count_min`, `slot_count_max`, `paise_per_day`, `effective_from`. **Append-only.** Seed values `[OPEN]` |
| `space_live_day` | new | The meter — `space_id`, `date`, `was_live`, `charged_paise` (rate as applied) |
| `billing_cycle` | new | `owner_id`, `cycle_start`, `cycle_end`, `invoice_id` |
| `invoice` | new | `owner_id`, `cycle_start`, `cycle_end`, `total_paise`, `invoice_status_id`, `issued_at` |
| `invoice_line` | new | Per space per cycle; links back to the `space_live_day` rows that produced it |
| `invoice_status` | new (lookup) | draft, issued, debit_pending, paid, failed, retrying |
| `space` | changed | Needs a "has ever been activated" marker to decide whether the first-activation toast is due |
| `autopay_mandate` | read-only here | Owned by `23-upi-autopay-mandate-flow.md`; this flow reads its status and debits against it |

**Invariants this introduces:** one billing row per space per calendar day (Invariant 6);
`platform_rate` is never updated in place; an issued invoice pins the mandate used at issue time
(Invariant 10). Recorded in [`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| My Space (toggle + first-activation toast) | `/(owner)/spaces` | `pages/my-spaces.md` |
| Earnings (current cycle fee due) | `/(owner)/earnings` | `pages/earnings.md` |
| Invoice detail | `/(owner)/invoices/[id]` | `pages/invoice-detail.md` |

## Out of scope

- **Parker→Owner payment.** Entirely external — QR, deep-link, or cash. No gateway, no
  transaction record, no in-app "Pay" button. Wiring one is a product violation.
- **Subscriptions, plans, tiers, or free trials.** There is no recurring fixed fee.
- **Any commission or percentage of parking income.** SpotKey cannot observe it.
- **The mandate setup flow itself** — `23-upi-autopay-mandate-flow.md`.
- **Auto-debit retry policy, dunning, and admin adjustment UI** — `PAYMENTS.md` / `INVOICES.md`,
  neither of which exists yet (Known Gotcha 4).
- **Refunds, credits, and proration.** No mechanism is specified.
- **Owner-facing earnings display** — `13-earnings-flow.md`.
- **Delete-account mid-cycle** with an unpaid invoice — unresolved (Known Gotcha 8).

## Open questions

- [ ] **The `platform_rate` table has no values.** The shape is decided (slots × vehicle type,
      ADR-0003); the numbers are pending from the product owner. **This blocks the entire
      milestone** — nothing here can be tested end to end without them.
- [ ] **What does "ON for a calendar day" actually mean?** Any moment of ON during the day, or
      the toggle state sampled at a fixed cutoff time? This decides whether five minutes of ON
      costs a full day. *(Known Gotcha 3 — settle before implementing the meter.)*
- [ ] **Is an active autopay mandate required before the first toggle-ON?**
      `23-upi-autopay-mandate-flow.md:69` says yes, and `architecture/data.md` Invariant 3 encodes
      it. This doc and `08-my-space-flow.md` show toggle → toast → billing with no mandate step.
      *(Known Gotcha 2 — the owner's first-run sequence is ambiguous and must be resolved before
      this milestone closes.)*
- [ ] Which timezone defines a "calendar day"? IST for everyone, or the space's local time?
- [ ] Is a zero-total invoice still issued for the record, or is invoicing skipped entirely for a
      cycle with no live days?
- [ ] Does a space toggled OFF mid-day, on a day already metered as live, stay charged? BR-3 of
      §6 implies yes for in-progress sessions but the general case is unstated.
- [ ] What happens to an open cycle when a space is suspended by admin, or the owner deletes their
      account? (Known Gotcha 8.)
- [ ] The WhatsApp BSP is unchosen and template approval has lead time — this blocks the WhatsApp
      half of invoice delivery (Known Gotcha 5).

---

## 1. First-Time Activation — Confirmation Toast

The very **first time** an owner taps a space's toggle to ON, a confirmation toast/dialog must appear:

```
┌─────────────────────────────────────────┐
│  Activate this space?                     │
│                                             │
│  Billing will start from today.              │
│  You can turn it on/off anytime after this.   │
│                                                 │
│        [ Cancel ]        [ OK ]                 │
└─────────────────────────────────────────┘
```

- **Cancel** → toggle stays OFF, nothing happens, no billing starts.
- **OK** → toggle turns ON, space goes live, **billing cycle begins today (Day 1)**.
- This toast is shown **only once per space**, on its very first activation. Every toggle action after this — ON or OFF — happens instantly with **no confirmation dialog**.

---

## 2. What a Live Day Costs — Slot Count × Vehicle Type

The daily rate is **not one flat number for every space**. It is a function of what the space
actually provides:

```
daily rate = f(number of slots, vehicle types supported)
```

A 3-slot driveway accepting 4-wheelers costs more per live day than a 1-slot accepting
2-wheelers. Both figures come from Step 3 of `09-add-space-flow.md`, which is already where the
owner declares slot count and supported vehicle types.

> **`[OPEN]` The rate table does not exist yet.** The shape is decided; the numbers are pending
> from the product owner. **Do not hardcode a figure anywhere** — read the rate from a lookup
> table keyed on (vehicle type, slot count), seeded via `db:seed`. Baking a number into code or
> a migration means a pricing change becomes a deploy.

> Why this shape and not a flat fee: a flat rate makes a single 2-wheeler driveway subsidise a
> 10-slot commercial lot, and prices the smallest suppliers — the ones you need most at launch —
> out of the market.

---

## 3. Daily Charge Logic — Only ON Days Count

Billing is calculated **per calendar day**, based on whether the toggle was ON for that day.

**Rule:**
- If the toggle is **ON** on a given day → that day's rate is added to the running total.
- If the toggle is **OFF** on a given day → that day contributes **₹0**, nothing is added.
- The owner can toggle ON and OFF as many times as they want, any day, with no restriction and no penalty — only the resulting ON/OFF state per day matters for billing.

> **`[OPEN]` "ON for a day" is still not precisely defined.** Does any moment of ON count, or is
> the state sampled at a cutoff time? This decides whether an owner who flips ON for five minutes
> is charged a full day. Settle it before implementing — it is the difference between a fair
> meter and a trap.

### Example

Using a placeholder rate of `R` per live day for one space (see the open rate table above):

```
Cycle starts: Monday (first-ever toggle ON, confirmed via toast)

Monday     → ON  → R charged
Tuesday    → ON  → R charged
Wednesday  → OFF → ₹0 (not charged)
Thursday   → ON  → R charged
Friday     → ON  → R charged
Saturday   → OFF → ₹0 (not charged)
Sunday     → ON  → R charged

Total after 7 days = 5 active days × R
```

An owner with several live spaces is charged per space, each at its own rate — the cycle total is
the sum across all of them.

---

## 3. The 7-Day Cycle

- The cycle **starts counting from Day 1** — the day of first-ever toggle ON (confirmed via the toast).
- It runs for **7 calendar days**.
- At the end of Day 7:
  - Total amount = sum of all ON-days' charges within that window.
  - **Invoice is generated automatically.**
  - Invoice sent via:
    - **Email** (to the address captured at Profile Completion)
    - **WhatsApp notification**
- A **new 7-day cycle starts immediately** on Day 8 (rolling cycle), regardless of whether the space is currently ON or OFF — the clock keeps rolling as long as the space has been activated at least once.

---

## 4. Auto-Debit

- On **Day 8** (the day after the 7-day cycle ends and invoice is sent), the total amount for that completed cycle is **auto-debited** from the owner's account.
- Auto-debit uses the **UPI mandate** set up from the **UPI ID captured during Profile Completion**.
- **Implementation:** Razorpay UPI Autopay (or equivalent) creates and charges the recurring mandate. This is the **only** payments-gateway integration in the app — it exists purely for this platform-fee auto-debit, not for any Parker-to-Owner payment (which is external, per `06-booking-flow.md`).
- No manual payment action is required from the owner — it is fully automatic.
- If auto-debit fails (insufficient balance, mandate issue, etc.) → handled via admin panel (`PAYMENTS.md` / `INVOICES.md` — retry logic, owner notification).

---

## 5. Full Timeline Example

```
Day 1 (Mon): First toggle ON → Toast shown → OK tapped
             → Space live, billing starts, R counted
Day 2 (Tue): Toggle ON → R counted (no toast)
Day 3 (Wed): Toggle OFF → ₹0 (space offline, not on map)
Day 4 (Thu): Toggle ON → R counted
Day 5 (Fri): Toggle ON → R counted
Day 6 (Sat): Toggle OFF → ₹0
Day 7 (Sun): Toggle ON → R counted
             → END OF CYCLE: Total = 5R
             → Invoice generated → Email + WhatsApp sent
Day 8 (Mon): Auto-debit 5R from owner's UPI mandate
             → New 7-day cycle (Day 1 of next cycle) begins
```

where `R` is that space's daily rate, derived from its slot count and vehicle types (§2).

---

## 6. Toggle OFF — No Penalty, No Impact on Cycle

- Turning OFF does **not** pause, reset, or cancel the 7-day cycle — the cycle keeps rolling on a fixed 7-day clock from the original activation date.
- Turning OFF only means: space is invisible on the map, cannot receive new bookings, and that day is not charged.
- Sessions already active/approved when owner toggles OFF should still be allowed to complete normally (billing for the space continues to reflect the day as active since a booking was in progress) — exact edge-case handling can be refined during implementation, but the toggle should never abruptly cut off an in-progress parker session.

---

## Key Rules Summary

| Rule | Behavior |
|---|---|
| First activation | Shows confirmation toast (OK/Cancel), one-time only |
| After first activation | Toggle ON/OFF instantly, no toast, no restriction |
| Daily rate | **Function of slot count × vehicle type**, per space — never a flat fee. Rate table `[OPEN]` |
| Daily charge | Only counted on days toggle is ON |
| Multiple spaces | Charged per space at its own rate; cycle total is the sum |
| Cycle length | 7 days, rolling, starts from first-ever activation |
| Invoice | Auto-generated Day 7, sent via Email + WhatsApp |
| Auto-debit | Day 8, via UPI mandate from Profile Completion |
| Subscription | None — pure usage-based, no fixed recurring fee |

---

## Related Docs
- `08-my-space-flow.md` — Where the toggle lives in the UI, and space management flow
- `02-after-login-flow.md` — Where UPI ID is captured (Profile Completion)
- `../overview/product.md` — Why there's no subscription and no in-app payment
