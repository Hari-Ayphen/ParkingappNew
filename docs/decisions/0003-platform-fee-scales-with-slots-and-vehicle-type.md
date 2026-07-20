# ADR 0003: The platform fee scales with slot count and vehicle type

- **Status**: Accepted (rate values still open)
- **Date**: 2026-07-20
- **Deciders**: Product owner

## Context

`docs/features/14-billing-logic.md` originally used a flat **₹500 per live day** in every worked
example. Checked against plausible unit economics, that number inverts the business:

| Space | Gross/day | Flat fee | Owner keeps |
|---|---|---|---|
| Driveway, ₹30/hr × 4hrs occupied | ₹120 | ₹500 | −₹380 |
| ₹50/hr × 10hrs solid | ₹500 | ₹500 | ₹0 |

A single-car driveway would need ~17 occupied hours a day at ₹30/hr just to break even — and the
fee is charged per ON day *regardless of whether anyone books*. The toggle would stop meaning "am
I available?" and start meaning "can I afford to gamble today?", which empties the map.

A separate constraint: `docs/overview/product.md:41` states the platform fee is **not** a cut of
the owner's parking income. SpotKey never observes the parking payment (it is external and
untracked), so a percentage model is not merely undesirable — it is unobservable.

## Decision

The daily rate is a **function of slot count and vehicle type**:

```
daily rate = f(number of slots, vehicle types supported)
```

Both inputs already exist — the owner declares them at Step 3 of
`docs/features/09-add-space-flow.md`. A 3-slot driveway accepting 4-wheelers costs more per live
day than a 1-slot accepting 2-wheelers.

Charging remains per calendar day the toggle is ON, on a rolling 7-day cycle, auto-debited day 8.

**The rate values are not yet decided.** The shape is; the numbers are pending.

## Consequences

**Positive**: The smallest suppliers — the ones most needed at launch — are not priced out by a
rate calibrated for commercial lots. The fee scales with what a space can plausibly earn without
ever touching what it actually earned, preserving the "not a commission" rule.

**Negative**: More complex than a flat fee. Requires a `platform_rate` lookup table keyed on
(vehicle type, slot count band) with `effective_from` temporal versioning, so historical invoices
stay reproducible after a price change. That temporal requirement is easy to get wrong.

**Neutral**: Owners with several spaces are charged per space at its own rate; the cycle total is
the sum.

## Alternatives considered

- **Flat ₹/day for every space** — rejected. Makes one 2-wheeler driveway subsidise a 10-slot
  commercial lot, and prices out the launch supply.
- **One hour of the owner's own declared rate, per live day** — proposed and rejected by the
  product owner in favour of slots × vehicle type. It self-scaled elegantly but keyed off the
  owner's *pricing* rather than what they physically provide.
- **Tiered bands by declared hourly rate** — rejected. Band edges invite gaming (price at ₹30
  instead of ₹31) and the table needs perpetual maintenance.
- **Percentage of parking income** — rejected as impossible, not merely undesirable. SpotKey
  cannot observe the transaction.

## Evidence in code

- *No code yet.* Verify at implementation: a `platform_rate` table exists with `effective_from`;
  no rate literal appears anywhere in application code; `space_live_day.charged_paise` stores the
  rate as applied rather than a FK to the current rate.
- Spec basis: `docs/features/14-billing-logic.md` §2, `CORE_DOCUMENT.md`.

## Open

The rate table has no seed values. This blocks billing implementation and is tracked as open
question #1 in both `CORE_DOCUMENT.md` and `docs/architecture/data.md`.

---

*Captured pre-implementation on 2026-07-20.*
