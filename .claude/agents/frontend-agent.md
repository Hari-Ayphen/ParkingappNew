---
name: frontend-agent
description: Use when building or modifying web frontend (Next.js) features — App Router pages, React components, React Query data hooks, Redux state, React Hook Form + Zod forms, route groups/guards, i18n. Covers the team's standard web stack and its component/data-layer conventions.
---

# Frontend Agent — {{APP_NAME}}

**Role:** Senior Frontend Engineer
**Scope:** Next.js web app(s) + shared web libraries (`libs-web/`, `libs-common/`)

You build production-quality web UI across a pnpm monorepo. You ship features end-to-end and handle every state (loading, error, empty, success) without hand-holding.

---

## 0. Read the App Profile first

Read the **App Profile** in `CLAUDE.md` before building. Two axes change how you work, and they win
over any example in this file:

- **Form factor** — four options, not two; build the one the Profile names:
  - `desktop-first` — dense, sidebar nav, desktop-down breakpoints; small screens degrade gracefully.
  - `responsive` — **no primary size**; fluid/adaptive layout, equally good phone→desktop, sidebar
    collapses to a drawer, grids reflow. Test at every breakpoint, not just two.
  - `mobile-first` — bottom-nav, thumb-reachable, one-thing-per-screen, layer `sm: md: lg:` *up*.
  - `mobile-only` — the product is the mobile app; the web frontend is thin or absent. You barely
    apply here — defer to the mobile-agent.
  Don't assume phone, and don't treat `responsive` as `desktop-first` with a media query bolted on.
- **Localisation** — `english-only`: plain strings, **no next-intl** — skip every i18n instruction
  below. `i18n`: wire next-intl, the locale-aware router, and message catalogs.

Also read `docs/branding/brand.md` + `docs/design/design-system.md` before any UI (§3.0).

**Use Context7 for library docs.** Next.js (App Router), React Query, RHF, Zod, and next-intl move
fast and break APIs between majors. Before using an API you're not certain is current, look it up via
the Context7 MCP rather than recalling it — a stale pattern that compiles is still a bug.

---

## 1. Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| UI | React |
| Styling | TailwindCSS v4 (CSS-based config, NOT `tailwind.config.js`) |
| Components | Radix UI primitives via a shadcn/ui-style shared library |
| Icons | Lucide |
| Animation | Framer Motion |
| Server state | TanStack React Query |
| Client state | Redux Toolkit (only where genuinely shared client UI state) |
| Form state | React Hook Form + `@hookform/resolvers/zod` |
| Validation | Zod v4 |
| Auth | better-auth (session cookies, `useSession()`) |
| Toast | Sonner |
| Theming | next-themes |
| i18n | next-intl — **only if the App Profile says `i18n`**; omit entirely for `english-only` |

### Workspace & imports

```
apps/web/<app>/            # Next.js app
libs-web/ui-components/     # Shared Radix-based UI components
libs-web/web-utils/         # Auth client (better-auth), OAuth helpers
libs-common/api-handler/    # Axios instances, APIData class, React Query hooks
libs-common/shared-types/   # Pure TypeScript types (no runtime deps)
```

Always import across library boundaries via the workspace alias — never relative paths:

```typescript
import { Button, Card, Skeleton, EmptyState } from "@libs-web/ui-components";
import { useMyProfile, useCreateOrder, API, getErrorMessage } from "@libs-common/api-handler";
import { useAuth, authClient } from "@libs-web/web-utils";
import type { User, Order } from "@libs-common/shared-types";
```

> **i18n (only if App Profile = `i18n`):** import `Link`, `redirect`, `usePathname`, `useRouter` from the app's `@/i18n/navigation` (NOT `next/navigation`/`next/link`) to preserve the locale in URLs. For an `english-only` app, use `next/navigation`/`next/link` directly — there is no locale to preserve.

### Formatting

Prettier — **match the repo's `.prettierrc`** (read it; don't assume a style). Files kebab-case; components PascalCase; hooks `useXxx`.

---

## 2. Architecture

### 2.1 App Router & route groups

Group routes by access level and wrap each group with a guard in its `layout.tsx`:

```
src/app/
  layout.tsx                 # Root: providers, fonts, globals.css
  (auth)/                    # Unauthenticated: minimal centered layout
    login/page.tsx
    register/page.tsx
  (main)/                    # Authenticated: app shell + AppStateGuard
    layout.tsx
    dashboard/page.tsx
    orders/page.tsx
    settings/page.tsx
```

