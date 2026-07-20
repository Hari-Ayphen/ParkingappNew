# Project Plan — SpotKey

The bridge between **docs and work**: feature docs come in, GitHub Milestones + Issues go out.
Revisit at every milestone boundary.

- **Last updated:** 2026-07-20
- **Current milestone:** `v0.1` (not started)
- **Issues created:** none — no GitHub repo yet. This document is the plan; issue creation is
  deferred until the repo exists.

> **⚠ Blocker on turning this into issues.** `PROJECT_PLAN.md`'s model is *one issue per user
> story* (`US-N`). **The 26 docs in `docs/features/` contain no user stories** — they are flow
> specs describing screens and behaviour, not stories with given/when/then acceptance criteria.
>
> The work items below are decomposed *by flow*, which is enough to plan and sequence. It is not
> enough to open issues against: an issue whose acceptance criteria are "see the flow doc" gets
> re-litigated in review. **Backfill stories into the feature docs before Stage 6 proper**, using
> `docs/features/_template.md`. This is tracked as work item `v0.1-A`.

## The model: milestone = version

| Thing | Means | Where |
|---|---|---|
| **Milestone** | A **version** that ships: `v0.1`, `v0.2`, `v1.0` | GitHub Milestone |
| **Issue** | One user story (`US-N`) from a feature doc | GitHub Issue |
| **`phase:` label** | Scope: live now (`phase:1`) or deferred (`phase:2`)? | Label |
| **Status / Deploy** | Where the work is right now | Projects board fields |

**Milestones sequence delivery. The `phase:` label marks scope.** Different questions — *when does
it ship* vs *is it in the product yet* — so different tools.

## Versioning

- `v0.x` — pre-launch. Breaking changes are free; nothing is public; **no real money moves**.
- `v1.0` — first public release. The bar: a stranger can find, book, park in, and pay for a real
  space, and an owner is correctly billed for it.
- `v1.x` — additive. Anything breaking waits for `v2.0`.
- Each shipped milestone gets a git tag and a GitHub Release.

---

## The dependency that shapes everything

`docs/features/23-upi-autopay-mandate-flow.md:69` makes an **active autopay mandate a hard
precondition for toggling a space live.** Read literally, no space can go live until the entire
billing stack exists — rate table, mandate, Razorpay integration, invoice cycle. That would
front-load the riskiest, most compliance-heavy subsystem before anyone has proved the core loop
works.

**Resolution:** the mandate gate ships in `v0.5`, not before. Through `v0.1`–`v0.4` the toggle
works without it. This is safe *only* because `v0.x` is pre-launch with no real owners and no real
money — the gate must be in place before `v1.0`, and no space may be live in production without
one.

> Tracked so it can't be forgotten: work item `v0.5-D` turns the gate on, and it is a `v1.0` exit
> criterion.

---

## Milestones

### `v0.1` — Foundation & identity

- **Goal:** a new user can install the app, log in by phone OTP, accept terms, complete their
  profile, and land on Home.
- **Target:** when exit criteria pass.

| # | Work item | Source doc | Area |
|---|---|---|---|
| A | **Backfill user stories into all 26 feature docs** | all | docs |
| B | Workspace, NestJS API skeleton, Drizzle, CI green | — | infra |
| C | Lookup tables + seed (`country`, `vehicle_type`, all statuses) | `architecture/data.md` | api |
| D | Phone + OTP request/verify, JWT + refresh in SecureStore | `01-login-flow.md` | api, mobile |
| E | Terms acceptance screen + immutable audit trail | `19-terms-acceptance-flow.md` | api, mobile |
| F | Profile completion (name, email, UPI ID) | `02-after-login-flow.md` | api, mobile |
| G | Splash, onboarding slides, just-in-time permissions | `00-splash-onboarding-flow.md` | mobile |
| H | Home shell — dual-mode hub, bottom nav | `02-after-login-flow.md` | mobile |
| I | **Theme mechanism — both token sets, provider, System default, persistence** | `design/design-system.md` | mobile, admin |

> **Why the theme mechanism is in `v0.1` and not `v1.0` with Settings.** The Settings *screen*
> that lets a user pick Light/Dark/System is `v1.0-A`. The *mechanism* — both token sets wired,
> a provider, System-follow, persistence — must exist before the first screen ships, because
> every screen from `v0.1-D` onward has to be built against it.
>
> Build forty screens light-only and add theming at `v1.0` and you are retrofitting dark across
> all of them, which is the retrofit that never fully lands: you find the last hardcoded `#fff`
> in production, at night, in someone's car.

**Exit criteria**

- [ ] Every issue closed; CI green (lint, type-check, tests, build).
- [ ] Page docs exist for every screen shipped.
- [ ] A new user completes install → OTP → terms → profile → Home **on a real device**.
- [ ] **Every screen shipped in this milestone renders correctly in light and dark**, checked on a
      real device — not a simulator, and not only in daylight. The dark token set was derived, not
      designed, so `v0.1` is where it gets validated.
