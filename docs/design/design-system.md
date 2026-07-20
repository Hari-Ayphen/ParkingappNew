# Design System — SpotKey

Derived from [`../branding/brand.md`](../branding/brand.md): brand says *what it feels like*, this
says *what components use*.

**This is the file the `frontend-agent` and `mobile-agent` read before writing any UI.** If it's
wrong or stale, they'll be wrong.

- **Token source of truth (mobile):** `libs-mobile/theme/tokens.ts`
- **Token source of truth (admin):** `libs-web/styles/tokens.css`
- **Component library:** `libs-mobile/components` / `libs-web/ui`

*Imported 2026-07-20 from the `Mobile parking app design system` Claude Design project
(`Parking Design System.dc.html`). Adapted — see "What changed on import" at the end. **The
imported palette supersedes `brand.md`'s indigo**; brand.md has been updated to match.*

## The one rule

**Components use semantic tokens. Never raw hex, never `--brand-*` directly.**

`--brand-primary` is identity. `--primary` is a role. Components ask for the role, so rebranding is
a token remap instead of a codebase sweep — and dark mode is free.

```
brand.md            design-system.md          component
─────────           ────────────────          ─────────
--brand-primary  →  --primary            →    <Button variant="primary">
                    --primary-fg
                    --primary-hover
```

Need a colour that has no token? **Propose a token here first.** Do not invent a one-off in a
component — that's how a design system dies.

## Semantic tokens

### Surface & text

| Token | Light | Dark | From | Use |
|---|---|---|---|---|
| `--bg` | `#f5f7fa` | `#0a1929` | Slate 50 / Slate 950 | Page background |
| `--fg` | `#1a2332` | `#f1f5f9` | Slate 900 / Slate 100 | Primary text |
| `--card` | `#ffffff` | `#14243a` | White / raised slate | Card + sheet surface |
| `--muted` | `#f1f5f9` | `#14243a` | Slate 100 | Secondary surfaces, skeletons |
| `--muted-fg` | `#64748b` | `#94a3b8` | Slate 500 / Slate 400 | Secondary and helper text |
| `--border` | `#e2e8f0` | `#1e3a52` | Slate 200 | Dividers, input borders |
| `--ring` | `#0f766e` | `#2dd4bf` | `--brand-primary` | Focus ring — **never decorative** |

### Action & status

| Token | Light | Dark | From | Use |
|---|---|---|---|---|
| `--primary` | `#0f766e` | `#2dd4bf` | `--brand-primary` | Primary action, active nav, links |
| `--primary-fg` | `#ffffff` | `#0a1929` | — | Text/icon on `--primary` |
| `--primary-hover` | `#14919b` | `#5eead4` | `--brand-primary-hover` | Hover/pressed of primary **only** |
| `--primary-subtle` | `#ccfbf1` | `#134e4a` | `--brand-primary-light` | Tinted fills, selected rows |
| `--accent` | `#0891b2` | `#22d3ee` | `--brand-accent` | Highlights, secondary emphasis |
| `--destructive` | `#dc2626` | `#f87171` | `--brand-danger` | Destructive actions and errors **only** |
| `--destructive-subtle` | `#fee2e2` | `#450a0a` | — | Error banner background |
| `--success` | `#047857` | `#34d399` | `--brand-success` | Success state **only** — never decoration |
| `--success-subtle` | `#d1fae5` | `#064e3b` | — | Success banner background |
| `--warning` | `#b45309` | `#fbbf24` | — | Warnings |
| `--warning-subtle` | `#fef3c7` | `#451a03` | — | Warning banner background |
| `--info` | `#0e7c86` | `#67e8f9` | — | Informational messages |

> **`--success` is `#047857`, not the imported `#059669`.** Emerald-600 on white is ~3.3:1 — it
> fails AA for body text. Emerald-700 clears it. The lighter value survives only as
> `--success-subtle`, a background, where it never carries text.

