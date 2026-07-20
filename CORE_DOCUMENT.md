# CORE_DOCUMENT.md — Application Definition

The shared, one-page definition of SpotKey that the whole team agrees on. Everything downstream —
feature docs, schema, plan, issues — traces back to this. Revisit and update it if the direction
changes; don't let the code quietly redefine it.

*Filled 2026-07-20 (Stage 1). Supersedes nothing — this is the first version.*

---

## Application Name

**SpotKey** — a peer-to-peer parking marketplace. Domain not yet registered.

## Users

- **Primary: the dual-role individual.** One account, one login, both modes. The same person
  books a space when they need to park, and lists their driveway when they want to earn.
  India-first, phone-primary, authenticated by phone + OTP.

  > There is no "parker persona" and separate "owner persona" — there is one person doing two
  > things. Designing for two personas would produce two apps, two profiles, and a role-selection
  > screen at signup, all of which `docs/overview/product.md:10` explicitly rules out.

- **Secondary: SpotKey operations**, via the desktop admin panel — moderation, dispute mediation,
  space takedowns, and billing operations. Small internal team, not a customer.

## Goal

Let anyone with an empty driveway rent it by the hour to anyone who needs to park nearby — with
the whole arrangement (discovery, booking, arrival, exit) coordinated in one app, and the money
left entirely between the two people.

## Problems Solving

- Drivers circle for parking in dense areas where commercial lots are full, distant, or absent.
- Private spaces — driveways, plots, unused lots — sit empty most of the day earning nothing.
- No low-friction way to connect the two for a few hours. Existing options assume commercial
  operators, monthly commitments, or both.
- Neither side wants to hand payment credentials to a middleman for a ₹120 transaction.

## Subscription Model

**There is no subscription, and no commission on parking income.** Two separate money flows:

| Flow | Who pays whom | SpotKey's role |
|---|---|---|
| **Parking payment** | Parker → Owner, directly | **None.** UPI QR scan, UPI app deep-link, or cash. SpotKey never touches, tracks, or guarantees this money |
| **Platform charge** | Owner → SpotKey | Usage-based, per day a space is **live** (toggle ON) |

Platform charge specifics:

- Charged **per calendar day a space is toggled ON**. A day toggled OFF costs ₹0. A space that is
  listed but never activated costs ₹0, forever.
- **The amount is a function of slot count and vehicle type** — a 3-slot driveway taking
  4-wheelers costs more per live day than a 1-slot taking 2-wheelers.
- Billed on a rolling 7-day cycle; invoice generated day 7, auto-debited day 8 via a Razorpay UPI
  Autopay mandate.

> **`[OPEN]` The rate table does not exist yet.** The *shape* is decided (slots × vehicle type);
> the numbers are not. Nothing downstream should hardcode a figure — see
> `docs/features/14-billing-logic.md`.

> Why usage-based and not a commission: SpotKey cannot observe the parking payment, so it cannot
> take a percentage of something it never sees. Charging for availability is the only model
> consistent with staying out of the money flow.

## Primary Platforms

| Platform | Status |
|---|---|
| **Mobile — Expo, iOS + Android** | **Ships first. This *is* the product.** |
| **Admin — desktop web (Next.js)** | Internal. Same backend; admin actions reflect to mobile live over Socket.IO |
| User-facing web app | Not building |
| Marketing site | Not building |

> These platform answers, plus the technical shape (tenancy, form factor, localisation), are
> captured precisely in the **App Profile** at the top of [`CLAUDE.md`](CLAUDE.md). Keep the two
> consistent.

## Success Metrics

Four metrics, one per failure mode — revenue, supply, conversion, retention:

| # | Metric | Catches |
|---|---|---|
| 1 | **Avg live days per space per month** | The revenue line itself. Income *is* live-days × slots × vehicle type. If this is low, nothing else matters — owners aren't leaving spaces on long enough to earn |
| 2 | **Live space density per area** | A dead marketplace, before a parker complains. No nearby supply means an empty map even when signups look healthy (`docs/features/04-map-search-flow.md:52`) |
| 3 | **Search → completed session rate** | Funnel leaks *after* supply exists: requests expiring, owners rejecting, sessions dying mid-flow |
| 4 | **30-day repeat rate, both sides** | The one-time-novelty trap. Parking is a habit product; the same commuter at the same office daily is the whole business |

> Deliberately capped at four. A fifth axis (auto-debit success rate, ticket volume) belongs in
> operational tracking, not the top-level product dashboard.

## Non-goals

Explicitly out of scope. Each of these has been *decided against*, not merely deferred:

- **Not a payment processor.** No gateway, wallet, stored card, or checkout for parking.
- **No cut of parking income**, ever. The platform charge is not a commission.
- **No subscription or tiers** for owners.
- **No separate owner app.** One account, two modes.
- **No approval queue for listings.** Spaces go live instantly *(decided 2026-07-20 — see
  `docs/features/09-add-space-flow.md`)*.
- **No user-facing web app** and **no marketing site**.
- **No multi-language.** English only.
- **Does not verify that payment actually happened.** The app shows amount *due*, never amount
  *paid* (`docs/features/07-booking-history-flow.md:48`).

---

## Open questions carried into Stage 2

| # | Question | Blocks |
|---|---|---|
| 1 | The slot × vehicle-type rate table — shape decided, numbers pending | Billing implementation |
| 2 | Does Accept Terms sit between OTP and Profile Completion? Docs 19 vs 01/02 disagree | Login flow |
| 3 | Must the Autopay mandate exist before first toggle-ON? Docs 23 vs 14/08 disagree | Owner first-run |
| 4 | The five referenced admin docs don't exist — now the sole safety net | Admin panel |
| 5 | Which WhatsApp BSP? Template approval has lead time | Invoice delivery |
| 6 | Should a large location change on edit reset a space's reviews? | Edit space |

Full detail with line citations in [`CLAUDE.md`](CLAUDE.md) → Known Gotchas.
