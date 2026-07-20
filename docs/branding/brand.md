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

| Token | Value | Where it may be used |
|---|---|---|
| `--brand-primary` | `#2F3E8C` | Primary actions, active nav, links, focused fields |
| `--brand-primary-dark` | `#1E2A63` | Hover/pressed state of primary **only** |
| `--brand-accent` | `#E8A317` | The live/ON toggle, highlights, badges. **Never a full surface, never body text** |
| `--brand-ink` | `#14161C` | Primary text |
| `--brand-surface` | `#FFFFFF` | Cards, sheets, elevated surfaces |
| `--brand-success` | `#1F9D55` | Success state **only** — never decoration |
| `--brand-danger` | `#C6362F` | Destructive actions and errors **only** |

### Reserved: map availability states

`--brand-success` and `--brand-danger` do double duty as **map availability** — green available,
red occupied — and those pins flip live over Socket.IO (`../features/05-space-detail-flow.md:40`).

> **This is why the brand primary is indigo and not green, teal, or red.** A green brand colour
> would read as "available" every time a pin changed state. Any new colour proposed for this
> palette must first be checked against the map: if it could be mistaken for a state, it's out.

**Off-brand:** no green or red anywhere except the two semantic roles above. No gradients on
surfaces. No second accent — amber is the only warm colour, and adding a second one is how the
"calm" reading dies.

### Contrast floor

This app is read through a windscreen in direct sun and at night in a dark car. **Every
text/background pair must clear WCAG AA (4.5:1), and primary actions must clear AA against both
light and dark surfaces.** Dark mode is not a preference here — `../features/16-settings-flow.md`
ships Light/Dark/System, and night is a primary use case, not an edge case.

## Type roles

| Role | Family | Weights | Use |
|---|---|---|---|
| Display | `Inter` | 600, 700 | Screen titles, amounts, empty-state headlines |
| UI / body | `Inter` | 400, 500, 600 | Everything else |
| Mono | `JetBrains Mono` | 400, 500 | Vehicle registration numbers, OTP codes, booking IDs, invoice numbers |

One family for display and UI — a second display face would add personality this brand
deliberately doesn't want. Inter is chosen for a tall x-height and high legibility at small sizes
in glare, plus a correct `₹` glyph.

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
    "primary":   "#2F3E8C",
    "primaryDark": "#1E2A63",
    "accent":    "#E8A317",
    "ink":       "#14161C",
    "surface":   "#FFFFFF",
    "success":   "#1F9D55",
    "danger":    "#C6362F"
  },
  "font": {
    "display": "Inter",
    "sans":    "Inter",
    "mono":    "JetBrains Mono"
  },
  "radius": "12px"
}
```

> **Radius 12px** — deliberately mid. 4px reads severe and clinical; 24px reads playful and
> consumer. 12px is the calm middle, and it's the one value most likely to be nudged by taste, so
> it's stated here rather than negotiated per component.

## Related docs

- Kickoff: [`../../CORE_DOCUMENT.md`](../../CORE_DOCUMENT.md)
- Design system (consumes this): [`../design/design-system.md`](../design/design-system.md)
- Per-surface specs: [`../design/_template.md`](../design/_template.md)