### Map & availability — read before touching a pin

| Token | Light | Dark | Use |
|---|---|---|---|
| `--map-available` | `#0f766e` | `#2dd4bf` | A bookable space. **Same value as `--primary`** |
| `--map-occupied` | `#64748b` | `#94a3b8` | All slots busy. Same as `--muted-fg` |
| `--map-self` | `#0891b2` | `#22d3ee` | The user's own location dot |

> **Green never appears on the map.** The imported system paired a teal brand with an emerald
> "available" state, and on a small pin at a glance those read as the same thing — the exact
> collision `brand.md` flagged when teal was first considered.
>
> The fix is not a different green. It is to stop treating availability as a separate colour
> concept: **bookable *is* the brand state**, so an available pin is `--primary` and an occupied
> one recedes to grey. Green survives only for success *messages*, which never appear on the map.
>
> **Availability is never colour alone.** An available pin is filled and shows its price; an
> occupied pin is hollow, grey, and priceless. Colour-blind users, and anyone glancing at a phone
> in sunlight, get the distinction from shape and content.

**Contrast:** every fg/bg pair must clear **WCAG AA (4.5:1 body, 3:1 large text and UI borders)**
in **both** themes. This app is read through a windscreen in direct sun and at night — check when
you add a token, not at audit time.

## Type scale

| Step | Size / line-height | Weight | Family | Use |
|---|---|---|---|---|
| `display` | 32 / 1.2 | 700 | Poppins | Screen titles, the session timer |
| `h1` | 24 / 1.2 | 700 | Poppins | Page title |
| `h2` | 20 / 1.3 | 600 | Poppins | Section |
| `h3` | 16 / 1.3 | 600 | Poppins | Card title |
| `body-lg` | 16 / 1.5 | 500 | Inter | Emphasis body |
| `body` | 14 / 1.5 | 400 | Inter | Default |
| `label` | 14 / 1.4 | 500 | Inter | Button labels, field labels |
| `caption` | 12 / 1.4 | 400 | Inter | Helper text |
| `overline` | 12 / 1 | 600 | Inter | Uppercase, 0.5px tracking — table/section labels |
| `mono` | 14 / 1.4 | 400–500 | JetBrains Mono | **Machine-readable identifiers** |

- **Families:** Poppins (500/600/700) for headings and numeric facts. Inter (400/500/600/700) for
  everything else. JetBrains Mono for identifiers.
- **Min body size: 16px on inputs** — anything smaller triggers iOS input zoom on focus.
- **Weight is the exception, not the default.** Hierarchy comes from size and colour first.

> **Mono is structural, not decorative.** Vehicle registration numbers, OTP codes, booking ids and
> invoice numbers are transcribed by humans under time pressure — out of a car window, off a
> screen, at night. A proportional face makes `0/O` and `1/l/I` ambiguous, and the result is a
> failed booking the user cannot diagnose. **Every machine-readable identifier renders in mono.**
> The imported system had no mono role; this is added, not imported.

## Spacing, radius, elevation

- **Spacing scale:** `4 / 8 / 12 / 16 / 24 / 32 / 48` — 8px base. No arbitrary values.
- **Radius:** `--radius` = **8px**; `--radius-sm` = 6px (chips, small buttons); `--radius-lg` =
  12px (cards, sheets); `--radius-full` = 999px (badges, pills).
- **Elevation** — four levels, all tinted with the ink hue rather than neutral black:

  | Level | Value | Use |
  |---|---|---|
  | `--shadow-1` | `0 1px 2px rgba(10,25,41,.05)` | Cards at rest |
  | `--shadow-2` | `0 3px 8px rgba(10,25,41,.12)` | Raised cards, the space card |
  | `--shadow-3` | `0 8px 16px rgba(10,25,41,.15)` | Sheets, the active-session card |
  | `--shadow-4` | `0 16px 32px rgba(10,25,41,.20)` | Modals |

## Layout