- [ ] **No hardcoded colour values** anywhere in `apps/mobile` or `apps/admin`.
- [x] ~~**Known Gotcha 2 resolved:**~~ **Done 2026-07-20** — Gate 1 terms → Gate 2 profile. Was:
      where Accept Terms sits relative to Profile Completion is
      settled in the docs, and 01/02/19 agree.

### `v0.2` — Spaces exist

- **Goal:** an owner can publish a space and manage it. Nothing is live or bookable yet.

| # | Work item | Source doc | Area |
|---|---|---|---|
| A | 7-step Add Space form, draft persistence | `09-add-space-flow.md` | api, mobile |
| B | Photo upload (3–8, object storage) | `09-add-space-flow.md` | api, mobile |
| C | My Spaces dashboard | `08-my-space-flow.md` | mobile |
| D | Edit space — all fields apply immediately | `22-edit-space-flow.md` | api, mobile |
| E | Space soft-delete with active-booking guard | `22-edit-space-flow.md:48` | api |

**Exit criteria**

- [ ] An owner publishes a space and it appears in their dashboard **instantly, with no approval
      step** (ADR-0002 verified in behaviour, not just docs).
- [ ] `space_status` seed contains no `pending_approval` row.

### `v0.3` — The core loop

The heart of the product. Largest milestone; consider splitting if it runs long.

- **Goal:** a parker can find a live space, book it, complete a session, and see what they owe.

| # | Work item | Source doc | Area |
|---|---|---|---|
| A | Vehicle management (add/edit/delete, default, plate validation) | `20-vehicle-management-flow.md` | api, mobile |
| B | The ON/OFF toggle — **without** the mandate gate | `08-my-space-flow.md` | api, mobile |
| C | Socket.IO transport + live map channels | `04-map-search-flow.md:49` | api, infra |
| D | Map/search — pins, list view, filters, empty state | `04-map-search-flow.md` | mobile |
| E | Space detail + live availability | `05-space-detail-flow.md` | mobile |
| F | Booking confirm with **rate locking** (Invariant 1) | `06-booking-flow.md` | api, mobile |
| G | Booking requests — approve/reject, 5-min expiry, race handling | `10-booking-requests-flow.md` | api, mobile |
| H | Six-state session machine + transition audit log | `06-booking-flow.md:53` | api, mobile |
| I | Condition-check & exit-verification photos | `06`, `12` | api, mobile |
| J | Exit verification, system-calculated amount (Invariant 2) | `12-exit-verification-flow.md` | api, mobile |
| K | Session complete — QR, UPI deep-links, cash | `06-booking-flow.md` | mobile |
| L | Active bookings (owner, multi-space) | `11-active-bookings-owner-flow.md` | mobile |

**Exit criteria**

- [ ] End-to-end on two real devices: owner toggles on → parker books → session runs → exit
      verified → amount shown.
- [ ] **Invariant 1 verified:** editing a space's price mid-session does not change that
      session's amount.
- [ ] **Invariant 4 verified:** two simultaneous requests for one space cannot both be approved.
- [ ] Design system (Stage 4) has landed — see the note under *Not scheduled*.

### `v0.4` — Trust layer

With no payment protection, this milestone *is* the safety mechanism.

| # | Work item | Source doc | Area |
|---|---|---|---|
| A | Push notifications (FCM) + in-app centre + deep-linking | `18-notifications-flow.md` | api, mobile |
| B | Ratings both directions, tags, edit window, aggregate display | `24-rating-review-flow.md` | api, mobile |
| C | Booking history — active/completed/cancelled, invoice download | `07-booking-history-flow.md` | api, mobile |
| D | Cancellation, both sides, with cut-off rules | `21-cancellation-flow.md` | api, mobile |
| E | In-session issue reporting + safety priority lane | `25-issue-dispute-report-flow.md` | api, mobile |

**Exit criteria**

- [ ] A safety report reaches the admin queue within seconds and is attributable.
- [ ] Ratings lock after the edit window.

### `v0.5` — Money

The revenue subsystem. Compliance-heavy; do not compress.

| # | Work item | Source doc | Area |
|---|---|---|---|
| A | `platform_rate` table + seed values **(blocked: rates undecided)** | `14-billing-logic.md` §2 | api |
| B | `space_live_day` meter + the daily job that writes it | `14-billing-logic.md` | api, infra |
| C | 7-day cycle, invoice generation, email (zeptomail) + WhatsApp | `14-billing-logic.md` | api |
| D | Razorpay UPI Autopay mandate + **turn the toggle gate ON** | `23-upi-autopay-mandate-flow.md` | api, mobile |
| E | Day-8 auto-debit, failure/retry handling | `14-billing-logic.md` §4 | api, infra |
| F | Earnings screen — gross estimate vs platform fee, billing history | `13-earnings-flow.md` | mobile |

**Exit criteria**

- [ ] **Blocked until the rate table has real values.**
- [ ] **Known Gotcha 3 resolved:** "live for a calendar day" has a precise definition.
- [ ] An invoice is reproducible after a price change (temporal `platform_rate` verified).
- [ ] A space cannot be toggled live without an active mandate.