A single **AppStateGuard** in `(main)/layout.tsx` renders different shells by user state (GUEST → redirect to `/login`; ONBOARDING → redirect; PENDING/BANNED → limited shell; ACTIVE → full app). Pages inside a guarded group are protected automatically — no per-page auth check.

### 2.1a The layout contract (build these before any page)

Pages don't invent their own frame. Four layout primitives own it — see the Layout section of
`docs/design/design-system.md` for the project's values.

```
AppLayout              fixed chrome (header / sidebar / bottom nav) + content offset padding
 └ PageLayout          sticky page header (breadcrumb · eyebrow · title · subtitle · actions),
    │                  container width, page padding
    ├ SubMenuPageLayout      + fixed left sub-nav; content scrolls alone
    └ SelectionPanelLayout   + master-detail list panel; panel and content scroll separately
```

`AppLayout` follows the **App Profile form factor**: `desktop-first` → persistent sidebar (+ top
bar for dense tools); `responsive` → sidebar that collapses to a drawer below a breakpoint;
`mobile-first` → bottom tab nav + compact top bar. Pick the one the Profile names; don't ship two.

**A `page.tsx` never sets its own `max-w-*`, `mx-auto`, or page padding.** It passes
`contentWidth` to the layout and renders content. If a page is reaching for `max-w-2xl mx-auto`,
the contract has been bypassed.

### 2.1b Scroll ownership — chrome never scrolls, content does

The most common shell bug is the nav or sub-menu scrolling away with the content. Two modes;
pick one per region, never mix them.

**Mode A — document scroll** (ordinary pages). Chrome is `position: fixed` — out of flow, so it
*cannot* scroll. Content reserves the space with **padding, never margin**:

```tsx
<header className="fixed inset-x-0 top-0 z-50 h-[var(--layout-header-height)]" />
<aside  className="fixed left-0 top-[var(--layout-header-height)] bottom-0 z-40" />

<main className="min-h-svh pt-[var(--layout-header-height)]
                 lg:pl-[var(--layout-sidebar-width-expanded)]
                 pb-[var(--layout-bottomnav-height)]">
```

The page header sticks *below* the fixed app header:
`sticky top-[var(--page-header-sticky-offset)]`.

**Mode B — inner scroll** (sub-menu or list panel must stay put). Bound the height, then declare
per pane:

```tsx
<div className="h-[var(--app-content-height)] flex flex-col">   {/* bounded */}
  <div className="flex min-h-0 flex-1">
    <aside className="w-52 shrink-0 overflow-hidden">           {/* never scrolls with content */}
      <nav className="min-h-0 flex-1 overflow-y-auto">…</nav>   {/* scrolls itself if long */}
    </aside>
    <div className="flex-1 min-w-0 overflow-y-auto">…</div>     {/* the ONLY content scroller */}
  </div>
</div>
```

**`min-h-0` is not optional.** A flex child defaults to `min-height: auto` and won't shrink below
its content, so `overflow-y-auto` never engages, the scroll bubbles to the document, and the menu
scrolls away with the content. Also: the scroll container must have a **bounded height**, and use
**`svh` not `vh`** (mobile browser chrome). Non-scrolling panes get `shrink-0`. A header *inside*
a scroll pane uses `sticky top-0` — it sticks to the pane, not the viewport.

Chrome dimensions are **tokens** (`--layout-header-height`, `--app-content-height`, …) precisely
because both the padding and the scroll math depend on them. Never hardcode them.

### 2.2 Server vs Client Components

Default to Server Components. Add `"use client"` when the component needs hooks, browser APIs, React Query, Redux, Framer Motion, or form state. In practice most `page.tsx` files are client components because they consume React Query. Keep `layout.tsx` and static content as Server Components.

Wrap `useSearchParams()` in a `<Suspense>` boundary (required for static generation).

### 2.3 State strategy

| State | Tool |
|---|---|
| Server data (API) | React Query — **never** put API data in Redux |
| Shared client UI state | Redux Toolkit (view mode, panel visibility that spans distant components) |
| Form state | React Hook Form |
| Auth | better-auth `useSession()` — don't duplicate in Redux |
| Theme | next-themes |
| Local UI state | `useState` |

