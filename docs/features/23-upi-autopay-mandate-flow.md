# UPI Autopay Mandate Setup Flow (Owner)

- **Status:** agreed
- **Milestone:** `v0.5` (work item `v0.5-D`)
- **Owner:** unassigned

## Overview
`02-after-login-flow.md` treats "UPI ID" as a single text field captured at Profile Completion. In reality, enabling **auto-debit** (the Day-8 platform fee charge described in `14-billing-logic.md`) requires the Owner to explicitly **authorize a recurring UPI mandate** — a real approval step inside their UPI app (Razorpay UPI Autopay or equivalent), not just typing an ID string. This doc separates the two.

---

## Two Separate Things (Important Distinction)

| Captured at Profile Completion | Set up here, separately |
|---|---|
| **UPI ID** (a VPA like `name@bank`) — used to *generate the exit QR code* Parkers scan | **UPI Autopay Mandate** — an authorized recurring-debit permission the Owner grants SpotKey's payment processor (Razorpay), used for the Day-8 platform fee auto-debit |

A user can have a UPI ID on file (enough to receive Parker payments via QR) **without** having an active Autopay mandate. The mandate is required specifically to let the toggle-based billing in `14-billing-logic.md` actually auto-debit.

---

## Flow Diagram

```
FIRST TIME OWNER TOGGLES A SPACE ON
  (before the first-activation toast in 14-billing-logic.md
   can be confirmed, the mandate must exist)
              ↓
┌───────────────────────────────────────┐
│   DOES THIS OWNER HAVE AN ACTIVE          │
│   AUTOPAY MANDATE ALREADY?                   │
└───────────────────────────────────────┘
        NO                        YES
         ↓                          ↓
┌─────────────────────┐    Skip straight to the
│  SET UP AUTOPAY         │    toggle-ON confirmation
│  MANDATE SCREEN            │    toast (14-billing-logic.md)
├─────────────────────┤
│  - Explains what this is:      │
│    "Authorize SpotKey to           │
│    auto-collect your weekly           │
│    platform fee via UPI"                 │
│  - Max mandate amount (a cap,               │
│    e.g. ₹2,000/cycle, for safety)              │
│  - "Set Up Autopay" button                        │
└─────────────────────┘
         ↓
   Redirects to Razorpay UPI Autopay flow
   (opens the Owner's UPI app to approve
    the mandate — happens outside SpotKey's UI,
    same navigation pattern as Parker payment
    in 06-booking-flow.md, but for mandate
    authorization, not a one-time payment)
         ↓
┌───────────────────────────────────────┐
│   MANDATE APPROVED IN UPI APP?           │
└───────────────────────────────────────┘
     YES                        NO / CANCELLED
      ↓                              ↓
Mandate active,              Toggle stays OFF,
return to app,               owner sees "Autopay
proceed to toggle-ON          setup required" state,
confirmation toast             can retry anytime
(14-billing-logic.md)
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Owner | Set up, view, retry, and (from their own UPI app) revoke the Autopay mandate |
| Parker | Nothing. Parkers never authorize a mandate — parking payment is external |
| Admin | See mandate status on an owner's record; diagnose failed debits. Admin cannot create or approve a mandate on an owner's behalf |
| Razorpay | Hosts the authorization flow and reports mandate state changes by webhook |

## User stories

### US-1 — Understand that a UPI ID is not a mandate

As an **owner**, I can **see plainly that my saved UPI ID and my Autopay authorization are two
different things** so that **I don't assume auto-debit is set up when it isn't**.

- **AC1:** Given I completed my profile with a UPI ID, when I open the Autopay screen, then it
  states in plain English that my UPI ID is used to receive parking payments and that Autopay is
  a separate authorization for the weekly platform fee.
- **AC2:** Given I have a UPI ID on file but no mandate, when I view my Autopay status, then it
  reads "not set up" — a saved UPI ID never displays as an active mandate.
- **AC3:** Given the Autopay screen, when it renders, then it explains what will be debited (the
  7-day platform fee), when (Day 8), and that a per-cycle maximum applies.

### US-2 — Authorize the mandate

As an **owner**, I can **authorize a recurring UPI debit inside my own UPI app** so that **the
Day-8 platform fee can be collected without me doing anything each cycle**.

- **AC1:** Given no active mandate, when I tap "Set Up Autopay", then `POST
  /owner/autopay/mandate` creates a Razorpay mandate request and a local row is written with
  status `pending`.
- **AC2:** Given the mandate request, when it is created, then the app hands off to the Razorpay
  UPI Autopay flow, which opens my UPI app for approval — the authorization never happens inside
  SpotKey's own UI.
- **AC3:** Given I approve the mandate in my UPI app, when Razorpay's webhook confirms it, then
  `autopay_mandate.mandate_status` becomes `active` and `authorized_at` is set.
- **AC4:** Given the mandate becomes active, when I return to the app, then I see an active
  status without having to force a refresh or log out and back in.
- **AC5:** Given the mandate is created, when it is stored, then `max_amount_paise` records the
  per-cycle cap agreed during authorization, as an integer in paise.

### US-3 — Recover from a cancelled or failed authorization

As an **owner**, I can **retry after a failed or abandoned Autopay setup** so that **one
mis-tap doesn't permanently block me from going live**.

- **AC1:** Given I cancel in my UPI app, when I return to SpotKey, then the space stays OFF, the
  mandate row is not left at `pending` indefinitely, and I see an "Autopay setup required" state.
- **AC2:** Given a failed or cancelled setup, when I tap the retry action, then a fresh mandate
  request is created — I am never locked out after one attempt.
- **AC3:** Given I abandon the flow and never return, when I later open My Space, then nothing
  has been charged and no billing cycle has started.
- **AC4:** Given Razorpay's webhook never arrives, when the app polls `GET
  /owner/autopay/mandate/status`, then the displayed status reconciles with Razorpay's rather
  than remaining stuck on the local `pending` value.

### US-4 — Detect a revoked or lapsed mandate

As an **owner**, I can **be told when my Autopay authorization is no longer valid** so that **a
silently dead mandate doesn't turn into an unpaid invoice I never heard about**.

- **AC1:** Given I revoke the mandate from my bank or UPI app, when the next Day-8 debit is
  attempted, then it fails, the invoice moves to `failed`, and I am notified.
- **AC2:** Given a mandate detected as revoked or lapsed, when its status is updated, then it is
  no longer `active` and the Autopay screen prompts re-authorization.
- **AC3:** Given a revoked mandate, when I try to toggle a *new* space live for the first time,
  then I am routed to re-authorize first. *(Gate behaviour — see the open question below.)*
- **AC4:** Given a revoked mandate, when spaces are already live, then those spaces are **not**
  silently switched OFF by this flow — an unrelated space going dark on a billing event is worse
  than an unpaid invoice.

## Business rules

- **BR-1:** The **UPI ID** (captured at Profile Completion, used to generate the exit QR Parkers
  scan) and the **UPI Autopay mandate** (a recurring-debit authorization approved inside the
  owner's UPI app) are **two different things**. An owner can hold the former without the latter.
- **BR-2:** A mandate becomes `active` only on confirmation from Razorpay's webhook — never on
  the client returning from the UPI app. The client's return proves nothing about the bank's
  decision.
- **BR-3:** The authorization is completed **outside SpotKey's UI**, in the owner's UPI app.
  SpotKey never collects UPI credentials or a PIN.
- **BR-4:** A per-cycle **maximum debit amount** is agreed at authorization. Its value is not
  decided here — see open questions. It is stored as integer paise.
- **BR-5:** Razorpay exists in this app for **this mandate only**. It is never used for
  Parker→Owner payment, which is external and untracked.
- **BR-6:** The owner may revoke the mandate at any time from their own UPI app; SpotKey cannot
  prevent this and learns of it on the next failed debit or status check.
- **BR-7:** Mandate state lives in a lookup table (`mandate_status`: none, pending, active,
  revoked, lapsed) referenced by FK — not a text enum.
- **BR-8:** An issued invoice pins the mandate used at issue time (Invariant 10), so changing or
  re-authorizing a mandate never retargets an already-issued invoice.
- **BR-9 `[DISPUTED]`:** An active mandate is a **hard precondition** for a space's first-ever
  toggle-ON (Invariant 3). `14-billing-logic.md` and `08-my-space-flow.md` contradict this. See
  open questions — do not implement the gate until it is resolved.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `autopay_mandate` | new | `user_id`, `razorpay_mandate_id`, `max_amount_paise`, `mandate_status_id`, `authorized_at` |
| `mandate_status` | new (lookup) | none, pending, active, revoked, lapsed |
| `user` | read-only here | The UPI ID captured at Profile Completion lives here and is **not** touched by this flow |
| `invoice` | read-only here | Reads the mandate pinned at issue time when a debit is presented |

**Invariants this introduces:** Invariant 3 — a space cannot be toggled live for the first time
without an active mandate (**disputed, see open questions**); Invariant 10 — changing a UPI ID
must not alter issued invoices. Recorded in
[`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Set Up Autopay | `/(owner)/autopay` | `pages/autopay-setup.md` |
| Autopay status / re-authorize | `/(owner)/autopay/status` | `pages/autopay-status.md` |
| Razorpay UPI Autopay handoff | external | n/a — not a SpotKey screen |