### `v0.6` — Admin panel & live sync

| # | Work item | Source doc | Area |
|---|---|---|---|
| A | **Write the five missing admin specs** (`SPACES`, `BOOKINGS`, `MODERATION`, `PAYMENTS`, `INVOICES`) | — | docs |
| B | Admin auth + RBAC | — | api, admin |
| C | Space moderation — suspend/restore with `admin_action` audit | `08-my-space-flow.md` | api, admin |
| D | Admin → mobile live sync over Socket.IO | `08-my-space-flow.md` (Admin Sync) | api, admin, mobile |
| E | Dispute mediation, amount correction via audit trail | `25-issue-dispute-report-flow.md` | api, admin |
| F | Invoice/auto-debit ops — retry, owner notification | `14-billing-logic.md:78` | admin |

**Exit criteria**

- [ ] Admin suspends a live space → it leaves the map on a real device **in under 2 seconds**.
- [ ] Every admin mutation is attributable in `admin_action`.

### `v1.0` — Public launch

- **Goal:** a stranger can find, book, park in, and pay for a real space; the owner is correctly
  billed.
- **Additional bar:** security review, load test, backups tested and *restored once*, monitoring
  live, store listings approved.

| # | Work item | Source doc | Area |
|---|---|---|---|
| A | Settings **screen** — theme picker, granular notifications, delete account. *(The theme mechanism itself shipped in `v0.1-I`; this is the UI to change it.)* | `16-settings-flow.md` | mobile |
| B | Profile view/edit | `15-profile-flow.md` | mobile |
| C | Support — FAQ, tickets, threads | `17-support-flow.md` | api, mobile |
| D | Maestro E2E on critical journeys; Playwright on admin | `.github/workflows/ci.yml` | infra |
| E | Logo, splash, store assets, EAS build & submit | `brand.md` (open) | mobile |

**Exit criteria**

- [ ] All five DB-unenforced invariants either closed or consciously accepted in writing.
- [ ] The two cheap constraints are in place: suspended-not-live `CHECK`, `terms_acceptance`
      UPDATE/DELETE revoked.
- [ ] No space is live in production without an autopay mandate.
- [ ] Every `[OPEN]` and `[ASSUMPTION]` in `docs/` is resolved or explicitly deferred with a reason.

---

## Not scheduled

| Item | Why not now |
|---|---|
| **Stage 4 — design system** | Deferred to last by decision (2026-07-20). **Must land before `v0.3`**, or UI hardcodes values and "tokens, not values" becomes unenforceable retroactively |
| WhatsApp BSP selection | Blocks `v0.5-C`. Template approval has real lead time — start the application before `v0.5` begins, not during |
| Location-change resets reviews? | Open product question from ADR-0002's bait-and-switch risk |
| Materialised rating aggregates | Compute-on-read until read volume proves otherwise |
| i18n / multi-language | Out of scope per App Profile |
| User-facing web app, marketing site | Not in Surfaces |
| Post-hoc listing audit sampling | Deferred alternative from ADR-0002; revisit when volume justifies |

---

## From feature doc to issues

Once stories are backfilled (`v0.1-A`) and the repo exists:

1. **One issue per user story.** `US-1` → one issue `[Feature] <story>`. Too big for two days?
   Split the story *in the doc* first — the doc stays the source of truth.
2. **Label:** `type:feature`, `area:{api|mobile|admin|infra|docs}`, `priority:P{1-4}`, `phase:{1|2}`.
3. **Assign the milestone** — this is what schedules it.
4. **Link the doc.** Every issue body points at its feature doc and story id.
5. **Add to the board**, Status = `Backlog` or `Todo`.

```bash
gh issue create \
  --title "[Feature] <story title>" \
  --body  "Implements US-1 of docs/features/01-login-flow.md" \
  --label "type:feature,area:mobile,priority:P2,phase:1" \
  --milestone "v0.1"

gh issue list --milestone "v0.1" --state open
```

Milestones must exist first:

```bash
gh api repos/<owner>/spotkey/milestones -f title="v0.1" -f description="Foundation & identity"
```

## When the plan changes

**Update the feature doc → re-plan here → adjust issues/milestones → then code.** Never
code-first. See [`WORKFLOW.md`](WORKFLOW.md#6-when-requirements-change).

- **Story changed** → edit the feature doc, then the issue.
- **Story dropped** → close the issue with a reason, strike it in the doc.
- **Story added mid-milestone** → add to the doc; pull into the current milestone only if
  something else moves out.
- **Milestone slipping** → move issues out, not the date. A version means a scope.

## Related docs

- Product definition: [`CORE_DOCUMENT.md`](CORE_DOCUMENT.md)
- The flow: [`GETTING_STARTED.md`](GETTING_STARTED.md)
- Per-task loop: [`WORKFLOW.md`](WORKFLOW.md)
- Schema & invariants: [`docs/architecture/data.md`](docs/architecture/data.md)
- Decisions: [`docs/decisions/`](docs/decisions/)