Two surfaces with different rules. **Mobile is the product; admin is internal tooling.**

### Mobile (Expo) — the product

Native patterns, not web breakpoints.

| Token | Value | Use |
|---|---|---|
| `--layout-header-height` | 56px | Screen header |
| `--layout-bottomnav-height` | 64px | Bottom tab bar |
| `--screen-padding-x` | 16px | Horizontal safe padding, both sides |
| `--touch-min` | 44×44px | Minimum touch target — no exceptions |

- **Safe areas are honoured on every screen**: status bar/notch at the top, home indicator at the
  bottom. Never hardcode; read the inset.
- Bottom nav: **Home · Profile · Settings** (`02-after-login-flow.md`).
- One primary action per screen, thumb-reachable.

### Admin (Next.js) — desktop-first

| Token | Value | Use |
|---|---|---|
| `--layout-header-height` | 3.5rem | Fixed top bar; content offset; sticky offset |
| `--layout-sidebar-width-expanded` | 240px | Sidebar, expanded |
| `--layout-sidebar-width-collapsed` | 3.5rem | Sidebar, collapsed |
| `--page-header-sticky-offset` | `var(--layout-header-height)` | Where the page header sticks |
| `--app-content-height` | `calc(100svh - var(--layout-header-height))` | Bounded scroll regions |

Chrome dimensions are **tokens, not magic numbers** — content padding and scroll math both derive
from them, so a hardcoded header height silently breaks both.

### The scroll model — read this before building any admin shell

**Chrome never scrolls. Content scrolls.** Two ways to achieve it; pick one per surface and never
mix them in the same region.

**Mode A — document scroll.** Default for ordinary pages. Chrome is `position: fixed`, out of
flow, so it *cannot* scroll. Content reserves the space with **padding, never margin**:

```
header      fixed top-0 inset-x-0  h-[var(--layout-header-height)]   z-50
sidebar     fixed left-0 top-[var(--layout-header-height)] bottom-0  z-40

main        pt-[var(--layout-header-height)]
            lg:pl-[var(--layout-sidebar-width-expanded)]
```

**Mode B — inner scroll.** Required when a sub-menu or list panel must stay fixed while content
scrolls independently:

```
h-[var(--app-content-height)]              ← bounded height: nothing can grow the page
  └ flex min-h-0 flex-1                    ← the row
     ├ aside  shrink-0 overflow-hidden     ← menu: never scrolls with content
     │    └ nav  min-h-0 flex-1 overflow-y-auto
     └ div    flex-1 min-w-0 overflow-y-auto      ← the ONLY thing that scrolls
```

**Three rules, and the first is the whole trick:**

1. **Every `overflow-y-auto` inside a flex row is paired with `min-h-0`.** A flex child defaults to
   `min-height: auto` and refuses to shrink below its content, so `overflow-y-auto` never engages,
   the scroll bubbles to the document — **and the menu scrolls away with the content.** This single
   missing class is the most common layout bug there is.
2. **The scroll container needs a bounded height.** `overflow-y-auto` on an unbounded element does
   nothing.
3. **Use `svh`, not `vh`.** `100vh` ignores mobile browser chrome and cuts off the bottom.

### Breakpoints (admin only)

| Breakpoint | Min width | Layout change |
|---|---|---|
| `md` | 768px | Two-column forms |
| `lg` | 1024px | Sidebar appears; tables gain their full column set |
| `xl` | 1280px | Master-detail panels side by side |

### Container widths (admin only)

| Role | Value | Use |
|---|---|---|
| `full` | none | Moderation queues, invoice tables — anything that earns the width |
| `centered` | `max-w-[1400px] mx-auto` | Default |
| `narrow` | `lg:max-w-[80%] lg:mx-auto` | Forms, detail views |

**Page padding:** `px-4 py-4` mobile → `px-6` at `lg`. Owned by the page layout — a page never
sets its own.

### Spacing rhythm

