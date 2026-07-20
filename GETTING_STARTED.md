# Getting Started

**You've been handed this kit and a product idea. This is what you do, in order.**

Nine stages, from empty repo to shipped feature. Each one produces **one artifact** that
the next stage consumes — so don't skip ahead. A design system with no brand doc is
guesswork; a plan with no feature docs is a wish list.

Read this once end-to-end (10 minutes), then work it stage by stage.

> **New to the team?** Read [`TECH_STACK.md`](TECH_STACK.md) first — it's the stack you'll
> be using and it's already decided. Then come back here.

---

## The whole flow

```
   ONE-TIME SETUP
 ┌─────────────────────────────────────────────────────────────┐
 │ 0  Initialise (App Profile) + set up → CLAUDE.md, working repo │
 └─────────────────────────────────────────────────────────────┘

   THINK  ── before any code ──────────────────────────────────
 ┌─────────────────────────────────────────────────────────────┐
 │ 1  Discuss the product           → CORE_DOCUMENT.md         │
 │ 2  Functional doc per feature    → docs/features/<name>.md  │
 │ 3  Branding — the feel           → docs/branding/brand.md   │
 │ 4  Design system                 → docs/design/design-system.md │
 │ 5  Schema + architecture         → docs/architecture/data.md, ADRs │
 └─────────────────────────────────────────────────────────────┘
                          │
   PLAN                   ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 6  Docs → tasks                  → Milestones + Issues      │
 └─────────────────────────────────────────────────────────────┘
                          │
   BUILD                  ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 7  Implement → review → commit   → PR with "Closes #N"      │
 │ 8  Test (runs alongside 7)       → CI green                 │
 │ 9  Feature done → page doc       → docs/pages/<screen>.md   │
 └─────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Requirement changed?  │
              │ Doc first → back to 2 │
              └───────────────────────┘
```

**The one rule that holds it together: docs first, always.** Every stage before 6 is
thinking; 7–9 is typing. Teams that skip to 7 rewrite stages 1–5 anyway, just later and
in code, where it costs more.

---

## Stage 0 — Initialise the App Profile, then set up the repo

**Goal:** decide *what kind of app this is* before anything is built, then stand up the repo to match.

- **Who you talk to:** Claude with **`superpowers:brainstorming`** for the profile; then nobody
  (setup is mechanical).
- **You produce:** a filled **App Profile** in `CLAUDE.md` (surfaces, form factor, tenancy,
  localisation, realtime, integrations), then a repo with `docs/`, `.claude/agents/`, `.github/`.

**Paste this into Claude Code:**

```
Use superpowers:brainstorming. Read INITIALISE.md, then interview me to fill
the App Profile. Ask one axis at a time, recommend a default, push back on
contradictions. Write the result into CLAUDE.md and tell me which agents,
docs, and apps/* folders apply.
```

- **Do it:** run **[`INITIALISE.md`](INITIALISE.md)** (the interview), then **[`SETUP.md`](SETUP.md)**
  top to bottom — create only the `apps/*` your Surfaces named, connect the **GitHub + Context7**
  MCP servers, then `gh auth`, labels, board, viewer.
- **Done when:** the App Profile block in `CLAUDE.md` is filled, both MCP servers respond,
  `pnpm install` succeeds, `bash github/labels.sh` created the labels, and the Projects board exists.

> **Context7 is required, not optional.** It gives the agents current library docs on demand — the
> stack outruns any training cutoff, and a confidently-wrong API from memory is the worst kind of
> bug. Every build agent is told to consult it before using a fast-moving API.

> **Why the profile first:** every agent reads it and builds to it — a desktop B2B multi-tenant tool
> and a consumer mobile app are *different builds* from line one. Decide the shape once, in the
> artifact, so you're never overriding a stale default on every dispatch.
>
> Don't skim `SETUP.md` step 5 either — `gh auth refresh -s project,read:project` is the one people
> miss, and every `gh project` command fails without it.

**Next:** Stage 1.

---

## Stage 1 — Discuss the product

**Goal:** everyone agrees on what we're building and for whom, before anyone has an opinion
about a database.

- **Who you talk to:** your team, then Claude — use the **`superpowers:brainstorming`** skill.
  It interviews you instead of agreeing with you, which is the point.
