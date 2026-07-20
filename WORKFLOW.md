# WORKFLOW.md

The operating model for a project built from this kit. It defines where docs live,
how work is tracked, how tasks are executed, and what "done" means.

> **Setting up a new project, or wondering what to do first?** Start with
> [`GETTING_STARTED.md`](GETTING_STARTED.md) — the nine-stage lifecycle from empty repo to
> shipped feature. This file is the **day-to-day loop** you live in once you're building.

---

## 1. Docs

- Docs live in the repo under `docs/`. The structure matches the `docs-template/` skeleton
  (`overview/`, `features/`, `branding/`, `design/`, `architecture/`, `api/`, `modules/`,
  `pages/`, `decisions/`, `operations/`).
- The repo `docs/` is the **single source of truth** — API contracts, per-page specs, ADRs,
  roadmap, release notes. There is no second docs system to keep in sync.
- Docs are reviewed in PRs and updated in the **same PR as the code** they describe.
- The readable hub is the **offline docs viewer** — `pnpm docs:viewer` builds
  `docs/viewer.html`, a single self-contained page with a sidebar, search, and rendered
  tables. See §5 and [`SETUP.md`](SETUP.md).

The four that get confused — they answer different questions and all four survive:

| Folder | Answers | Written |
|---|---|---|
| `docs/features/` | What are we building, and why? | **Before** code — it's the input to the plan |
| `docs/branding/` + `docs/design/` | What should it feel like, and what tokens express that? | Once, up front; grows with the system |
| `docs/modules/` | How does the built feature work? | **After** code |
| `docs/pages/` | What does this screen do? | **After** the screen ships |

## 2. Tracking

- Tasks and bugs live in **GitHub Issues** plus a **Projects v2 board**.
- **One issue = one user story** (`US-N`) from a feature doc. Every issue body links back to
  its doc and story id — an issue that doesn't say *why* gets re-litigated in review.
- **Milestones are versions** (`v0.1`, `v1.0`) — that's what schedules the work. See §7.
- The board has two single-select fields:
  - **Status:** Backlog → Todo → In Progress → In Review → Done
  - **Deploy:** Not deployed → Staging → Production
- Labels follow the taxonomy in [`github/labels.sh`](github/labels.sh):
  - `type:` bug | feature | chore | docs | question
  - `area:` api | web | mobile | admin | infra | docs
  - `phase:` 1 | 2 — **scope** (live vs deferred), not schedule
  - `priority:` P1 | P2 | P3 | P4

## 3. Execution flow

```
Create a GitHub Issue
        │
        ▼
Run it via Claude Code in the terminal
        │
        ▼
Agent implements the change (code + tests + docs)
        │
        ▼
Status updated on the board (In Review → Done)
```

Create the issue on GitHub, pull it into the terminal, let the agent implement it, then
move the board status forward as it progresses.

## 4. Definition of Done loop (IMPORTANT)

When a page, feature, or task is completed, **both** of these must happen — not just the code merge:

1. **Close the GitHub issue** — put `Closes #N` in the PR description (or move the card to
   **Done** on the board). The issue does not linger open after the work ships.
2. **Create or update the per-page doc** under `docs/pages/` — and the module deep-dive under
   `docs/modules/` if the change spans a whole feature.

A task is not done until the docs reflect it. Undocumented work is unfinished work.

> Note the direction: `docs/features/` was written **before** the work (it's the spec you
> built against). `docs/pages/` and `docs/modules/` are written **after** — they record what
> now exists. If the feature doc no longer matches what you built, that's not a docs chore,
> it's a requirement change: see §6.

### Definition of Documented (per-page checklist)

A page doc under `docs/pages/` is complete when it covers:

- [ ] **Route** — the URL / path and any params.
- [ ] **Purpose** — what the page is for, in one or two sentences.
- [ ] **Components** — the key components rendered and where they come from.
- [ ] **Endpoints used** — every API endpoint the page calls.
- [ ] **State** — client/server state, query keys, and what drives re-render.
- [ ] **Validations** — form/schema rules enforced on the page.
- [ ] **Edge cases** — empty, loading, error, and permission-denied states.

## 5. Docs live in the repo

All docs live in `docs/` as markdown. There is no external docs workspace, and nothing is
mirrored anywhere. Why:

- **Version-controlled** — docs move with the code. Checking out an old commit gives you
  the docs as they were at that commit.