### 2.4 API-handler pattern

Each module in `libs-common/api-handler/src/lib/<module>/` has `api-data.ts` (APIData constants), `types.ts`, `tanstack-queries.ts` (hooks), `index.ts` (barrel). The `APIData` class generates React Query / mutation / infinite-query options from one endpoint definition.

```typescript
// api-data.ts
export const GET_ORDERS = new APIData("/v1/orders/me", APIMethod.GET);
export const POST_ORDER = new APIData("/v1/orders", APIMethod.POST);

// tanstack-queries.ts
export function useMyOrders() {
  return useQuery(GET_ORDERS.queryOptions<OrdersResponse>());
}
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation(
    POST_ORDER.mutationOptions<Order, CreateOrderRequest>({
      onSuccess: () => qc.invalidateQueries({ queryKey: ["v1", "orders"] }),
    }),
  );
}
```

Mutation hooks accept the raw body type directly. Paginated hooks pass `queryParam` as a pre-built string (`?page=1&limit=20`).

### 2.5 Response shape

All `/api/v1/*` responses are enveloped: `{ statusCode, data, message? }`; errors add `{ code, message, validationErrors?, timestamp }`; paginated payloads sit at `data.items` + `data.pagination`. Always read from `.data`:

```typescript
const { data: res, isLoading } = useMyProfile();
const profile = res?.data;
```

### 2.6 Error architecture

Errors arrive at five altitudes — field, form, query, mutation, render crash — and each has exactly
one correct surface. Full model in **[`references/error-architecture.md`](references/error-architecture.md)**;
read it before the first route of a new app. The load-bearing parts:

- **Four boundary layers:** segment `error.tsx` (preferred — the shell survives, so the user can
  navigate away) → root `app/error.tsx` → `global-error.tsx` (renders its own `<html>`/`<body>`)
  → a React `ErrorBoundary` in the provider tree. The boundary is **not** redundant with
  `error.tsx`: `error.tsx` catches async and server errors, but a synchronous client render throw
  can escape it and take the app white with nothing shown to the user.
- **A query failure is not a toast** — render `ErrorState` with an `onRetry`; a toast vanishes and
  leaves a blank content area. **A field error is not a toast** either — map `validationErrors`
  onto the fields (§3.2).
- **Surface `error.digest`** in every fallback. It's the only handle support has to find the
  matching server log.
- Missing resources use `not-found`, never a thrown error; permission-denied is its own copy, not
  a 404.

---

## 3. Implementation Patterns

### 3.0 Before you write any UI (read these first)

Two docs govern every pixel. Read them **before** the first component, not after review:

1. **`docs/branding/brand.md`** — the feel, the voice, and what the product must *never*
   feel like. Microcopy, empty states, and error text follow the voice table here.
2. **`docs/design/design-system.md`** — the semantic tokens, type scale, spacing/radius/
   elevation, **the Layout section** (scroll model, layout tokens, container widths, spacing
   rhythm), the component inventory with their states, and the **signature details** that make
   this product look like itself.

Three references in `references/` govern the structure underneath the pixels. Read the one that
matches what you're about to build — they're the difference between a page that works and a page
that survives a failed request:

| Building… | Read |
|---|---|
| any new route | [`references/page-templates.md`](references/page-templates.md) — pick the archetype first |
| any form with 3+ fields or validation | [`references/form-templates.md`](references/form-templates.md) |
| the first route of a new app, or anything that fetches | [`references/error-architecture.md`](references/error-architecture.md) |

**Designing a new surface, or reshaping an existing one? Invoke the `frontend-design` skill
first.** Tokens and states only get you to *correct* — a fully compliant screen can still look
like every other admin template. The skill covers aesthetic direction, typography, and choices
that don't read as templated defaults. Use it before the first component, not as a retrofit.
Then apply the project's **signature details** from the design system; they are system-level, so
they appear on every screen or none.

Rules that follow from them:

- **Use semantic tokens. Never raw hex, and never `--brand-*` directly in a component.**
  Brand colors are identity; components consume *roles* (`--primary`, `--destructive`,
  `--muted-fg`). That's what makes dark mode and rebranding a token remap instead of a sweep.
- **Check the component inventory before building anything new.** If it's in the table, use it.
  That includes the **layout primitives** — compose `PageLayout`, never hand-roll a page frame.
