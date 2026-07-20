# Brand: SpotKey

*Written 2026-07-20 (Stage 3). Consumed by [`../design/design-system.md`](../design/design-system.md),
which turns it into semantic tokens. Components never reference this file directly.*

## In one line

> Calm, dependable infrastructure for handing your driveway to a stranger — a utility that works,
> not an experience that performs.

## Feel

**Adjectives:** calm / dependable / plain / unhurried / legible

SpotKey should feel like a well-made public utility — the kind of thing you stop noticing because
it never surprises you. Facts stated plainly, generous space, nothing competing for attention,
everything where you expect it on the second visit.

This is not an aesthetic preference; it's the product's central problem. `CORE_DOCUMENT.md`
removed every financial safety net — no escrow, no payment tracking, no guarantee that money
changed hands. **So trust cannot come from the mechanism; it has to come from the interface.** A
person letting a stranger park in their driveway is reassured by competence and predictability,
not by charm. Calm *is* the trust strategy.

It also happens to serve the parker, who is in a car, possibly circling, possibly at night, often
one-handed. Clarity is the fastest thing you can give someone in a hurry.

## What it must never feel like

The near-misses this brand will actually be tempted by — a reviewer should point at this list:

- **Clinical or cold.** Calm tipping over into dead. Bank-app grey, hospital-form emptiness.
  Quiet is the goal; lifeless is a failure.
- **Enterprise-grey.** Dependable tipping into dull. Boring is not the same as serious.
- **Templated default.** Plain tipping into nothing — stock Material components, default
  shadows, untouched system blue. Plain must be *chosen*, and it should show.
- **Playful or cute.** No mascots, no bouncy easing, no exclamation marks. Someone is trusting
  this with a car or a driveway.
- **Urgent or salesy.** No countdown pressure, no "Only 2 spaces left!", no manufactured
  scarcity, no dark patterns near the toggle. **This is the sharpest rule here:** the product
  asks people to trust an unsecured transaction, and manufactured urgency is precisely how that
  trust is destroyed. Any pressure tactic is off-brand by definition.

## Voice

Plain and specific. State the fact, name the next action, stop. Never persuade — the product's
job is to inform a decision, not to push one.

| | Do | Don't |
|---|---|---|
| **Tone** | "This space is occupied until 4:30 PM." | "Oops! Looks like someone beat you to it 😅" |
| **Errors** | "That OTP has expired. Send a new one?" | "Error 401: token invalid." |
| **Buttons** | Verb + object: "Book this space", "Turn space on" | "Submit", "OK", "Continue" |
| **Money** | Exact and unambiguous: "You'll be charged ₹X for each day this space is on." | "Small platform fee applies." |
| **Empty states** | Say why, offer the lever: "No spaces within 2 km. Widen the search?" | "Nothing here!" |

- **Capitalisation:** sentence case everywhere, including buttons and headings.
- **Person:** "you" for the user. "we" only when SpotKey itself acts ("we'll email your invoice").
- **Never claim what we can't know.** Payment is external and untracked
  (`../features/06-booking-flow.md`), so the app says amount **due**, never "paid" or "settled".
  Voice must not imply a guarantee the system cannot make.
- **Untranslatable:** the name SpotKey stays as-is. Currency is always `₹` with no space.

## Brand palette

Source colours — brand identity, not UI roles.

*Palette superseded 2026-07-20 — see the note below.*

| Token | Value | Where it may be used |
|---|---|---|
| `--brand-primary` | `#0F766E` | Primary actions, active nav, links, focused fields, **and available map pins** |
| `--brand-primary-hover` | `#14919B` | Hover/pressed state of primary **only** |
| `--brand-primary-dark` | `#134E4A` | Dark-theme surfaces derived from primary |
| `--brand-primary-light` | `#CCFBF1` | Tinted fills, selected rows |
| `--brand-accent` | `#0891B2` | Highlights, secondary emphasis. **Never a full surface, never body text** |
| `--brand-ink` | `#0A1929` | Primary text |
| `--brand-surface` | `#FFFFFF` | Cards, sheets, elevated surfaces |
| `--brand-success` | `#047857` | Success **messages** only — never decoration, **never the map** |
| `--brand-danger` | `#DC2626` | Destructive actions and errors **only** |

> **This palette replaces the original indigo + amber.** It was imported on 2026-07-20 from the
> `Parking Design System.dc.html` Claude Design project, which the product owner chose over the
> Stage 3 palette. The reasoning below has been rewritten to match what is now true — the earlier
> indigo rationale is preserved in git history, not here, because a brand doc that argues for a
> colour it no longer uses is worse than one that says nothing.

### The map collision, and how it is handled now

The original indigo was chosen partly *because* teal risked colliding with green "available" pins.
Adopting teal makes that collision real, so it is resolved a different way:

> **Green is banned from the map entirely.** Availability is no longer a separate colour concept —
> **bookable *is* the brand state.** An available pin is `--brand-primary`; an occupied one recedes
> to neutral grey. Green survives only for success *messages*, which never appear on a map.
>
> And **availability is never signalled by colour alone**: available pins are filled and show a
> price, occupied pins are hollow and priceless. That survives sunlight, colour-blindness, and a
> 2mm pin — which colour alone does not.