The scale says which values are *allowed*; this says which value means *what*.

| Relationship | Step |
|---|---|
| Screen / page padding | 16 |
| Between sections | 32 |
| Between cards in a list | 16 |
| Between form fields | 12 |
| Label → control | 4 |
| Inline (icon → text, chips) | 8 |
| Inside a card | 16 |

## Components

A component that isn't here doesn't exist yet — **check this table before building a new one.**

### Layout primitives

| Primitive | Owns | Scrolls? | Surface |
|---|---|---|---|
| `AppShell` | Bottom nav, header, safe-area insets | no — chrome is fixed | mobile |
| `Screen` | Screen padding, header, single primary action | document | mobile |
| `Sheet` | Bottom sheet: bounded height, own scroll, drag handle | content only | mobile |
| `AppLayout` | Fixed chrome; content offset padding | no | admin |
| `PageLayout` | Sticky page header, container width, page padding | document (Mode A) | admin |
| `SelectionPanelLayout` | Master-detail: queue list + detail pane | both, separately (Mode B) | admin |

### Elements

| Component | States | Notes |
|---|---|---|
| `Button` | default / hover / active / disabled / loading | primary, secondary (2px outline), ghost. Sizes sm 8×16 / md 12×24 / lg 16×32 |
| `Input` | default / focus / error / disabled | focus = 2px `--ring`; error = 2px `--destructive` |
| `SearchInput` | as Input + leading icon | Map/search screen |
| `Field` | label / hint / **error** / disabled / required | wraps any control |
| `OtpInput` | default / focus / error / expired | **mono**, 6 cells |
| `PlateInput` | default / focus / error | **mono**, country-aware format mask |
| `Card` | default / interactive / highlighted | `--radius-lg`, `--shadow-1` |
| `SpaceCard` | available / occupied / suspended | see Signature details |
| `SessionTimer` | arriving / active / exit-pending | the one gradient surface |
| `Badge` | neutral / success / warning / danger / info | pill, `--radius-full` |
| `Tabs` | active / inactive | 3px underline in `--primary` |
| `StatusBanner` | success / error / warning / info | 4px leading border + subtle bg |
| `Skeleton` | mirrors the shape of what it replaces | |
| `EmptyState` | icon + title + description + action | |
| `ErrorState` | title + message + **retry** + error id | |
| `Modal` | open / closing | bounded height, own scroll |
| `Stepper` | upcoming / current / complete / error | Add Space, 7 steps |
| `Table` | default / loading / empty / no-match | admin only; sticky header |
| `CurrencyText` | — | **always ₹, always whole rupees** (ADR-0006) |

**Non-negotiables:**

- Every interactive element has a visible **focus** state using `--ring`.
- Every async action has a **loading** state and is **double-submit guarded**.
- Every list has **empty**, **loading**, and **error** states. All three, every time.
- **Each error surfaces at its own altitude** — field errors inline, failed loads as an error state
  **with retry**, failed actions as a toast. A failed load shown as a toast leaves the user on a
  blank page; a field error shown as a toast leaves them unable to fix it.
- **"Nothing yet" and "nothing matched" are different states** with different copy.
- Minimum touch target **44×44**.
- **A page never sets its own container width or page padding.**
- **A skeleton mirrors the loaded layout's shape**, so nothing shifts when data lands.
- **No component may render a "Pay" affordance that implies in-app processing.** Payment is
  external (`06-booking-flow.md`) — the QR and the app deep-links are *navigation*, and cash is
  equally valid.

## Dark mode

- **Mechanism:** theme provider, class on root; follows OS by default with a manual override in
  Settings (`16-settings-flow.md`).
- **Rule:** dark mode is a **token remap only**. If a component needs a `dark:` override, that's a
  missing token — add the token.
- **Watch:** elevation inverts. In dark, surfaces **lighten** to rise (`--card` is lighter than
  `--bg`); shadows do not deepen. `--shadow-*` values are near-invisible on dark and should be
  paired with a subtle border.