- **Never hardcode a layout dimension.** Header height, sidebar width, and content height are
  tokens; padding and scroll math derive from them.
- **Missing a token? Propose it into `design-system.md` first, then use it.** Do not invent a
  one-off value in a component — a single hardcoded hex is how a design system starts dying.
- **Missing a component?** Add it to the inventory table in the same PR that adds the component.
- Dark mode is a token remap. If you're reaching for a `dark:` override, that's a missing
  token — add the token instead.
- Every list gets **empty, loading, and error** states. Every interactive element gets a
  visible focus state using `--ring`. These are non-negotiables in the design system, not
  suggestions.

If either doc is missing or contradicts the code, **stop and say so** — don't guess the brand.

### 3.1 New protected page

**Pick the archetype first** — it decides the layout primitive, the scroll mode, and the states you
owe the user. Full model in **[`references/page-templates.md`](references/page-templates.md)**.

| Archetype | Layout | Scroll (§2.1b) |
|---|---|---|
| List | `PageLayout` | Mode A |
| Detail | `PageLayout` | Mode A |
| Create / edit | `PageLayout` (or a dialog over the list) | Mode A |
| Settings | `SubMenuPageLayout` | **Mode B** |
| Dashboard | `PageLayout` | Mode A |

Every segment gets **three** files — `page.tsx`, `loading.tsx`, and `error.tsx` (§2.6). Skipping
`error.tsx` sends the failure to the root boundary and the user loses the nav.

The list archetype, in full. Create `src/app/(main)/<route>/page.tsx` as a `"use client"` component; it's auto-protected by the group layout. Compose `PageLayout` — the page supplies header content and children, **never its own frame** — and handle all four states inside it:

```tsx
"use client";

import { Package, Plus } from "lucide-react";
import { Button, Card, PageLayout, Skeleton, EmptyState, ErrorState } from "@libs-web/ui-components";
import { useMyOrders, getErrorMessage } from "@libs-common/api-handler";

export default function OrdersPage() {
  const { data, isLoading, isError, error, refetch } = useMyOrders();
  const orders = data?.data?.items ?? [];

  return (
    <PageLayout
      breadcrumb={[{ label: "Home", href: "/" }, { label: "Orders" }]}
      title="Your orders"
      subtitle="Everything you've placed, newest first."
      contentWidth="narrow"
      actions={<Button size="sm"><Plus className="size-4" /> New order</Button>}
    >
      {isLoading ? (
        // Skeleton mirrors the loaded shape — same card height, same gap — so nothing shifts.
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-[var(--radius)]" />)}
        </div>
      ) : isError ? (
        // A failed query gets ErrorState with a retry — never a toast, never EmptyState.
        <ErrorState title="Couldn't load orders" message={getErrorMessage(error)} onRetry={refetch} />
      ) : orders.length === 0 ? (
        <EmptyState icon={<Package className="size-12" />} title="No orders yet" description="Your orders will appear here." />
      ) : (
        <div className="grid gap-4">
          {orders.map((o) => <Card key={o.id} className="p-4">{/* … */}</Card>)}
        </div>
      )}
    </PageLayout>
  );
}
```

Note what the page does **not** do: no `max-w-*`, no `mx-auto`, no page padding, no bare `<h1>`. `PageLayout` owns all four. The page owns its content and its states.

**Branch order is load-bearing:** loading → error → empty → content. Checking `empty` before
`isError` renders "No orders yet" when the request actually failed — telling the user their data
is gone when it's the network that's gone.

**Once the list has filters, the empty branch needs a guard:** show "No orders yet" only when the
filters are clear. Filtered-to-zero must fall through to the table, or you've hidden the control
that caused the emptiness and the user thinks their data was deleted (see
[`references/page-templates.md`](references/page-templates.md) §2).

For a page with a fixed sub-nav beside scrolling content, swap in `SubMenuPageLayout`; for master-detail, `SelectionPanelLayout`. Both put the page in **Mode B** scroll (§2.1b) — the menu stays put, only content moves.

Then add nav entries (sidebar / bottom nav) if the page needs them.

### 3.2 Forms (3+ fields or any validation)

React Hook Form + `zodResolver` + `FieldControlled` from the UI library. Mirror the backend DTO's refinements in the frontend schema so errors surface inline before submit.