**Off-brand:** no green or red anywhere except the two semantic roles above, and **no green on the
map under any circumstances**. No gradients on surfaces — with exactly one exception, the
active-session card (see `../design/design-system.md` → Signature details). Any new colour proposed
for this palette must first be checked against the map: if it could be mistaken for a state, it's
out.

### Contrast floor

This app is read through a windscreen in direct sun and at night in a dark car. **Every
text/background pair must clear WCAG AA (4.5:1), and primary actions must clear AA against both
light and dark surfaces.** Dark mode is not a preference here — `../features/16-settings-flow.md`
ships Light/Dark/System, and night is a primary use case, not an edge case.

## Type roles

| Role | Family | Weights | Use |
|---|---|---|---|
| Display | `Poppins` | 500, 600, 700 | Screen titles, section headings, **and every numeric fact** — rate, distance, duration, amount, slot count |
| UI / body | `Inter` | 400, 500, 600, 700 | Everything else |
| Mono | `JetBrains Mono` | 400, 500 | Vehicle registration numbers, OTP codes, booking IDs, invoice numbers |

Inter carries the body for its tall x-height and legibility at small sizes in glare, plus a correct
`₹` glyph. Poppins carries headings and, unusually, **numbers**.

> **Why numbers get the display face.** This product's content *is* numbers — ₹30/hr, 0.4 km,
> 2 slots, 4.8 stars, ₹38 due. A driver scanning a card at arm's length is reading figures, not
> prose. Setting them in the heavier, wider display face is what makes a space card legible in a
> parked car, and it is the single decision that most affects whether the app feels usable at a
> glance.

> **Mono is structural, not decorative.** Registration numbers and OTP codes are transcribed by
> humans under time pressure, out of a car window or off a screen. A proportional face makes
> `0/O` and `1/l/I` ambiguous and produces a failed booking the user cannot diagnose. Every
> machine-readable identifier renders in mono.

## Imagery & motif

- **Photography:** **user-uploaded only.** The 3–8 space photos from
  `../features/09-add-space-flow.md` are the app's only photography, and they will be amateur —
  shot at night, badly framed, mixed aspect ratios. **The design must make ordinary photos look
  respectable rather than assume good ones:** fixed aspect-ratio containers, consistent corner
  radius, a subtle scrim where text overlays. **No stock photography anywhere** — aspirational
  imagery next to a real user's dim driveway photo makes the real listing look worse, and the
  real listing is the product.
- **Illustration:** sparing, line-based, single-weight, `--brand-primary` on `--brand-surface`.
  Empty states and onboarding only. Never decorative filler.
- **Icons:** one library, one weight — Lucide, 1.5px stroke. No mixing sets, no filled/outline
  mixing within a screen.
- **Motif:** **none.** No recurring graphic device. A utility earns its identity through
  consistent structure — the space card, the map pin, the toggle — not through ornament.

## Logo & assets

- **Masters:** `libs-common/brand-assets/masters/` *(not yet created)*
- **Generated into apps by:** `pnpm brand:generate` *(not yet written)*
- **Config:** `libs-common/brand-assets/brand.json` — the configurable knob: change it there,
  regenerate, every surface follows.
- **Clear space / min size:** `[OPEN]` — pending the logo itself.
- **Don'ts:** no recolouring, no stretching, no effects, no placing on `--brand-accent`.

> **`[OPEN]` No logo exists yet.** This section is a contract for where it will live, not a record
> of something built. Blocks app-store submission (`expo:eas-app-stores`) and the splash screen in
> `../features/00-splash-onboarding-flow.md`.

## Configurable token block

The contract between brand and code. Keep in sync with `brand.json`.

```jsonc
{
  "brand": {
    "primary":      "#0F766E",
    "primaryHover": "#14919B",
    "primaryDark":  "#134E4A",
    "primaryLight": "#CCFBF1",
    "accent":       "#0891B2",
    "ink":          "#0A1929",
    "surface":      "#FFFFFF",
    "success":      "#047857",
    "danger":       "#DC2626"
  },
  "font": {
    "display": "Poppins",
    "sans":    "Inter",
    "mono":    "JetBrains Mono"
  },
  "radius": "8px"
}
```

> **Radius 8px**, with 6px for small controls and 12px for cards and sheets — imported from the
> design system. (The Stage 3 doc specified a single 12px; the imported system distinguishes three
> steps, which is the more useful contract.)

> **Poppins for display, Inter for body.** The Stage 3 doc used Inter for both, on the grounds that
> a second face would add personality this brand doesn't want. The imported system pairs Poppins
> headings with Inter body, and that has earned its place for a specific reason: **numeric facts —
> rate, distance, duration, amount — are set in the display face**, which makes a space card
> scannable at arm's length in a car. Mono is retained from Stage 3 and was not in the import.

## Related docs

- Kickoff: [`../../CORE_DOCUMENT.md`](../../CORE_DOCUMENT.md)
- Design system (consumes this): [`../design/design-system.md`](../design/design-system.md)
- Per-surface specs: [`../design/_template.md`](../design/_template.md)