- **Diffable** — a doc change shows up as a reviewable diff, not an opaque page edit.
- **Reviewed** — docs go through the same PR review as the code.
- **Updated with the code** — the doc change ships in the same PR as the behaviour it
  describes, so the two can't drift. A separate system always drifts, because keeping it in
  sync is a second, skippable step.
- **One account** — GitHub is the only tool anyone needs. No extra seat, login, or sync step.
- **CLI/AI friendly** — plain markdown in the working tree is directly readable by Claude
  Code and by grep.

### The readable hub: `pnpm docs:viewer`

Raw markdown in a folder is fine for grep, less fine for reading. The docs viewer
(`scripts/build-docs-viewer.mjs`) builds **`docs/viewer.html`** — one self-contained file
with every doc, marked, CSS, and JS inlined. Open it by double-clicking; it works from
`file://`, offline, with no server and no CDN.

Features: category sidebar, rendered GFM tables, full-text search with excerpts,
light/dark following the OS, and deep links (`#docs/modules/orders.md`).

`docs/viewer.html` is **git-ignored** — it's a generated artifact. Re-run `pnpm docs:viewer`
after changing docs, or you're reading a stale snapshot.

### Why not GitHub Pages

GitHub Pages sites are **public even when the repo is private** — access-controlled Pages is
a GitHub Enterprise Cloud feature. Publishing a private repo's docs to Pages would leak them.
The local viewer keeps docs private, works offline, and stays CLI/AI friendly.

## 6. When requirements change

Requirements move — that's normal. The **order** is what's fixed, and it's the same order as
the first time round:

```
1. Update the feature doc   docs/features/<feature>.md — the story, the AC, the rules
        │
        ▼
2. Re-plan                  adjust issues + milestone (PROJECT_PLAN.md)
        │
        ▼
3. Implement                the agent works from the updated doc
        │
        ▼
4. Test                     tests follow the updated AC
        │
        ▼
5. Update the page doc      docs/pages/<screen>.md now matches reality
```

**Never code-first.** A change that lands in code but not in the doc is invisible to the next
person, and every doc downstream quietly becomes a lie. Worse, it's silent: nothing fails, so
nobody notices until someone trusts the doc and is wrong. Five minutes now, a day later.

Practical rules:

- **Small change to an existing story** → edit the feature doc, then the issue body. Same PR.
- **New story mid-milestone** → add it to the doc. It only enters the current milestone if
  something else leaves. Otherwise it's next version.
- **Story dropped** → close the issue with the reason; strike it in the doc. Don't just delete
  it — "why did we drop this?" is a question people ask twice a year.
- **A rule changed** (`BR-*`) → the doc, the code, **and** the test that pins it, together.
- **The change invalidates an ADR** → write a **new** ADR that supersedes it. ADRs are
  immutable; that's the point.
- **The change is to the app's *shape*** (an App Profile axis — e.g. single- → multi-tenant, or
  adding a locale) → this is the heavyweight case: update the App Profile in `CLAUDE.md`, write an
  ADR, **refresh the agents' context**, then build. The agents read the Profile, so a shape change
  they haven't seen means they'll build the old shape. Never let the code lead the Profile.

Bug fixes that don't change intent skip straight to implement + test — the doc was already right.

## 7. Milestones = versions

One axis, one meaning:

| Thing | Means | Where |
|---|---|---|
| **Milestone** | A version that ships: `v0.1`, `v0.2`, `v1.0` | GitHub Milestone |
| **Issue** | One user story from a feature doc | GitHub Issue |
| **`phase:` label** | Scope: live now (`phase:1`) or deferred (`phase:2`) | Label |
| **Status / Deploy** | Where the work is right now | Board fields |

Milestones sequence *delivery*; the `phase:` label marks *scope*. Different questions, different
tools. A `phase:2` issue with no milestone is deferred scope — valid and expected.

GitHub gives you the progress bar, the burn-down, and "what's left in v0.1" for free, attached
to the issues themselves — so unlike a hand-maintained roadmap, it can't drift from the work.

```bash
gh issue list --milestone "v0.1" --state open   # what's left
gh issue edit 42 --milestone "v0.1"             # schedule it
```

Scope, decomposition, and exit criteria live in [`PROJECT_PLAN.md`](PROJECT_PLAN.md).
**A milestone slipping moves issues out, not the date** — a version means a scope.
