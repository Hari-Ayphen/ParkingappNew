# Page templates — web

> Reference for the **frontend-agent** (§3.1). Read before creating any new route. Pick the
> archetype first — it decides the layout primitive, the scroll mode, and which states you owe the
> user. Improvising the frame per page is how two screens in the same app end up with different
> padding, different empty states, and different scroll behaviour.

---

## 1. The archetypes

| Archetype | Layout primitive | Scroll (§2.1b) | Typical content |
|---|---|---|---|
| **List** | `PageLayout` | Mode A | table or card grid, filters, pagination |
| **Detail** | `PageLayout` | Mode A | one record: header card + tabs/sections |
| **Create / edit** | `PageLayout` | Mode A | one form; or a dialog over the list |
| **Settings** | `SubMenuPageLayout` | **Mode B** | fixed section nav + scrolling panel |
| **Dashboard** | `PageLayout` | Mode A | stat tiles, charts, recent-activity lists |

Master-detail (a list panel beside a detail pane) uses `SelectionPanelLayout` and is **Mode B** —
the panel and the content scroll independently.

**Every segment gets three files**, not one:

```
app/(main)/orders/
  page.tsx        the archetype
  loading.tsx     route-level skeleton
  error.tsx       segment boundary  → error-architecture.md §2
```

Omitting `error.tsx` means the error bubbles to the root boundary and the user loses the nav.

---

## 2. The state branches — order matters

Every data-bearing page resolves in this order. It is not stylistic: each branch assumes the
previous one is false.

```
isLoading   →  skeleton
isError     →  ErrorState with retry
empty       →  EmptyState        ← only when unfiltered; see below
otherwise   →  content
```

Checking `empty` before `isError` renders "No orders yet" when the request actually failed —
telling the user their data is gone when it's the network that's gone.

### The unfiltered-only empty guard

```tsx
const isUnfiltered = !searchQuery && statusFilter === "all";

if (orders.length === 0 && isUnfiltered) {
  return <EmptyState title="No orders yet" description="Your orders will appear here." />;
}
// Filtered-to-zero falls through — the table renders with its own "no matches" row,
// so the filters stay visible and the user can clear them.
```

> **Filtered-to-zero is not empty.** If a filter matches nothing and you swap the whole table for
> "No orders yet", you've hidden the controls that caused it — the user believes their data was
> deleted and has no way to undo the filter. Two different states, two different messages.

---

## 3. List

The reference implementation is frontend-agent §3.1. What it adds beyond the four branches:

- **Filter and pagination state lives in the page**, passed into the query hook — so the
  parameters that produced the data are visible in one place.
- **Paginated hooks take `queryParam` as a pre-built string** (frontend-agent §2.4).
- **A sticky table header is Mode B inside the content area**, not Mode A. The scroll container
  must be bounded and the header `sticky top-0` — it sticks to the pane, not the viewport.
- Row click navigates to detail; action buttons inside the row call `stopPropagation()`, or
  clicking Delete also opens the record.

---

## 4. Detail

```tsx
// app/(main)/orders/[id]/page.tsx  — Server Component
export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;          // params is a Promise in current Next.js
  return <OrderDetailView orderId={id} />;
}
```

The client view handles the branches — with **one extra branch the list doesn't have**:

```
isLoading  →  skeleton
isError    →  ErrorState with retry
!order     →  not-found state        ← fetch succeeded, record doesn't exist
otherwise  →  content
```

> **This not-found branch is not `not-found.tsx`.** The route file only fires for routing-time
> misses (`notFound()` from a Server Component). When a client fetch returns 200 with an empty
> body — a deleted record, a bad id — nothing triggers it, and without this branch the page
> renders `order.name` on `undefined` and crashes into the error boundary. See
> [`error-architecture.md`](error-architecture.md) §3.

Compose the detail body from a header card plus tabs or sections. **It still uses `PageLayout`** —
a detail page is not an exception to the layout contract, and back-navigation belongs in the
layout's breadcrumb, not a hand-rolled button.

---

## 5. Create / edit

Two shapes; pick by size, not by habit:

| Shape | When |
|---|---|
| **Dialog over the list** | ≤ ~8 fields, no nested sections. The user keeps their place in the list. |
| **Full page** (`/new`, `/[id]/edit`) | long forms, multi-step, or anything deep-linkable |

The same form component serves both — mode comes from whether an entity was passed
(`isEditMode = !!entity`), not from the route. Everything else is
[`form-templates.md`](form-templates.md).

A dialog needs a bounded height and its own scroll (`max-h-[90svh] overflow-y-auto`) — `svh`, not
`vh`, or the submit button sits under mobile browser chrome and can't be tapped.

---

## 6. Settings

The one archetype that is **Mode B** by default: a fixed section nav beside a scrolling panel, via
`SubMenuPageLayout`. Every `overflow-y-auto` in that flex row needs `min-h-0` (§2.1b) — without it
the section nav scrolls away with the content, which is the exact bug the layout contract exists
to prevent.

Each section is an independently saveable form. **Don't wrap the whole settings page in one
form** — a single save button for twelve unrelated preferences means one validation error blocks
saving all of them.

---

## 7. Dashboard

Stat tiles, charts, and recent-activity lists — usually several independent queries. Two rules:

- **Each widget owns its own states.** One failing query must not blank the dashboard; that widget
  shows its own `ErrorState` while the rest render.
- **Skeleton per widget, not one page-level spinner** — otherwise the fastest query waits for the
  slowest and the page appears to hang.

Charts are heavy and client-only: `dynamic(..., { ssr: false })` (frontend-agent §3.5). Consult
the `dataviz` skill before choosing chart forms or colors.

---

## 8. `loading.tsx` vs inline skeleton

| Use | When |
|---|---|
| **`loading.tsx`** | the route's shell is known before data — instant paint on navigation |
| **inline skeleton** | only part of the page is loading, or the shape depends on the data |

Both must **mirror the loaded shape** — same card height, same gap, same column count. A skeleton
that doesn't match causes layout shift the moment data lands, which reads as a flicker and is
worse than no skeleton.

Most pages want both: `loading.tsx` for the first paint, inline skeletons for subsequent refetches
where the shell is already mounted.

---

## Checklist

- [ ] Archetype chosen; layout primitive and scroll mode match the table in §1.
- [ ] `page.tsx` + `loading.tsx` + `error.tsx` all present.
- [ ] Branch order is loading → error → empty → content.
- [ ] Empty state only when **unfiltered**; filtered-to-zero keeps the controls visible.
- [ ] Detail pages have the post-fetch not-found branch.
- [ ] Skeletons mirror the loaded shape.
- [ ] No `max-w-*` / `mx-auto` / page padding in `page.tsx` (§2.1a).
- [ ] Mode B regions: bounded height, `svh` not `vh`, `min-h-0` on every scroll child.

---

**Related:** [`error-architecture.md`](error-architecture.md) (boundaries and the taxonomy) ·
[`form-templates.md`](form-templates.md) (the create/edit body) · frontend-agent §2.1a–2.1b
(layout contract, scroll ownership) · `docs/design/design-system.md` (layout primitives, container
widths).