- **You produce:** **`CORE_DOCUMENT.md`**, filled in — app name, users, goal, problems
  solved, subscription model, platforms, success metrics, non-goals.

**Paste this into Claude Code:**

```
Use superpowers:brainstorming. I'm starting a new project. Interview me
about the product, then fill in CORE_DOCUMENT.md from my answers.
Push back where my answers are vague or contradictory.
```

- **Done when:** every section of `CORE_DOCUMENT.md` is filled, **including Non-goals**.
  If you can't name what you're *not* building, you don't have a scope yet.

**Next:** Stage 2. From here, everything traces back to this doc.

---

## Stage 2 — Write a functional doc per feature

**Goal:** each feature has a short, agreed spec — a *"Claude-easy BRD"* — **before** it's built.

- **Who you talk to:** Claude with **`superpowers:brainstorming`**, then your team for sign-off.
- **You produce:** **`docs/features/<feature>.md`**, one per feature, from
  [`docs-template/features/_template.md`](docs-template/features/_template.md).
  1–2 pages: problem, users & roles, user stories with given/when/then AC, business rules,
  data touched, screens, out of scope, open questions.

**Paste this into Claude Code (once per feature):**

```
Use superpowers:brainstorming. Read CORE_DOCUMENT.md, then interview me
about the "<feature>" feature. When we're aligned, write
docs/features/<feature>.md using docs/features/_template.md.
Keep it to 1-2 pages. Flag anything I left ambiguous as an open question.
```

- **Done when:** the stories are small enough to ship in a day or two each, **Out of scope**
  is filled, and **Open questions is empty**. An open question at build time becomes a rewrite.

> **Why not a full BRD + PRD?** We tried it. Ninety numbered requirements across two docs
> that overlap and drift. This template gets the same decisions in 1–2 pages that people
> actually read. Depth comes later, in [`docs/modules/`](docs-template/modules/_template.md),
> written *after* the code, when it's fact instead of speculation.

**Next:** Stage 3 (once, for the project) — then straight to Stage 5 for later features.

---

## Stage 3 — Define the branding

**Goal:** write down the *feel*, so UI implementation derives from it instead of
re-litigating taste on every screen.

- **Who you talk to:** whoever owns the brand, plus Claude.
- **You produce:** **`docs/branding/brand.md`** from
  [`docs-template/branding/_template.md`](docs-template/branding/_template.md) — the feel in
  words, what it must **never** feel like, voice, brand palette, type roles, imagery, logo
  assets, and the configurable token block.

**Paste this into Claude Code:**

```
Read CORE_DOCUMENT.md, then interview me about the brand: how should this
feel, what must it never feel like, how does it talk. Write
docs/branding/brand.md using docs/branding/_template.md.
Words before hex codes - don't let me skip the feel.
```

