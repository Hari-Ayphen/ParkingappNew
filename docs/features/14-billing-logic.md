# Billing Logic (Owner Toggle-Based Billing)

## Overview
SpotKey does **not** charge owners a subscription. Instead, owners are billed a **usage-based platform fee** determined entirely by their **ON/OFF toggle**, calculated per calendar day, invoiced every 7 days, and auto-debited via UPI mandate the day after.

This is the single most important business logic in the Owner flow — implement it exactly as described below.

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