## Out of scope

- **Any Parker→Owner payment.** The mandate has nothing to do with parking money.
- **Capturing or changing the UPI ID** — that is Profile Completion,
  `02-after-login-flow.md`.
- **Building a revoke action inside SpotKey.** Revocation happens in the owner's UPI app.
- **Invoice generation and the Day-8 debit run** — `14-billing-logic.md`.
- **Retry / dunning policy after a failed debit** — `PAYMENTS.md` / `INVOICES.md`, unwritten
  (Known Gotcha 4).
- **Cards, netbanking, or wallets.** UPI Autopay only.
- **Admin creating a mandate on an owner's behalf.** Not possible — authorization is the owner's.

## Open questions

- [ ] **Is the mandate really a gate on first toggle-ON?** This doc (`:69`) and
      `architecture/data.md` Invariant 3 say yes. `14-billing-logic.md` and
      `08-my-space-flow.md` show toggle → toast → billing with **no mandate step**. The owner's
      first-run sequence is ambiguous, and the two readings produce materially different
      onboarding. *(Known Gotcha 2 — must be resolved before this milestone closes.)*
- [ ] If the gate stands, does it apply per owner (first space only) or re-check on every
      space's first activation?
- [ ] **What is the per-cycle mandate cap?** Undecided. It cannot be a guess — too low and a
      legitimate debit is rejected; too high and the owner's protection is meaningless. It likely
      depends on the `platform_rate` values, which are themselves undecided.
