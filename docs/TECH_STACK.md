# TECH_STACK.md

The canonical technology stack every new project adopts. Copy this file into a new
repo's `docs/` (or keep it in the starter kit) and treat it as the default. Deviate
only with a written reason recorded in an ADR under `docs/decisions/`.

> **The stack is fixed; the *shape* is not.** Which of these layers you use — mobile or not,
> multi-tenant or not, i18n or not, realtime or not — is set once by the **App Profile** during
> [`INITIALISE.md`](INITIALISE.md). Read that first. This file is the menu; the App Profile is your order.

---

## 1. Monorepo & Language

| Item      | Choice                | Explanation                                                                 |
| --------- | --------------------- | --------------------------------------------------------------------------- |
| Workspace | pnpm workspace        | Manage web / mobile / backend + shared code and types in one repo.          |
| Language  | TypeScript            | Type safety across all layers (backend, web, mobile, shared libs).          |

## 2. Backend

| Item                | Choice                    | Explanation                                                                                     |
| ------------------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| Framework           | NestJS                    | Modular architecture, dependency injection, guards, and pipes.                                  |
| Transaction Handling| Queue-based processing    | Batch / pull work into a queue after a threshold instead of processing individually — reliability under load. |

## 3. Web Frontend

| Item              | Choice                     | Explanation                                          |
| ----------------- | -------------------------- | ---------------------------------------------------- |
| Framework         | Next.js                    | SSR / SSG for the main application.                  |
| Marketing/Info Site | Separate Next.js public site | Dedicated landing / marketing site, decoupled from the app. |

## 4. Mobile *(only if `mobile` in the App Profile's Surfaces)*

| Item      | Choice                  | Explanation                                    |
| --------- | ----------------------- | ---------------------------------------------- |
| Framework | Expo (React Native)     | Single codebase for iOS and Android.           |

> If the project has no mobile surface, skip this section, the mobile-agent, and the
> `apps/mobile` + `libs-mobile` workspaces entirely.

## 5. Authentication

| Item | Choice      | Explanation                                              |
| ---- | ----------- | -------------------------------------------------------- |
| Auth | Better Auth | Sessions, login, and roles shared across web + mobile.   |

## 6. Database & ORM

| Item                | Choice                       | Explanation                                                                                       |
| ------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| DB                  | PostgreSQL                   | Primary relational data store.                                                                    |
| ORM                 | Drizzle                      | TypeScript-first ORM with typed schema. **Migrations only — `db:push` is banned** (it desyncs migration history from the DB). |
| Primary keys        | UUIDv7                       | Time-ordered, standard, btree-friendly. Not auto-increment, not hand-rolled string ids.           |
| Statuses / enums    | Lookup tables + FK           | Not inline `text` enums or `pgEnum` — rename a label without a migration; the DB enforces valid values. |
| Tenancy             | Per App Profile              | Single-tenant → `db` directly. Multi-tenant → `org_id` + `forOrg(orgId)` scoping, API tier as the wall (RLS optional hardening). |
| Data Setup          | Master-data seeding          | Seed roles, lookup tables, and config so environments start consistent.                            |
| Data Layer Strategy | DB-vs-Redis split            | Postgres for persisted data; Redis for sessions, rate-limits, real-time counters, and queues.     |

## 7. Notifications

| Item                 | Choice                          | Explanation                                                                       |
| -------------------- | ------------------------------- | --------------------------------------------------------------------------------- |
| Email                | ZeptoMail / Resend              | Decide per project on cost, deliverability, and India support.                    |
| Mobile OTP (India)   | MSG91                           | Requires DLT template registration.                                               |
| Mobile OTP (Intl)    | Twilio Verify                   | Route India → MSG91, rest of world → Twilio.                                       |
| Push                 | In-app push notifications       | Native + web push for engagement events.                                          |
| Compliance           | GST number                      | Required for 3rd-party SMS in India.                                              |
| Templates            | Pre-approved DLT / templates    | Plan and register templates early to avoid launch delays.                         |
| Domain               | Dedicated no-reply subdomain    | Configure SPF / DKIM for deliverability.                                          |
| Email Alternative    | SMTP (Go-based / self-hosted)   | Backup / cost-saving path if managed providers get expensive.                     |

## 8. Payments

| Item           | Choice                                     | Explanation                                                          |
| -------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| Gateways       | Stripe (international) / Razorpay (India)   | Route by region.                                                     |
| Receiver Types | Product owner (platform) + subscribed/individual user | Separate payout logic for the platform vs individual sellers/users. |

