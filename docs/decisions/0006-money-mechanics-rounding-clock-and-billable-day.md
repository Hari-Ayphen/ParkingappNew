# ADR 0006: Money mechanics — duration rounding, the session clock, and the billable day

- **Status**: Accepted
- **Date**: 2026-07-20
- **Deciders**: Claude during spec hardening; needs product-owner ratification

## Context

Three quantities were referenced throughout the specs but never defined. Each one changes every
figure the product prints, and all three were discovered during the Stage 6 story backfill:

1. **How elapsed time becomes an amount.** `12-exit-verification-flow.md` said "duration × hourly
   rate" and stopped. A 1h47m session at ₹30/hr could defensibly be ₹53.50, ₹55, ₹60 or ₹53.
2. **When the session clock runs.** `06-booking-flow.md` placed a live timer in the Active
   sub-state but never named the start or stop events.
3. **What "ON for a calendar day" means** for the owner's platform fee
   (`14-billing-logic.md`), which decides whether five minutes of toggle costs a full day.

These are unusually load-bearing here because **payment happens outside the app and is never
tracked**. A parker pays by UPI QR or cash, and SpotKey cannot verify the transfer. A figure that
feels arbitrary cannot be reconciled against a payment record — it goes straight to human
mediation (`17-support-flow.md:55`). The numbers have to be defensible on their face.

## Decision

### 1. Duration → amount

1. Billable duration = elapsed time **rounded up to the next 15 minutes**.
2. **Minimum 30 minutes.**
3. Final amount = billable duration × locked rate, **rounded up to whole rupees**.

`1h05m @ ₹30/hr → 1h15m → ₹37.50 → ₹38`

### 2. The session clock

Runs from **OTP verification** (entry to Active) to **the Parker signalling exit** (entry to Exit
Verification). The Owner's later confirmation validates condition and closes the session but
**cannot extend the billable period**.

### 3. The billable day

A calendar day is billable if the space was live for **one hour or more, cumulative, in IST**.
Below one hour it is free. A day carrying an active session is always billable.

## Consequences

**Positive**: Every printed figure is now derivable and explainable to both parties without
reference to a transaction record — which matters because no such record exists. Whole-rupee
amounts are payable in cash, note for note. Owner latency cannot inflate a parker's bill, which
removes a standing incentive to stall at exit. The one-hour floor stops the toggle behaving as a
trap.

**Negative**: Three rules where there were none, each with an edge someone will eventually
question — 59 minutes free vs 61 minutes billed; a 20-minute session billed as 30. Rounding up
always favours the owner, so a parker who reads carefully will notice they never round down.

The 15-minute increment also means the live running amount **steps rather than ticks**. The
screen should show what the parker would owe if they left now, so the number stays actionable
rather than decorative.

**Neutral**: All three are configuration, not structure. Changing the increment, the minimum, or
the floor is a constant, not a migration.

## Alternatives considered

- **Bill to the exact minute** — rejected. Produces amounts like ₹53.50 that cannot be handed over
  in cash, and ignores that a slot cannot be re-let for the thirteen minutes someone overstayed.
- **Round up to the full hour** (the common parking convention) — rejected. Turns 1h05m into ₹60
  against ₹37.50 of use. Reads as a penalty, and this product has no payment protection to absorb
  a sense of unfairness.
- **Clock stops at Owner confirmation** — rejected, and it is the sharpest of these. It bills the
  parker for how quickly the owner happens to check their phone, and rewards owners who delay.
- **Any moment of ON bills the day** — rejected. Makes the toggle a trap; owners stop
  experimenting and leave spaces off, emptying the map.
- **Pro-rata the platform fee by the hour** — rejected. Fairer in the abstract, but it destroys the
  one sentence an owner must understand from a toast: *"you pay for each day your space is on."*
- **Toggle state sampled at a fixed cutoff** — rejected as trivially gameable: on all day, off at
  23:55, pay nothing.

## Evidence in code

- *No code yet.* Verify at implementation: no amount is computed without passing through the
  rounding helper; `booking_session` records both the Active-entry and Parker-exit timestamps
  distinctly from the Owner-confirmation timestamp; the day-meter job applies the one-hour floor
  against cumulative IST minutes.
- Spec basis: `12-exit-verification-flow.md` BR-0, `06-booking-flow.md` BR-11,
  `14-billing-logic.md` §2b.

## Open

- Should the 15-minute increment, 30-minute minimum, and one-hour floor be seeded config rather
  than constants? Consistent with `platform_rate` being data, they probably should be.
- Does the requested duration at Booking Confirm act as a cap, an estimate, or is it ignored at
  billing? Still unresolved (`06-booking-flow.md` open questions) and it interacts with rounding.

---

*Captured pre-implementation on 2026-07-20. **Ratification pending** — Claude-originated decisions
about money the product charges real people.*