- **Done when:** a stranger could read it and reject an off-brand mockup, **every color names
  where it may be used**, and the "must never feel like" list is real (name the near-misses
  you'd actually be tempted by — "modern" and "clean" settle no arguments).

> This is the **configurable** layer. The token block maps to `{{brand.json}}`, so
> rebranding is a config change and a regenerate — not a codebase-wide find-and-replace.

**Next:** Stage 4.

---

## Stage 4 — Build the design system from the branding

**Goal:** turn the feel into tokens and components that code can actually reference.

- **Who you talk to:** the **`frontend-agent`**, plus the **`frontend-design` skill** for
  aesthetic direction (it's what keeps the result from looking like a default template).
- **You produce:** **`docs/design/design-system.md`** from
  [`docs-template/design/design-system.md`](docs-template/design/design-system.md) — semantic
  tokens (light + dark), type scale, spacing/radius/elevation, **the layout section**
  (layout tokens, scroll model, breakpoints, container widths, spacing rhythm), the component
  inventory including **layout primitives**, **signature details**, dark mode, motion.

**Paste this into Claude Code:**

```
Use the frontend-agent, and invoke the frontend-design skill for aesthetic
direction. Read docs/branding/brand.md and turn it into
docs/design/design-system.md:

1. Map the brand colors onto semantic tokens (--bg, --fg, --primary,
   --destructive, --muted...). Check every fg/bg pair for WCAG AA in both themes.
2. Define the type scale, spacing, radius, elevation.
3. Fill the Layout section: layout tokens (header height, sidebar width,
   --app-content-height), the scroll model, breakpoints, container widths,
   and the spacing rhythm (which step means section gap vs card gap vs field gap).
4. Fill the component inventory INCLUDING the layout primitives, with what
   each one owns and whether it scrolls. Cover the failure-state components
   too: error state (with retry), field, modal, table, stepper.
5. Propose 3-5 signature details that will make this product look like itself,
   and say where each applies.
6. Record the page archetypes this app needs (list / detail / create-edit /
   settings / dashboard) and the error-surface table in
   docs/architecture/frontend.md. Read .claude/agents/references/
   page-templates.md and error-architecture.md first.
```

- **Done when:** every semantic token traces to a brand source, both themes are filled,
  contrast passes AA, the layout section has real values (not placeholders), the signature
  details are specific enough that someone could spot them on a screenshot, and
  `docs/architecture/frontend.md` names the page archetypes plus where each kind of error
  surfaces.

> **Layout is part of the design system — not something each page improvises.** The single most
> common shell bug is the nav or sub-menu scrolling away with the content. The scroll model in
> `design-system.md` is what prevents it, and the agents are instructed to follow it.

> **The same applies to failure.** Which page archetypes exist, where each kind of error surfaces,
> and how forms handle server rejection are architecture, not per-page taste — decide them once
> here rather than five different ways across five screens. The models live in
> [`.claude/agents/references/`](.claude/agents/references); what *this* app chose gets recorded in
> `docs/architecture/frontend.md`.

> **This is the connection that makes the whole chain worth it.** `frontend-agent` and
> `mobile-agent` are instructed to read `brand.md` + `design-system.md` **before writing any
> UI**, and to use semantic tokens rather than raw hex. Get this file right and every screen
> inherits it. Get it wrong and they'll faithfully build the wrong thing.
>
> Missing a token later? **Add it here first**, then use it. Never invent a one-off in a
> component — that's how a design system dies.

**Next:** Stage 5.

---

## Stage 5 — Discuss schema and architecture

**Goal:** decide the data model and the cross-cutting mechanics *before* they're load-bearing
— these are the expensive things to change later.

- **Who you talk to:** the **`architecture-agent`** (schema, docs, ADRs) and the
  **`infra-deployment-agent`** (caching, queues, realtime, guards/pipes/interceptors, deployment).
- **You produce:**
  - **`docs/architecture/data.md`** — tables, relationships, conventions, **invariants**.
  - **`docs/architecture/{system,backend,frontend,integrations}.md`** — as they firm up.
  - **`docs/decisions/NNNN-*.md`** — an ADR for every non-obvious call.

**Paste this into Claude Code:**

```
Use the architecture-agent. Read docs/features/*.md and design the schema.
Write docs/architecture/data.md: tables, relationships, conventions, and
the invariants - and for each invariant name the layer that enforces it
(DB constraint? DTO? both?) and any gap where it ISN'T enforced.
```

```
Use the infra-deployment-agent. Given docs/features/*.md, walk me through
the options with trade-offs for: what's cacheable and where, what belongs
on a queue vs sync, realtime transport, which guards/pipes/interceptors we
need, and the deployment shape for our scale. Recommend one per topic.
Write an ADR for each decision we land.
```

- **Done when:** `data.md` lists the invariants **with their enforcement layer and honest
  gaps**, and every significant decision has an ADR.

> **Say where an invariant is NOT enforced.** A doc that says *"an order's total must equal the sum
> of its line items — enforced by a Zod refinement; the DB has no CHECK constraint, so the DTO is
> the only guard"* is worth ten that just state the rule. The gap is the thing that bites.
>
> ADRs are **immutable** once accepted. Changed your mind? Write a new one that supersedes it.
> See [`docs-template/decisions/README.md`](docs-template/decisions/README.md).

**Next:** Stage 6. You now have everything a plan needs.

---

## Stage 6 — Turn the docs into a plan

**Goal:** convert agreed docs into scheduled, trackable work.

- **Who you talk to:** Claude + the GitHub MCP (or `gh` directly).
- **You produce:** **GitHub Milestones** (= versions) and **Issues** (= user stories), on the
  Projects board. Recorded in **[`PROJECT_PLAN.md`](PROJECT_PLAN.md)**.

**The model:** **milestone = version** (`v0.1`, `v0.2`, `v1.0`). Each `US-N` in a feature doc
becomes exactly one issue. The `phase:1|2` label stays what it always was — *scope*
(live vs deferred), not schedule.

**Paste this into Claude Code:**

```
Read docs/features/*.md and PROJECT_PLAN.md. Propose milestones (v0.1,
v0.2, v1.0) and, for each user story, a GitHub issue - title, body linking
the feature doc + story id, labels (type/area/priority/phase), milestone.
Show me the list first. Create them only after I approve.
```

- **Done when:** every story is an issue with a milestone, a label set, and a link back to its
  feature doc; `gh issue list --milestone "v0.1" --state open` shows the real scope.

> Show-then-create, always. Reviewing 30 proposed issues in the terminal takes two minutes;
> deleting 30 wrong ones from GitHub takes twenty.

**Next:** Stage 7 — pick an issue.

---

## Stage 7 — Implement, review, commit

**Goal:** ship one issue, traceably.

- **Who you talk to:** **`backend-agent`** / **`frontend-agent`** / **`mobile-agent`** to build,
  then **`review-agent`** before you merge.
- **You produce:** code on a branch, a PR that says **`Closes #N`**.

**Paste this into Claude Code:**

```
Read issue #N and the feature doc it links. Implement it with the
<backend|frontend|mobile>-agent. Follow the acceptance criteria exactly -
if a criterion is ambiguous, stop and ask instead of guessing.
```

```
Use the review-agent on my staged changes before I commit.
```

- **The loop:** issue → branch → implement → tests (Stage 8) → `review-agent` → PR
  `Closes #N` → board moves to **In Review** → merge → **Done**.
- **Task ID mapping:** the issue number is the thread. Branch `{{feat/123-short-name}}`,
  commit `{{feat: add invite flow (#123)}}`, PR body `Closes #123`. Six months from now,
  `git log` answers *why* without an archaeology dig.
- **Done when:** `review-agent` has no unaddressed Critical/Major findings and CI is green.

Full per-task detail: **[`WORKFLOW.md`](WORKFLOW.md)**.

**Next:** Stage 8 (concurrently) then Stage 9.

---

## Stage 8 — Test

**Goal:** the acceptance criteria from the feature doc are enforced by something other than
your memory.

- **Who you talk to:** the **`testing-agent`**.
- **You produce:** unit + integration tests always; **Playwright E2E** on the critical journeys if
  the App Profile's Testing axis is `full`. Green in CI.
- **Runs in parallel with Stage 7** — not after it. The AC were written in Stage 2, so the
  tests can be too.

**Paste this into Claude Code:**

```
Use the testing-agent. Read docs/features/<feature>.md and write tests for
the acceptance criteria of US-N. Cover the edge cases and the business
rules (BR-*), not just the happy path. If Testing = full and this is a
critical journey, add a Playwright E2E for it too.
```

- **Done when:** every AC has a test, the coverage bar holds (80% / 100% critical paths), CI is
  green, and the tests fail if you break the rule they cover. (Check that — a test that passes
  against broken code is worse than no test.) Multi-tenant: a tenant-isolation test exists.

**Next:** Stage 9.

---

## Stage 9 — Feature complete → write the page doc

**Goal:** the screen you just built is documented so the next person doesn't reverse-engineer it.

- **Who you talk to:** Claude (or write it yourself — you have the context right now).
- **You produce:** **`docs/pages/<screen>.md`** from
  [`docs-template/pages/_template.md`](docs-template/pages/_template.md) — route, purpose,
  fields, APIs, state, validations, a11y, responsive, edge cases.

**Paste this into Claude Code:**

```
The <screen> screen is complete. Write docs/pages/<screen>.md using
docs/pages/_template.md. Read the actual code - route file, components,
hooks - and cite it as file:line. Facts only, no speculation.
```

- **Done when:** it passes the **Definition of Documented** checklist in
  [`WORKFLOW.md`](WORKFLOW.md#definition-of-documented-per-page-checklist), and
  `docs/pages/README.md`'s index has a row for it.

> **This is the Definition of Done, and it's not optional.** Close the issue **and** write the
> page doc. Undocumented work is unfinished work — it just fails later, quietly, when someone
> else has to guess.
>
> Feature docs (Stage 2) say what we *decided to build*. Page docs say what *exists*. Both
> survive; neither replaces the other.

**Next:** next issue → Stage 7. Milestone done → Stage 6 for the next version.

---

## Requirement changed?

It will. The order is fixed, and it's the same order as the first time:

```
Update the feature doc  →  re-plan (milestone/issues)  →  implement
        →  test  →  update the page doc
```

**Never code-first.** A change that lands in code but not in `docs/features/<feature>.md` is
invisible to the next person, and every doc downstream quietly becomes a lie. The fix costs
five minutes now and a day later.

Details: [`WORKFLOW.md § 6`](WORKFLOW.md#6-when-requirements-change) ·
[`PROJECT_PLAN.md`](PROJECT_PLAN.md#when-the-plan-changes)

---

## Cheat sheet

| Stage | You produce | Agent / skill |
|---|---|---|
| 0 Initialise + set up | App Profile in `CLAUDE.md` + repo | `superpowers:brainstorming` ([`INITIALISE.md`](INITIALISE.md), [`SETUP.md`](SETUP.md)) |
| 1 Discuss product | `CORE_DOCUMENT.md` | `superpowers:brainstorming` |
| 2 Functional doc | `docs/features/<f>.md` | `superpowers:brainstorming` |
| 3 Branding | `docs/branding/brand.md` | Claude |
| 4 Design system + layout + UI architecture | `docs/design/design-system.md`, `docs/architecture/frontend.md` | `frontend-agent` + `frontend-design` skill |
| 5 Schema + arch | `docs/architecture/data.md`, ADRs | `architecture-agent`, `infra-deployment-agent` |
| 6 Plan | Milestones + Issues | Claude + GitHub MCP |
| 7 Implement | code + PR `Closes #N` | `backend` / `frontend` / `mobile`-agent (+ `frontend-design` for new UI), then `review-agent` |
| 8 Test | tests green | `testing-agent` |
| 9 Page doc | `docs/pages/<s>.md` | Claude |

**The seven agents** live in [`.claude/agents/`](.claude/agents), with the frontend UI-architecture
models beside them in [`.claude/agents/references/`](.claude/agents/references) (error
architecture, form templates, page templates). Read one before you use it —
each defines what it will and won't touch.

| Agent | Use it for |
|---|---|
| `architecture-agent` | Schema design, architecture docs, ADRs. **Never edits app code.** |
| `backend-agent` | NestJS modules, controllers, services, Drizzle schemas, guards/pipes. |
| `frontend-agent` | Next.js pages, components, hooks, forms, the design system. |
| `mobile-agent` | Expo/RN screens, navigation, theming. Mirrors the web app. |
| `infra-deployment-agent` | **Advisory.** Caching, queues, realtime, deployment — options with trade-offs. |
| `review-agent` | Reviews a diff before merge. Verdict + severity-labelled findings. |
| `testing-agent` | Writes and runs tests. |

## Where everything is

| I need… | Read |
|---|---|
| To decide the app's shape (surfaces, tenancy, …) | [`INITIALISE.md`](INITIALISE.md) → App Profile in `CLAUDE.md` |
| The stack (already decided) | [`TECH_STACK.md`](TECH_STACK.md) |
| Setup commands | [`SETUP.md`](SETUP.md) |
| Day-to-day task loop, Definition of Done | [`WORKFLOW.md`](WORKFLOW.md) |
| Milestones, versioning, issue decomposition | [`PROJECT_PLAN.md`](PROJECT_PLAN.md) |
| Labels, board, milestones via `gh` | [`github/projects-board.md`](github/projects-board.md) |
| The docs skeleton | [`docs-template/README.md`](docs-template/README.md) |
| To *read* the docs comfortably | `pnpm docs:viewer` → open `docs/viewer.html` |