## 9. Realtime

| Item             | Choice                                          | Explanation                          |
| ---------------- | ----------------------------------------------- | ------------------------------------ |
| Streaming Server | Socket.io (self-hosted) vs Pusher (managed)     | Decide per project on ops vs cost.   |

## 10. Deployment

| Item    | Choice  | Explanation                                              |
| ------- | ------- | ------------------------------------------------------- |
| Hosting | Vercel  | Consistent build/host pattern across apps where possible.|

## 11. Testing & Quality

Not optional. Every project ships with the test pyramid wired from day one — the testing-agent owns
it, and CI gates it.

| Item                | Choice                                          | Explanation                                                                 |
| ------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| Unit (backend)      | Vitest                                          | Services, guards, pipes, business rules, utilities.                          |
| API integration     | Vitest + Supertest                              | HTTP endpoints against the running NestJS app; contract + auth.             |
| DB integration      | Vitest + Drizzle test client                    | Schema integrity, constraints, cascades — and **tenant isolation** if multi-tenant. |
| Web unit/component  | Vitest + React Testing Library + jsdom + MSW    | Hooks, components, store slices; MSW for deterministic API responses.        |
| Mobile unit/component | jest-expo + React Native Testing Library      | Screens, components, hooks *(only if `mobile` in Surfaces)*.                 |
| **E2E**             | **Playwright** (web) / Maestro (mobile)         | Full user journeys across browser/app + API + DB. Critical flows must have one. |
| Coverage            | 80% overall · 100% critical paths & business rules | Auth, permissions, money/state-changing logic, and documented endpoints at 100%. |
| CI gate             | lint → type-check → unit/integration → build → E2E | Every push/PR to `main`; a red gate blocks merge.                            |

Depth is set at init (the **App Profile**'s Testing axis): a pure API or internal tool may defer E2E;
a public product ships it. But unit + integration + the coverage bar are the floor for everything.

## 12. AI Dev Tooling & Documentation

| Item            | Choice                                      | Explanation                                                              |
| --------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| MCP — tracking  | GitHub                                      | Issues, PRs, and the board reachable from the terminal. (Other task systems have MCP servers if a project needs one — GitHub is the default.) |
| MCP — docs      | **Context7** (required)                     | Up-to-date, version-correct library/framework docs on demand. The stack outruns any training cutoff; agents consult Context7 before using a fast-moving or unfamiliar API rather than guessing from memory. |
| AI Agents       | `.claude/agents/*.md`                        | Specialized agents for frontend / backend / mobile / architecture / infra / review / testing. |
| Task Management | GitHub Issues → terminal (Claude Code)      | Create the issue on GitHub, execute via Claude Code in the terminal.     |
| Docs            | Markdown in `docs/`, in the repo            | Single source of truth — versioned, diffable, reviewed in the same PR as the code. |
| Docs Viewer     | `pnpm docs:viewer` → `docs/viewer.html`     | Self-contained offline HTML hub (sidebar, search, tables). Not GitHub Pages — Pages is public even for private repos. |
| Per-page Docs   | Markdown per page/feature                   | Document API endpoints, components, routes, entry/exit, purpose, actions. |

---

## Decisions to make per project

Locked during initialisation ([`INITIALISE.md`](INITIALISE.md)) and recorded in the **App Profile**
(`CLAUDE.md`); the architectural ones also get an ADR.

**Shape (App Profile axes — decide these first, they reshape the build):**

- **Surfaces** — which apps exist (`web` · `admin` · `mobile` · `marketing` · `api-only`).
- **Form factor** — `desktop-first` (dense, sidebar) vs `mobile-first` (bottom-nav, thumb).
- **Tenancy** — `single-tenant` (B2C) vs `multi-tenant` (B2B, org-scoped). A one-way door — decide honestly.
- **Localisation** — `english-only` vs `i18n` (don't add i18n "to be safe").

**Providers (switch on only what launch needs; the rest stay mock/off):**

- **Email provider** — ZeptoMail vs Resend (weigh cost, deliverability, and India support).
- **Realtime server** — `none` to start; else Socket.io (self-hosted) vs Pusher/Soketi (managed protocol).
- **Payments routing** — `none` to start; else Stripe vs Razorpay, region-routed (India → Razorpay, rest → Stripe is the default assumption).
- **Push / SMS-OTP** — FCM; MSG91 (India) vs Twilio (intl).