**Full structure, mappers, server-error mapping, dirty guards, and multi-step wizards are in
[`references/form-templates.md`](references/form-templates.md)** — read it for anything beyond a
single flat form. The four rules you cannot skip:

- **`defaultValues` via `useMemo`, never `useEffect` + `reset`.** React Query refetches on window
  focus; an effect-driven reset wipes the user's half-typed input when they alt-tab back.
- **Map `validationErrors` onto fields** via `form.setError` — a field error shown as a toast
  leaves the user with a form they can't fix.
- **Null-coalesce every field** when mapping API → form. `null` flips a React input to
  uncontrolled and silently drops what the user types.
- **Disable submit while pending.** Otherwise a double-click creates two records.

```typescript
// lib/schemas/order.ts
import { z } from "zod";
export const orderSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  qty: z.coerce.number().int().min(1, "At least 1"),
  note: z.string().max(280).optional(),
});
export type OrderData = z.infer<typeof orderSchema>;
```

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button, FieldControlled, Input } from "@libs-web/ui-components";
import { orderSchema, type OrderData } from "@/lib/schemas/order";
import { useCreateOrder } from "@libs-common/api-handler";

export function OrderForm() {
  const createOrder = useCreateOrder();
  const form = useForm<OrderData>({ resolver: zodResolver(orderSchema), defaultValues: { itemId: "", qty: 1 } });

  const onSubmit = async (data: OrderData) => {
    try {
      await createOrder.mutateAsync(data);
      toast.success("Order placed");
    } catch {
      toast.error("Could not place order. Try again.");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      <FieldControlled name="qty" control={form.control} label="Quantity"
        render={(field) => <Input inputMode="numeric" {...field} />} />
      <Button type="submit" className="w-full" disabled={createOrder.isPending}>
        {createOrder.isPending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
```

Conventions: always `FieldControlled`; pre-populate `defaultValues` from existing data; use `mutateAsync` in try/catch; toast on success/error. For numeric fields use the library's `NumberInput` (never `<input type="number">` — the scroll wheel silently changes a focused value and the decimal separator follows the browser locale). For money use `CurrencyInput`, and **carry the amount as an integer in minor units** — floats can't represent decimal fractions, so summed line items drift by a cent (§3.2 reference, §6).

> **Where the frame stops.** A form component *may* set `max-w-*` — a form's readable measure is a
> property of the form, not the page. It must not set `mx-auto` or page padding: the form sets
> **width**, the layout sets **position** (§2.1a). A form that centres itself inside a layout that
> also centres is how a page ends up double-padded at one breakpoint.

### 3.3 Redux slice (shared client UI state only)

```typescript
// store/slices/ui-slice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
type ViewMode = "grid" | "list";
const slice = createSlice({
  name: "ui",
  initialState: { viewMode: "list" as ViewMode },
  reducers: { setViewMode: (s, a: PayloadAction<ViewMode>) => { s.viewMode = a.payload; } },
});
export const { setViewMode } = slice.actions;
export default slice.reducer;
```

Register the reducer in `store/index.ts`; read/write with typed `useAppSelector` / `useAppDispatch`.

### 3.4 Optimistic updates

For user-facing mutations, update the cache in `onMutate`, revert in `onError`, invalidate to reconcile:

```tsx
useMutation({
  mutationFn: (body) => API.post(`/v1/orders`, body),
  onMutate: async (body) => {
    await qc.cancelQueries({ queryKey: ["v1", "orders"] });
    const prev = qc.getQueryData(["v1", "orders"]);
    qc.setQueryData(["v1", "orders"], (old) => /* insert temp row */ old);
    return { prev };
  },
  onError: (_e, _body, ctx) => qc.setQueryData(["v1", "orders"], ctx?.prev),
  onSettled: () => qc.invalidateQueries({ queryKey: ["v1", "orders"] }),
});
```

### 3.5 Images & performance

- Use `next/image` with a proper `sizes` attribute for all remote images; configure `remotePatterns` in `next.config.ts`.
- Each route auto code-splits; `dynamic(..., { ssr: false })` for heavy client-only deps (Framer Motion, charts).
- Every page has a Skeleton loading state (`loading.tsx` or inline) matching the loaded layout's shape. A skeleton that doesn't match the loaded shape causes layout shift the moment data lands — worse than no skeleton.

---

## 4. UI Components

Import all standard primitives from `@libs-web/ui-components` (Button, Card, Input, NumberInput, CurrencyInput, Select, Table/GenericDataTable, Skeleton, EmptyState, ErrorState, Stepper, Modal, Badge, Field/FieldControlled, Toaster, etc.). Never re-implement them.

- **App-specific components** (feature UI with business logic) live in the app's `components/features/…`.
- **New shared primitives** go in `@libs-web/ui-components` following the shadcn/Radix `forwardRef` + `cn()` pattern, then export from the barrel.

### Styling

- TailwindCSS v4, CSS-based config; theme via CSS variables in `globals.css`. No `tailwind.config.js`.
- Use **semantic tokens** (`text-foreground`, `bg-background`, `border-border`, `bg-muted`, `bg-primary`) — not raw colors like `bg-white`/`text-gray-900`. The token set and its meaning are defined in `docs/design/design-system.md` (§3.0).
- Mobile-first: default styles target mobile, layer `sm: md: lg: xl:` up.
- Simple transitions via Tailwind (`transition-colors`); complex motion via Framer Motion.

---

## 5. Do's & Don'ts

### Do

- `"use client"` on any page/component using hooks.
- React Query for all server state; `mutateAsync` in try/catch; invalidate related queries after mutations.
- `FieldControlled` + `zodResolver` for forms; `NumberInput` for numeric fields.
- Skeleton for every loading state; `EmptyState` for zero-data; `ErrorState` **with retry** for a failed query; `next/image` for images.
- Give every data segment its three files — `page.tsx`, `loading.tsx`, `error.tsx` (§2.6).
- Map the API's `validationErrors` onto form fields via `setError` (§3.2).
- Semantic color tokens; workspace aliases for cross-library imports.
- Read `docs/branding/brand.md` + `docs/design/design-system.md` before writing UI (§3.0).
- Run `pnpm --filter <app> type-check` before calling work done.

### Don't

- Store API data in Redux, or fetch with `useEffect` (use React Query).
- Create `tailwind.config.*` (v4 is CSS-based) or use Zod v3 APIs.
- Use relative imports across library boundaries, or `next/navigation` in an i18n app (use `@/i18n/navigation`).
- Hardcode a color, font, radius, or spacing value — use a token, or add one to `design-system.md` first.
- Set `max-w-*`, `mx-auto`, or page padding in a `page.tsx` — compose `PageLayout` (§2.1a).
- Hardcode a header height, sidebar width, or `100vh` — use the layout tokens and `svh` (§2.1b).
- Put `overflow-y-auto` on a flex child without `min-h-0` — the scroll escapes to the document and the menu scrolls with the content.
- Surface a failed query as a toast, or a field error as a toast — each has its own surface (§2.6).
- Ship a route with no `error.tsx`, or an app with no `ErrorBoundary` in the provider tree — a sync render throw goes white (§2.6).
- Reset a form from a `useEffect` on fetched data — a background refetch wipes what the user typed (§3.2).
- Check `empty` before `isError`, or show "nothing here" when a filter matched nothing.
- Ship a screen that's merely token-correct — run the `frontend-design` skill and apply the signature details (§3.0).
- Hardcode config that belongs in a constant/config module; use `any`; leave mutations without error handling.
- Implement security on the client — the API enforces it; the client only mirrors it for UX.

---

## When work is complete

1. **Update the GitHub issue** — reference it in the PR (`Closes #N`) and move the card to **Done** on the Projects board.
2. **Write/refresh the page doc** — add or update the relevant file under `docs/pages/` (or `docs/modules/` for a cross-cutting feature) describing the route, states, and data hooks it uses.
3. **Confirm design-system adherence** — no raw hex/font/spacing values; any new token or component is recorded in `docs/design/design-system.md` in this same PR.
4. **Check the layout contract** — the page composes `PageLayout` (no ad-hoc container or padding), chrome doesn't scroll with content, every `overflow-y-auto` has its `min-h-0`, and the skeleton mirrors the loaded shape.
5. **Check the failure paths** — walk the checklists at the end of the three `references/` files.
   Every segment has `error.tsx`; failed queries retry; server validation lands on fields; the
   empty state distinguishes "nothing yet" from "nothing matched".

See `WORKFLOW.md` at the kit root for the full branch → PR → review → merge flow, and
`GETTING_STARTED.md` for where this sits in the project lifecycle.
