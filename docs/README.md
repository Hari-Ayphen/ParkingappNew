# SpotKey Documentation

This is the engineering documentation for **SpotKey** — a peer-to-peer parking marketplace mobile
app where one account does both sides: book someone's driveway, or list your own and earn.

**Nothing is built yet.** This documentation is entirely *pre-implementation*: `features/` holds
26 flow specs written before any code, per the spec-first rule below. `modules/` and `pages/` are
empty by design — they get written as screens actually ship. The App Profile that governs how all
of it gets built lives in [`../CLAUDE.md`](../CLAUDE.md).

## Reading these docs: `pnpm docs:viewer`

These docs are markdown in the repo — that's the single source of truth. For a readable hub,
build the offline viewer:

```bash
pnpm docs:viewer      # writes docs/viewer.html
open docs/viewer.html # or just double-click it
```

It's **one self-contained file** (marked + every doc + CSS + JS inlined), so it works from
`file://`, offline, with no server and no CDN. You get a category sidebar, rendered GFM
tables, full-text search with excerpts, light/dark following the OS, and deep links
(`#docs/features/06-booking-flow.md`).

`docs/viewer.html` is git-ignored — it's generated. **Re-run `pnpm docs:viewer` after any doc
change**, or you're reading a stale snapshot.

> **Why not GitHub Pages?** Pages sites are public even when the repo is private —
> access-controlled Pages is GitHub Enterprise Cloud only. For a private repo, publishing docs
> to Pages would leak them. The local viewer keeps docs private and works offline.

## Where to start

- **New to the codebase?** → [`overview/product.md`](./overview/product.md) — what SpotKey is, and
  the principles that constrain everything (especially: no in-app payments)
- **Want the map of every screen?** → [`features/03-page-wise-flow.md`](./features/03-page-wise-flow.md) — master index of all 21 screens
- **About to build something?** → [`features/`](./features/README.md) — the spec comes first
- **Looking up an API?** → [`api/README.md`](./api/README.md)
- **Trying to understand a built feature?** → [`modules/`](./modules/)
- **Wondering why we made a decision?** → [`decisions/`](./decisions/)
- **Working on a screen?** → [`pages/`](./pages/)
- **Writing any UI?** → [`branding/`](./branding/README.md) + [`design/design-system.md`](./design/design-system.md) — read both first
- **Operations/runbooks?** → [`operations/`](./operations/)

## Quick facts

| Topic | Reality |
|---|---|
| Surfaces | `mobile` (Expo — the product) + `admin` (Next.js desktop web, same backend) |
| Admin → mobile | Live over Socket.IO. Suspend a space and it leaves the map at once — no refresh, no re-login |
| Listing a space | **Instant. No admin approval queue.** Published spaces are live-eligible immediately; edits apply at once |
| Moderation | Reactive — ratings, issue reports, and admin takedown after the fact |
| Auth | Phone + OTP, no passwords. Access token 7d / refresh 30d in SecureStore |
| Roles | **One account, two modes** — Parker and Owner, switchable from Home. No separate owner app |
| Tenancy | Single-tenant. Data belongs to the individual user; no org boundary |
| Parker → Owner payment | **External only.** UPI QR + deep-link to GPay/PhonePe. SpotKey processes nothing and tracks nothing |
| Owner → SpotKey payment | Usage-based platform fee. Toggle-ON days only, 7-day cycle, auto-debited Day 8 via Razorpay UPI Autopay mandate |
| Subscriptions | None. Ever |
| Realtime | Socket.IO — live map pins, booking requests, session state |
| Localisation | English only |
| Currency | INR, stored as integer paise |

## The two journeys

| Mode | Entry | Read in order |
|---|---|---|
| **Parker** — search, book, park, pay externally | Home → "Book a Space" | [`04`](./features/04-map-search-flow.md) → [`05`](./features/05-space-detail-flow.md) → [`06`](./features/06-booking-flow.md) → [`07`](./features/07-booking-history-flow.md) |
| **Owner** — list, toggle live, approve, get paid | Home → "My Space" | [`08`](./features/08-my-space-flow.md) → [`09`](./features/09-add-space-flow.md) → [`10`](./features/10-booking-requests-flow.md) → [`11`](./features/11-active-bookings-owner-flow.md) → [`12`](./features/12-exit-verification-flow.md) → [`13`](./features/13-earnings-flow.md) |

Then [`14-billing-logic.md`](./features/14-billing-logic.md) — the platform-fee mechanics
underneath the Owner journey, and the single most important business rule in the app.

## Structure

```
docs/
├── overview/        # what this product is and who it's for
├── features/        # functional specs — written BEFORE the code (26 flow docs live here)
├── branding/        # identity: the feel, voice, brand palette
├── design/          # design-system.md (tokens/components) + per-surface specs
├── architecture/    # how the system is built (incl. data.md — schema + invariants)
├── api/             # endpoints, auth, conventions, per-module
├── modules/         # feature deep-dives — written AFTER the code
├── decisions/       # Architecture Decision Records (ADRs)
├── operations/      # production runbooks
└── pages/           # per-screen docs (one file per screen), written after it ships
```

**Before vs after.** `features/` is what we agreed to build; `modules/` and `pages/` are what
exists. Both survive — the first explains intent, the second explains reality.

## Open questions blocking implementation

Contradictions found across the specs during initialisation. Resolve each **in the doc** before
building the affected flow — never in code first. Full list with line citations in
[`../CLAUDE.md`](../CLAUDE.md) under "Known Gotchas".

| # | Question | Blocks |
|---|---|---|
| 1 | Does Accept Terms sit between OTP and Profile Completion? Docs 19 vs 01/02 disagree | Login flow |
| 2 | Must the Autopay mandate exist before the first toggle-ON? Doc 23 vs 14/08 disagree | Owner first-run |
| 3 | What does "toggle was ON for a day" actually mean? Doc 14 hedges the rule | Billing |
| 4 | The five referenced admin docs don't exist — now the *sole* safety net since approval was removed | Admin panel (critical path) |
| 5 | Which WhatsApp BSP? Template approval has lead time | Invoice delivery |
| 6 | Should a large location change on edit reset a space's reviews? Bait-and-switch is possible without the approval gate | Edit space |

## Conventions

- **Cite code for every non-trivial claim.** Format: `<file-path>:<line>`. A doc claim without a
  code citation is an opinion, not a fact.
- **`[ASSUMPTION]` markers** flag a claim not yet confirmed by a developer. They should not exist
  in finalized docs; each one is a bug or a tracked open question.
- **ADRs are immutable once accepted.** To change a decision, write a new ADR that supersedes the
  old one — never edit the accepted record.
- **Spec before code.** Every feature has a doc in [`features/`](./features/README.md) before its
  first line of code. Its user stories become the GitHub issues.
- **Per-page discipline.** Every screen gets its own doc in [`pages/`](./pages/), updated whenever
  that screen is completed or changed. Copy [`pages/_template.md`](./pages/_template.md).
- **Tokens, not values.** UI references semantic tokens from
  [`design/design-system.md`](./design/design-system.md) — never raw hex.
- **Requirements changed? Doc first.** Update the feature doc, re-plan, then code — never the
  reverse. A change in code but not in docs is invisible to whoever comes next.

---

*Last verified 2026-07 against the initial scaffold. If you find a discrepancy, this doc is wrong — open an issue or update it.*