- **Not optional here.** Night parking is a primary use case, not an edge case — a driver reading
  this at 11pm is the median user, not the exception. The imported design system had no dark
  theme; every dark value above is derived, and should be checked on a real device before v0.3
  closes.

## Motion

- **Durations:** fast 120ms (hover/press) / base 200ms (enter) / slow 320ms (sheets).
- **Easing:** `cubic-bezier(0.2, 0, 0, 1)` — decelerate on enter, accelerate on exit.
- **Rule:** motion explains a change of state. Nothing loops; nothing decorates. The brand is
  "calm, dependable" — bouncy easing is off-brand.
- **The session timer does not animate its digits.** It is a fact, not a performance.
- **Reduced motion:** respect `prefers-reduced-motion` — fade, don't move.

## Signature details

Tokens and states make a UI *correct*. They do not make it *yours*.

| Detail | Where it applies | Why it's ours |
|---|---|---|
| **Numeric facts render in Poppins semi-bold, never Inter** | Rate, distance, duration, amount, slot counts | The product's content *is* numbers. Setting them in the heading face makes a space card scannable at arm's length in a car |
| **The active-session card is the only gradient surface in the product** | `SessionTimer` only (`--primary` → `--accent`, 135°) | One screen matters more than the rest — the one where money is accruing. Gradient used anywhere else destroys the signal |
| **Status uses a 4px leading border plus a subtle tint, never a fully coloured surface** | `StatusBanner`, moderation rows, invoice states | A full-bleed colour block reads as an alarm. The bar carries the meaning at a glance without shouting |
| **Machine-readable identifiers are always mono, always selectable** | Plates, OTPs, booking ids, invoice numbers | Signals "you will need to read this precisely" — and makes the character disambiguation real |
| **Availability is shape + content, never colour alone** | Map pins, `SpaceCard`, `SpaceDetail` | Filled + priced = bookable; hollow + grey = not. Survives sunlight, colour-blindness, and a 2mm pin |

**Rule:** a signature detail that appears on one screen and not its siblings reads as a bug, not
character. If it's here, it's everywhere.

## What changed on import

The source project was built for a **commercial garage** product, not a P2P marketplace. Adapted:

| Imported | Changed to | Why |
|---|---|---|
| `$3.50/hr`, `$9.23` | `₹`, whole rupees | India-first, UPI. Amounts round to whole rupees (ADR-0006) |
| "Payment could not be processed" error state | **Removed** | SpotKey processes no payments — there is no gateway to fail (`product.md:23`) |
| "Extend" button on session timer | **Removed** | No extend flow exists |
| "2h 34m **remaining**" countdown | Counts **up** | Sessions have no clock-expiry; exit is owner-verified |
| "Rate surge: +$0.50/hr peak hours" | **Removed** | No surge pricing in the product |
| "Spot A-15 · Zone A, Level 2" | Space name + owner | Driveways and plots, not numbered garage bays |
| "Limited" / "Full" capacity badges | available / occupied / suspended | Matches `space_status` + slot model (ADR-0005) |
| Success `#059669` | `#047857` | The lighter value fails AA for body text |
| Emerald "available" on the map | `--primary` teal, green removed from map | Collision with a teal brand at pin size |
| Poppins + Inter | **+ JetBrains Mono** | Identifiers are transcribed under pressure |
| No dark theme | Full dark token set | Night parking is a primary use case |
| Quick Reference "Primary (#1a5490)" | Dropped | A blue appearing nowhere else — an error in the source |

## Related docs

- Brand (source of the feel): [`../branding/brand.md`](../branding/brand.md)
- Frontend architecture: [`../architecture/frontend.md`](../architecture/frontend.md)
- Page docs: [`../pages/README.md`](../pages/README.md)
- ADR-0005 (slots), ADR-0006 (money mechanics): [`../decisions/`](../decisions/)