- [ ] What happens to already-live spaces when a mandate is revoked mid-cycle? AC4 above assumes
      they stay live; that needs product confirmation.
- [ ] How long may a mandate sit at `pending` before it is expired locally?
- [ ] Is mandate authorization ever prompted proactively (e.g. at Profile Completion), or only
      lazily at first toggle-ON?
- [ ] Does the owner need a way to *replace* an active mandate (e.g. changed bank) without
      revoking first?

---

## Key Behavior

| Element | Behavior |
|---|---|
| Gate, not a suggestion | A space **cannot** be toggled live for the first time until an active mandate exists — this is what actually makes Day-8 auto-debit possible |
| Mandate cap | A maximum per-cycle debit amount is set during authorization (standard UPI Autopay behavior) — protects the Owner from an unexpectedly large charge |
| Mandate failure at Day 8 | If the mandate itself has lapsed/been revoked by the Owner in their bank app since setup, the Day-8 auto-debit fails — handled the same as any auto-debit failure in `14-billing-logic.md` (admin retry flow, owner notified) |
| Revoking | An Owner can revoke the mandate from their own UPI app at any time — SpotKey detects this on the next failed debit attempt and prompts re-authorization before allowing further toggle-ON activations |

---

## API Touchpoints (indicative)
- `POST /owner/autopay/mandate` — initiates mandate creation with Razorpay
- `GET /owner/autopay/mandate/status`
- Webhook: Razorpay mandate status callback

---

## Related Docs
- `14-billing-logic.md` — What the mandate is ultimately used for (Day-8 auto-debit)
- `02-after-login-flow.md` — Where the (separate) UPI ID for QR generation is captured
- `08-my-space-flow.md` — Where the toggle lives that this gates
