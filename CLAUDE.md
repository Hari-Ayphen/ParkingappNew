# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## App Profile (source of truth)

> Set by the initialisation interview ([`INITIALISE.md`](https://github.com/) in the starter kit)
> **before any code**. This block is the single source of truth for the app's shape. **Every agent
> reads it and obeys it over any example in its own file.** Changing an axis here is an
> architectural decision — record an ADR and refresh the agents' context (see [`WORKFLOW.md § 6`](WORKFLOW.md)).

| Axis | Value | Notes |
|---|---|---|
| **Surfaces** | `mobile`, `admin` | No user-facing web app and no marketing site. The Expo app **is** the product; `admin` is a desktop web panel on the same backend, and its actions reach mobile live over Socket.IO (see "Admin ↔ Mobile" below) |
| **Form factor** | `mobile-only` | The product is the mobile app. `apps/admin` is **desktop-first** (dense, sidebar, tables) — it is internal tooling, not a user surface |
| **Tenancy** | `single-tenant` | One user = one account. Data belongs to the individual user. **No org, no `org_id`, no `forOrg()`** — see `docs/overview/product.md` |
| **Tenant unit** | n/a | single-tenant |
| **Audience** | `consumer` | Peer-to-peer, phone-primary, phone+OTP login, India-first |
| **Localisation** | `english-only` | No i18n framework, plain strings. `docs/features/16-settings-flow.md` marks multi-language as future scope, not built |
| **Realtime** | `socket.io` | Drives live map availability, booking requests, and session state |
| **Integrations** | email: `zeptomail` · payments: `razorpay` · push: `fcm` · sms: `msg91` · **whatsapp: required (BSP TBD)** | See "Integrations" below — Razorpay is mandate-only |
| **Testing** | `full` | Vitest + Supertest + **Maestro E2E** on critical journeys. Real money and an auto-debit mandate are involved |

### The one rule that overrides every payment instinct

**SpotKey does not process Parker→Owner payments.** No gateway, no card entry, no wallet, no
checkout, no transaction record. The app shows the Owner's UPI QR and deep-links to GPay/PhonePe;
money moves entirely outside the app and the app never learns whether it moved.

Razorpay exists for **exactly one thing**: the Owner's UPI Autopay mandate for the 7-day platform
fee (`docs/features/14-billing-logic.md`, `docs/features/23-upi-autopay-mandate-flow.md`). Wiring
Razorpay into a booking is a product violation, not a feature.

The failure this prevents: an in-app "Pay" button creates an implied guarantee SpotKey cannot
honour — it would owe refunds, chargebacks, and PSP compliance for money it never held.

## Project Overview

**SpotKey** — a peer-to-peer parking marketplace mobile app where one account does both sides:
book someone's driveway, or list your own and earn.

**Nothing is built yet.** The repo currently holds the docs, the agents, and the workspace
skeleton. `docs/features/` has 26 flow specs written before the code, per the kit's spec-first
rule. `apps/api`, `apps/admin`, `apps/mobile`, and the `libs-*` packages are empty directories
awaiting Stage 1+ of [`GETTING_STARTED.md`](GETTING_STARTED.md).

### The two roles (one account, no role selection at signup)

| Mode | Entry point | Docs |
|---|---|---|
| **Parker** — search, book, park, pay externally | Home → "Book a Space" | `features/04` → `05` → `06` → `07` |
| **Owner** — list a space, toggle it live, approve bookings, get paid | Home → "My Space" | `features/08` → `09` → `10` → `11` → `12` → `13` |

A user switches freely between them from Home at any time. There is **no separate owner app** and
no "Parker profile" vs "Owner profile" — `docs/features/15-profile-flow.md:37`.

### Listing a space is instant — there is no approval queue

A space is created directly in `Active` status. **No admin approval gate, no "Pending Approval"
state, no approved/rejected branch** (`docs/features/09-add-space-flow.md`). Edits apply
immediately too — no field is "major", nothing re-enters review
(`docs/features/22-edit-space-flow.md`).

Publishing is not the same as going live. Publishing is free and instant; **toggling ON** is the
billable act, still gated by the confirmation toast and the autopay mandate. Never auto-activate a
space on publish — that starts billing on someone who never saw the toast.

Because nothing is vetted up front, **trust is entirely reactive**: ratings, in-session issue
reports, and admin takedown after the fact. Admin moderation is the only safety net, which is why
its actions have to land on devices instantly.

### Admin ↔ Mobile

`apps/admin` is a **desktop web application on the same backend as the Expo app**. Every admin
mutation propagates to mobile **in real time over Socket.IO** — no refresh, no re-login, no poll.
Suspend a space and it leaves the map at once; adjust a disputed amount and both sides' invoices
update in place.

> The failure this prevents: admin's main lever is takedown *after* a space is already live and
> bookable. A suspension that takes minutes to reach devices is a window in which someone books an
> unsafe space. Reactive moderation is only as good as its latency.

Channels: `spaces:live-updates` (map add/remove), `space:{id}:availability` (single space),
`admin:{userId}:account-status` (account-level actions). Full table in
`docs/features/08-my-space-flow.md` — Admin Sync.

## Stack Summary

- **Monorepo:** pnpm workspace, TypeScript everywhere.
- **Backend:** NestJS + Drizzle ORM + PostgreSQL. Redis for queues, sessions, rate-limits.
- **Mobile:** Expo (React Native) — **the product**. React Query for server state, bearer token
  in SecureStore.
- **Admin:** Next.js (App Router), desktop-first, dense tables.
- **Auth:** phone + OTP, no passwords. Access token 7d / refresh token 30d, both in SecureStore
  (`docs/features/01-login-flow.md`). Better Auth owns its `user` / `session` / `account` /
  `verification` tables (singular) — extend, don't rename.
- **Realtime:** Socket.IO.
- **Deployment:** Vercel (admin) + {{BACKEND_HOST — decide in Stage 0}}.

Full canonical stack in [`docs/TECH_STACK.md`](docs/TECH_STACK.md).

## Commands

```bash
pnpm dev                              # Run all apps in parallel
pnpm --filter api dev                 # NestJS API
pnpm --filter admin dev               # Next.js admin dashboard
pnpm --filter mobile dev              # Expo app

pnpm build                            # Build all
pnpm test                             # Run all tests
pnpm lint                             # Lint all
pnpm --filter admin type-check        # Type-check one package

pnpm docs:viewer                      # Build docs/viewer.html, then open it
```

### Database (Drizzle + PostgreSQL)

```bash
pnpm db:generate                      # Generate a migration from schema changes
pnpm db:migrate                       # Run migrations (the ONLY way schema reaches any DB)
pnpm db:studio                        # Open Drizzle Studio
pnpm db:seed                          # Seed master data (roles, lookup tables, config)
```

> **`db:push` is banned** — there is no such script. Schema changes reach the database only
> through a generated, committed migration. `push` desyncs the migration history from the DB and
> the file tree; recovering from that is far more expensive than one `db:generate`.

## Workspace Layout

```
apps/
  api/            # NestJS backend
  admin/          # Next.js admin dashboard (desktop-first)
  mobile/         # Expo React Native app — the product
libs-common/      # Shared types + API handler
libs-web/         # Admin-only shared UI + utils
libs-mobile/      # Mobile-only shared UI + theme + utils
docs/             # Repo documentation (see docs/README.md)
.claude/agents/   # Specialized Claude Code agents
.github/          # Issue templates, PR template, CI
```

> No `apps/web` and no `apps/marketing` — not in Surfaces. Don't create them without changing
> the App Profile first.

## Conventions

### Backend (NestJS)

- Modules under `apps/api/src/modules/` follow: `*.controller.ts`, `*.service.ts`, `*.module.ts`,
  `dto/` (Zod schemas), `utils/`.
- Guards for auth, roles/permissions (RBAC), and rate-limiting; pipes for validation.
- Validate request bodies/queries with Zod DTOs via a validation pipe. Use `z.coerce.*` for query params.
- Cross-field validation lives in the DTO (Zod `.refine()`), not the service.
- **Single-tenant:** queries use `db` directly. There is no `forOrg()` helper and no `org_id`.

### Database (Drizzle)

- Schema under `apps/api/src/db/schema/`. **UUIDv7 primary keys**; `created_at` / `updated_at`
  with timezone on every table. Infer types via `typeof table.$inferSelect`.
- **Status / enum values live in lookup tables** referenced by FK — not hardcoded `text` enums.
  This app is full of statuses (booking states, space approval, session sub-states, invoice
  status, ticket status) — every one of them is a lookup table.
- **Migrations only** — never `db:push`.
- **Money is an integer in minor units** (`amount_paise`) plus an ISO 4217 code — never a float.
  Applies to hourly rates, session amounts, and platform-fee invoices alike.
- **Soft-delete only where a feature needs it** — add `deleted_at` per-table, deliberately.

### Mobile (Expo) — the primary surface

- Native patterns, not web breakpoints. Bottom nav: Home | Profile | Settings.
- React Query for server state; tokens in SecureStore.
- **Permissions are requested just-in-time, never upfront** — location at first Map open, push
  after Profile Completion, camera at first Condition Check. Asking on the splash screen raises
  denial rates (`docs/features/00-splash-onboarding-flow.md:56`).
- Every notification deep-links to its screen, never just to Home.

### Admin (Next.js) — internal, desktop-first

- App Router, dense sidebar layout, information-rich tables.
- **Layout contract:** pages compose `PageLayout`. A `page.tsx` never sets its own `max-w-*`,
  `mx-auto`, or page padding — the layout owns them.
- **Scroll ownership:** chrome never scrolls with content. Every `overflow-y-auto` in a flex row
  is paired with `min-h-0`, or the scroll escapes to the document and the menu scrolls away.
- **Page archetypes:** pick one (list / detail / create-edit / settings / dashboard). Every data
  segment ships `page.tsx` + `loading.tsx` + `error.tsx`. Branch order is loading → error → empty → content.
- **Error architecture:** four layers — segment `error.tsx`, root `error.tsx`, `global-error.tsx`,
  and a React `ErrorBoundary` in the provider tree. The boundary is not redundant: a synchronous
  client render throw escapes `error.tsx` and takes the app white.
- Forms with 3+ fields use React Hook Form + `zodResolver`. Compute `defaultValues` with `useMemo`
  (**never** `useEffect` + `reset` — a background refetch wipes the user's input).
- **No i18n** — plain strings.

### Theming — both surfaces, non-negotiable

**Every screen must render correctly in light *and* dark. There is no light-only screen.**

- **Read semantic tokens, never raw values.** `--bg`, `--fg`, `--primary`, `--card`, `--border`,
  `--muted-fg`. Both themes are defined in `docs/design/design-system.md`.
- **Never hardcode a colour** — no hex, no `rgba()`, no `#fff`, no named CSS colours in a
  component. A hardcoded value is invisible in one theme and there is no lint that catches it
  looking wrong.
- **Dark mode is a token remap only.** If a component needs a `dark:` override or a
  `useColorScheme()` branch, that's a **missing token** — add the token instead.
- **Default is System**, with a manual override in Settings. Persisted across launches.
- **Elevation inverts in dark:** surfaces *lighten* to rise (`--card` is lighter than `--bg`);
  shadows do not deepen. A shadow-only card is invisible on dark — pair it with a border.
- **Check both themes before calling a screen done.** Not at audit time.

> **Why this is a hard rule and not a polish item.** The app is used at night, in a car, one-handed
> — a driver at 11pm is the median user, not an edge case. And the dark token set was *derived*
> during the design-system import, not designed: the source system had no dark theme. Every dark
> value is a considered guess until it has been seen on a real device.

> **Images are the exception that needs handling, not exemption.** Owner-uploaded space photos
> are shot in whatever light existed. Overlay scrims and text-on-photo must be legible against a
> dark *and* a bright photo, in both themes — the scrim is part of the component, not the photo.

## Integrations

| Concern | Provider | Scope — read this before wiring anything |
|---|---|---|
| SMS / OTP | `msg91` | Login OTP only. Country-aware phone validation |
| Email | `zeptomail` | 7-day invoices. **Always sent** regardless of notification preferences — financially required (`features/16-settings-flow.md:42`) |
| Push | `fcm` | Booking requests, session state, invoice + auto-debit outcomes |
| Payments | `razorpay` | **UPI Autopay mandate ONLY.** Never a Parker→Owner payment |
| WhatsApp | **TBD — not yet chosen** | Required for invoice delivery (`features/14-billing-logic.md:67`). Needs a BSP and pre-approved templates. **Open decision — see below** |

## Stage order deviation

`GETTING_STARTED.md` runs Stages 0–9 in order. This project ran them out of order — Stage 4 was
deferred, then brought forward once a design system existed to import. Stage numbering is
unchanged; only the execution order differs.

| Stage | State |
|---|---|
| 0 — Setup | Done, minus labels + Projects board (needs `gh` auth) |
| 1 — `CORE_DOCUMENT.md` | Done |
| 2 — Feature docs | Done — 26 flow specs, user stories backfilled (134 stories, 555 ACs) |
| 3 — Branding | Done. **Palette superseded 2026-07-20** by the imported design system |
| 4 — Design system | **Done** — `docs/design/design-system.md`, imported and adapted |
| 5 — Schema + ADRs | Done — `docs/architecture/data.md`, ADRs 0001–0006 |
| 6 — Plan | `PROJECT_PLAN.md` drafted. Milestones + issues pending `gh` auth |
| 7–9 | Not started. No application code exists |

> **Design tokens now exist, so the "tokens, not values" rule is enforceable from the first line of
> UI.** The dark-mode token set was *derived*, not imported — the source system had no dark theme.
> Check it on a real device before v0.3 closes; night parking is a primary use case.

## Known Gotchas

These are contradictions found in the specs during initialisation. They are **unresolved** —
resolve them in the doc before implementing the affected flow, never in code first.

1. ~~**Terms acceptance is missing from the login flow.**~~ **Resolved 2026-07-20.** The
   post-OTP route is now **two gates in this order**: Gate 1 accepted-current-terms-version → Gate
   2 `isProfileComplete`. Terms precedes Profile Completion because that screen collects name,
   email and UPI ID, and consent must precede collecting personal data. Gate 1 is a *version*
   check, so it re-fires for returning users when terms change. Docs 01 and 02 updated;
   `features/19-terms-acceptance-flow.md` is the authority.

2. **The autopay mandate gate contradicts the billing toast.**
   `features/23-upi-autopay-mandate-flow.md:69` makes an active mandate a hard precondition for
   the first toggle-ON. `features/14-billing-logic.md` and `features/08-my-space-flow.md` show
   toggle → toast → billing with no mandate step. The owner's first-run sequence is ambiguous.

3. ~~**Daily-charge rule is hedged.**~~ **Resolved 2026-07-20 (ADR-0006).** A calendar day is
   billable at **one hour or more cumulative, IST**; below that it is free. Alongside it, two
   other money rules that were undefined are now settled: billable duration rounds **up to 15
   minutes with a 30-minute minimum, amount up to whole rupees**, and the session clock runs from
   **OTP verification to the Parker signalling exit** — never to the Owner's confirmation, so
   Owner latency cannot inflate a bill.

3b. **The platform rate table does not exist.** The *shape* is decided — daily rate is a function
   of **slot count × vehicle type**, never a flat fee (`CORE_DOCUMENT.md`,
   `features/14-billing-logic.md` §2) — but the numbers are pending from the product owner.
   **Never hardcode a rate.** Read it from a lookup table keyed on (vehicle type, slot count),
   seeded via `db:seed`, so a pricing change is a data change and not a deploy.

4. **Admin docs are referenced but don't exist.** `SPACES.md`, `BOOKINGS.md`, `MODERATION.md`,
   `PAYMENTS.md`, `INVOICES.md` are cited across the specs. **This got more urgent, not less,
   when the approval gate was removed** — admin went from gatekeeper to sole safety net, and the
   panel that does the moderating is entirely unspecified. Write these before launch.

5. **WhatsApp BSP is unchosen** and carries template-approval lead time. Blocks invoice delivery.

6. ~~**Stray product name** in `features/12-exit-verification-flow.md`.~~ **Fixed 2026-07-20.**

7. **Some doc cross-links still break.** Renaming to the hyphenated form during migration fixed
   most. Remaining stragglers point at an older `features/parker-flow.md` / `owner-flow.md` /
   `post-login-flow.md` naming that never existed here.

8. **Delete-account for an owner mid-cycle is unresolved** — `features/16-settings-flow.md:44`
   flags it as an open architecture question (active billing cycle, pending auto-debit).

9. **Bait-and-switch on edit is now possible.** With approval removed, an owner can edit a
   well-reviewed space's location or type to something else entirely and keep the ratings
   (`features/22-edit-space-flow.md`). Whether a large location move should reset reviews is an
   open product question. Reactive suspension is the only current answer.

## Tooling

- **Context7 MCP is required.** Before using a library or framework API you're not 100% current
  on — a new hook, a config option, a method signature — **look it up via Context7**, don't recall
  it from memory. The stack moves faster than the training cutoff; a confidently-wrong API is the
  most expensive bug. This applies to every agent.
- **GitHub MCP** — issues, PRs, and the board.

## Pointers

- **Docs:** [`docs/README.md`](docs/README.md) — overview, features, branding, architecture, API, modules, pages, decisions.
- **Specs:** [`docs/features/`](docs/features/) — 26 flow docs, `03-page-wise-flow.md` is the master index.
- **Agents:** `.claude/agents/*.md` — frontend / backend / mobile / architecture / infra / review / testing.
- **Flow:** [`GETTING_STARTED.md`](GETTING_STARTED.md) — the nine-stage lifecycle.
- **Workflow:** [`WORKFLOW.md`](WORKFLOW.md) — Definition of Done, change-request loop.

## Formatting

Prettier — match the repo's `.prettierrc` (agents read it; don't assume a style).
{{Set it once at init and record the choice here: quotes, indent, width, trailing commas, EOL.}}

## Environment Variables

Copy `.env.example` to `.env`. Required at minimum:

- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` — auth config
- `ADMIN_URL` — CORS origin
- `REDIS_URL` — queues / sessions / rate-limits
- `EXPO_PUBLIC_API_URL` (mobile) / `NEXT_PUBLIC_API_URL` (admin)
- `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID` — OTP
- `ZEPTOMAIL_TOKEN`, `ZEPTOMAIL_FROM` — invoice email
- `FCM_SERVICE_ACCOUNT` — push
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` — **mandate only**
- `SOCKET_IO_ORIGIN` — realtime
- `{{WHATSAPP_*}}` — pending BSP choice
