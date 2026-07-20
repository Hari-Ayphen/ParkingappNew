# Design System — `{{APP_NAME}}`

> **Template.** One per project (not per surface — that's [`_template.md`](./_template.md)).
> Derived from [`../branding/brand.md`](../branding/_template.md): brand says *what it feels
> like*, this says *what components use*. Fill each section, delete the prompts.
>
> **This is the file the `frontend-agent` and `mobile-agent` read before writing any UI.**
> If it's wrong or stale, they'll be wrong. Keep it true.

- **Token source of truth (code):** `{{libs/ui/src/styles/tokens.css}}` / `{{libs-mobile/theme/tokens.ts}}`
- **Component library:** `{{libs/ui}}` / `{{libs-mobile/components}}`

## The one rule

**Components use semantic tokens. Never raw hex, never `--brand-*` directly.**

`--brand-primary` is identity. `--primary` is a role. Components ask for the role, so
rebranding is a token remap instead of a codebase sweep — and dark mode is free.

```
brand.md            design-system.md          component
─────────           ────────────────          ─────────
--brand-primary  →  --primary            →    <Button variant="primary">
                    --primary-fg
                    --primary-hover
```

Need a color that has no token? **Propose a token here first**, then use it. Do not
invent a one-off in a component — that's how a design system dies.

## Semantic tokens

> The roles components are allowed to reference. Every row maps back to a `--brand-*`
> source and names its use. Fill both themes — if a value is identical across themes,
> say so rather than leaving a blank.

### Surface & text

| Token | Light | Dark | From | Use |
|---|---|---|---|---|
| `--bg` | `{{…}}` | `{{…}}` | {{--brand-surface}} | {{page background}} |
| `--fg` | `{{…}}` | `{{…}}` | {{--brand-ink}} | {{primary text}} |
| `--muted` | `{{…}}` | `{{…}}` | {{…}} | {{secondary surfaces, skeletons}} |
| `--muted-fg` | `{{…}}` | `{{…}}` | {{…}} | {{secondary/helper text}} |
| `--card` | `{{…}}` | `{{…}}` | {{…}} | {{card + sheet surface}} |
| `--border` | `{{…}}` | `{{…}}` | {{…}} | {{dividers, input borders}} |
| `--ring` | `{{…}}` | `{{…}}` | {{…}} | {{focus ring — never decorative}} |

### Action & status

| Token | Light | Dark | From | Use |
|---|---|---|---|---|
| `--primary` | `{{…}}` | `{{…}}` | {{--brand-primary}} | {{primary action}} |
| `--primary-fg` | `{{…}}` | `{{…}}` | {{…}} | {{text/icon on `--primary`}} |
| `--accent` | `{{…}}` | `{{…}}` | {{--brand-accent}} | {{highlights, badges}} |
| `--destructive` | `{{…}}` | `{{…}}` | {{--brand-danger}} | {{destructive actions, errors}} |
| `--success` | `{{…}}` | `{{…}}` | {{--brand-success}} | {{success state only}} |
| `--warning` | `{{…}}` | `{{…}}` | {{…}} | {{warnings}} |

**Contrast:** every fg/bg pair above must clear **WCAG AA (4.5:1** body, **3:1** large
text and UI borders) in **both** themes. Check when you add a token, not at audit time.

## Type scale

| Step | Size / line-height | Weight | Family | Use |
|---|---|---|---|---|
| `{{display}}` | `{{…}}` | `{{…}}` | {{display}} | {{hero only}} |
| `{{h1}}` | `{{…}}` | `{{…}}` | {{sans}} | {{page title}} |
| `{{h2}}` | `{{…}}` | `{{…}}` | {{sans}} | {{section}} |
| `{{body}}` | `{{…}}` | `{{…}}` | {{sans}} | {{default}} |
| `{{small}}` | `{{…}}` | `{{…}}` | {{sans}} | {{helper, captions}} |

- **Min body size:** {{16px on mobile — smaller triggers iOS input zoom}}
- **Default weight:** {{…}} — {{state the rule; e.g. "weight is the exception, not the default"}}

## Spacing, radius, elevation

- **Spacing scale:** {{4 / 8 / 12 / 16 / 24 / 32 / 48}} — {{no arbitrary values}}
- **Radius:** `{{--radius}}` = {{…}}; {{sm/md/lg derive from it}}
- **Elevation:** {{how many levels, and what each means}}
  | Level | Value | Use |
  |---|---|---|
  | `{{shadow-sm}}` | {{…}} | {{cards at rest}} |
  | `{{shadow-md}}` | {{…}} | {{popovers, sheets}} |

## Layout

> Layout is part of the design system, not an afterthought left to each page. Two pages built
> by two people must land on the same frame. Fill the values; keep the rules verbatim.

### Layout tokens

Chrome dimensions are **tokens, not magic numbers** — content padding and scroll math both
derive from them, so a hardcoded header height silently breaks both.

| Token | Value | Use |
|---|---|---|
| `--layout-header-height` | `{{3.5rem}}` | fixed top bar; content offset; sticky offset |
| `--layout-sidebar-width-expanded` | `{{240px}}` | desktop sidebar, expanded |
| `--layout-sidebar-width-collapsed` | `{{3.5rem}}` | desktop sidebar, collapsed |
| `--layout-bottomnav-height` | `{{4rem}}` | mobile bottom nav |
| `--page-header-sticky-offset` | `var(--layout-header-height)` | where the page header sticks |
| `--app-content-height` | `calc(100svh - var(--layout-header-height))` | bounded scroll regions |

### The scroll model — read this before building any shell

**Chrome never scrolls. Content scrolls.** The nav, sub-menu, and list panel stay put while only
the content region moves. There are exactly two ways to achieve that — pick one per surface and
don't mix them in the same region.

**Mode A — document scroll.** The default for ordinary pages. Chrome is `position: fixed`, so it
is out of flow and *cannot* scroll. The content region reserves that space with **padding, never
margin**:

```
header      fixed top-0 inset-x-0  h-[var(--layout-header-height)]   z-50
sidebar     fixed left-0 top-[var(--layout-header-height)] bottom-0  z-40
bottom nav  fixed inset-x-0 bottom-0                                 z-50

main        pt-[var(--layout-header-height)]
            lg:pl-[var(--layout-sidebar-width-expanded)]
            pb-[var(--layout-bottomnav-height)]     ← mobile only
```

The page header then sticks *below* the fixed app header:
`sticky top-[var(--page-header-sticky-offset)]`.

**Mode B — inner scroll.** Required whenever a sub-menu or list panel must stay fixed while
content scrolls independently. The region gets a **bounded height**, and each pane declares
whether it scrolls:

```
h-[var(--app-content-height)]              ← bounded height: nothing can grow the page
  └ flex min-h-0 flex-1                    ← the row
     ├ aside  shrink-0 overflow-hidden     ← menu: never scrolls with content
     │    └ nav  min-h-0 flex-1 overflow-y-auto   ← scrolls itself, only if long
     └ div    flex-1 min-w-0 overflow-y-auto      ← the ONLY thing that scrolls
```

**Three rules, and the first one is the whole trick:**

1. **Every `overflow-y-auto` inside a flex row is paired with `min-h-0`.** A flex child defaults
   to `min-height: auto` and refuses to shrink below its content, so `overflow-y-auto` never
   engages, the scroll bubbles up to the document — **and the menu scrolls away with the
   content.** This single missing class is the most common layout bug there is.
2. **The scroll container needs a bounded height** (`--app-content-height`). `overflow-y-auto`
   on an unbounded element does nothing.
3. **Use `svh`, not `vh`.** `100vh` ignores mobile browser chrome and cuts off the bottom.

Panes that must not scroll get `shrink-0`. A sticky header *inside* a scroll pane uses
`sticky top-0` — it sticks to the pane, not the viewport.

### Breakpoints

| Breakpoint | Min width | Layout change |
|---|---|---|
| `{{sm}}` | `{{640px}}` | {{…}} |
| `{{md}}` | `{{768px}}` | {{…}} |
| `{{lg}}` | `{{1024px}}` | {{sidebar appears; sub-menu switches from pill scroller to rail}} |
| `{{xl}}` | `{{1280px}}` | {{…}} |

### Container widths

Named roles, not ad-hoc `max-w-*`. **The page header and the page content use the same width**,
or they visibly misalign.

| Role | Value | Use |
|---|---|---|
| `full` | none | {{tables, dashboards, anything that earns the width}} |
| `centered` | `{{max-w-[1400px] mx-auto}}` | {{default for wide content}} |
| `narrow` | `{{lg:max-w-[80%] lg:mx-auto}}` | {{forms, detail views}} |
| `prose` | `{{max-w-[68ch]}}` | {{long-form reading}} |

- **Page padding:** `{{px-4 py-4}}` mobile → `{{px-6}}` at `{{lg}}`. Owned by the page layout —
  a page never sets its own.

### Spacing rhythm

The scale above says which values are *allowed*; this says which value means *what*. Without
it, two compliant pages still look different.

| Relationship | Step |
|---|---|
| Page padding | `{{16 / 24}}` |
| Between sections | `{{32}}` |
| Between cards in a list/grid | `{{16}}` |
| Between form fields | `{{12}}` |
| Label → control | `{{4}}` |
| Inline (icon → text, chips) | `{{8}}` |

## Components

> The inventory. One row per component, its states, and where it lives. A component
> that isn't here doesn't exist yet — **check this table before building a new one.**

### Layout primitives

> These exist *before* any page does. "Owns" is the contract: if a primitive owns a concern,
> nothing below it sets that concern.

| Primitive | Owns | Scrolls? | Source |
|---|---|---|---|
| {{AppLayout}} | fixed chrome (header, sidebar, bottom nav); content offset padding | no — chrome is `fixed` | `{{…}}` |
| {{PageLayout}} | sticky page header, container width, page padding | document (Mode A) | `{{…}}` |
| {{SubMenuPageLayout}} | fixed left sub-nav + independent content pane | content only (Mode B) | `{{…}}` |
| {{SelectionPanelLayout}} | master-detail list panel + detail pane | panel and content, separately (Mode B) | `{{…}}` |
| {{Section}} | a heading + its content block, at the section rhythm step | no | `{{…}}` |

### Elements

| Component | States | Source |
|---|---|---|
| {{Button}} | default / hover / active / disabled / loading | `{{libs/ui/button.tsx}}` |
| {{Input}} | default / focus / error / disabled / readonly | `{{…}}` |
| {{Card}} | default / interactive | `{{…}}` |
| {{Badge}} | {{neutral / success / warning / danger}} | `{{…}}` |
| {{Skeleton}} | mirrors the shape of the content it replaces | `{{…}}` |
| {{Empty state}} | icon + title + description + {{primary action}} | `{{…}}` |
| {{Error state}} | title + message + **retry action** + {{error id}} | `{{…}}` |
| {{Field}} | label / hint / **error** / disabled / required | `{{…}}` |
| {{NumberInput}} | default / focus / error / disabled; no native spinners | `{{…}}` |
| {{CurrencyInput}} | as NumberInput + {{symbol}}; decimals from the currency, format on blur | `{{…}}` |
| {{Modal}} | open / closing; bounded height, own scroll | `{{…}}` |
| {{Table}} | default / loading / empty / no-match; {{sticky header}} | `{{…}}` |
| {{Stepper}} | per step: upcoming / current / complete / error | `{{…}}` |

**Non-negotiables:**

- Every interactive element has a visible **focus** state using `--ring`.
- Every async action has a **loading** state and is **double-submit guarded**.
- Every list has **empty**, **loading**, and **error** states. All three, every time.
- **Each error surfaces at its own altitude** — field errors inline on the field, failed loads as
  an error state **with retry**, failed actions as a toast. A failed load shown as a toast leaves
  the user on a blank page; a field error shown as a toast leaves them unable to fix it.
- **"Nothing yet" and "nothing matched" are different states** with different copy. Swapping the
  whole view for an empty state when a filter matched nothing hides the control that caused it.
- Minimum touch target **{{44×44}}**.
- **Nav, sub-menu, and panel chrome never scrolls with content.** See the scroll model.
- **Every `overflow-y-auto` in a flex row is paired with `min-h-0`.**
- **A page never sets its own container width or page padding** — it composes the page layout.
- **A skeleton mirrors the loaded layout's shape**, so nothing shifts when data lands.

## Dark mode

- **Mechanism:** {{class on `<html>` / `prefers-color-scheme` / theme provider}}
- **Default:** {{follow OS}}
- **Rule:** dark mode is a **token remap only**. If a component needs a
  `{{dark:}}` override, that's a missing token — add the token instead.
- **Watch:** {{elevation reads inverted in dark — surfaces lighten, shadows don't deepen}}

## Motion

- **Durations:** {{fast 120ms (hover) / base 200ms (enter) / slow 320ms (sheets)}}
- **Easing:** {{…}}
- **Rule:** motion explains a change of state. {{Nothing loops; nothing decorates.}}
- **Reduced motion:** respect `prefers-reduced-motion` — {{fade, don't move}}.

## Signature details

> Tokens and states make a UI *correct*. They do not make it *yours* — a fully compliant screen
> can still look like every other admin template. This section is where the product earns a
> recognisable character. Name 3–5 details, apply them **everywhere**, and treat them as part of
> the system rather than per-page flourishes.
>
> Examples of the *kind* of thing that belongs here (replace with your own — copying these
> defeats the purpose):
>
> - {{Multi-word page titles render the final word in `--primary`.}}
> - {{The page header collapses on scroll: the title shrinks from `h1` to `h3`, and the
>   eyebrow / subtitle / breadcrumb fade out via `max-height` + `opacity`.}}
> - {{The active nav item gets an 8% accent wash plus a 2px accent bar on its leading edge —
>   the same treatment in the sidebar, the sub-menu, and selected list rows.}}
> - {{Section headings use an eyebrow label above the title, never a heavier weight.}}

| Detail | Where it applies | Why it's ours |
|---|---|---|
| {{…}} | {{…}} | {{…}} |

**Rule:** a signature detail that appears on one screen and not its siblings reads as a bug, not
character. If it's here, it's everywhere.

## Related docs

- Brand (source of the feel): [`../branding/brand.md`](../branding/_template.md)
- Per-surface specs: [`./_template.md`](./_template.md)
- Frontend architecture: [`../architecture/frontend.md`](../architecture/frontend.md)
- Page docs: [`../pages/README.md`](../pages/README.md)
