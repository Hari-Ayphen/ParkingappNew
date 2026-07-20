# Error architecture — web

> Reference for the **frontend-agent** (§2.6). Read before building the first route of a new app,
> and before any page that fetches or mutates. The layers below are cheap to add on day one and
> expensive to retrofit — a missing boundary isn't a missing feature, it's a white screen.

Errors arrive at five different altitudes and each one has exactly one correct surface. Sending
them all to a toast is the usual failure: a field-level validation error rendered as a toast
leaves the user staring at a form with no idea which input is wrong.

---

## 1. The taxonomy — pick the surface by the altitude

| Error | Surface | Mechanism |
|---|---|---|
| **Field validation** (server rejected one input) | inline, under that field | `form.setError(field, …)` |
| **Form-level** (rejected the whole submission) | alert inside the form, above the actions | form-level error state |
| **Query failure** (a fetch didn't return) | inline `ErrorState` in the content area, **with retry** | `refetch()` |
| **Mutation failure** (an action didn't take) | toast | `getErrorMessage(err)` |
| **Render crash** (a component threw) | boundary fallback | `error.tsx` / `ErrorBoundary` |

Two rules follow, and they're the ones most often broken:

- **A query failure is not a toast.** The content area is empty and the user needs a way forward;
  a toast disappears and leaves them with a blank page. Render `ErrorState` with an `onRetry`.
- **A field error is not a toast.** If the server says which field failed, put the message on the
  field. Only fall back to a toast when the error names no field.

---

## 2. The four boundary layers

Next.js catches errors per route segment, but only some of them. Four layers, outermost last:

| Layer | File | Catches | Layout survives? |
|---|---|---|---|
| **1** | `app/(main)/<route>/error.tsx` — **preferred** | errors thrown in that segment | Yes — nav intact, user can leave |
| **2** | `app/error.tsx` | anything a segment boundary missed | Yes |
| **3** | `app/global-error.tsx` | a crash in the **root layout** itself | No — replaces the document |
| **4** | `<ErrorBoundary>` in `providers.tsx` | **synchronous client render throws** | Yes |

```
component throws
      │
      ├─ inside an ErrorBoundary?  ─────────────→  boundary fallback      (layer 4)
      │
      ├─ segment has error.tsx?    ─────────────→  segment fallback       (layer 1)
      │
      ├─ parent segment error.tsx? ─────────────→  parent fallback        (layer 1, bubbled)
      │
      ├─ app/error.tsx?            ─────────────→  root fallback          (layer 2)
      │
      └─ root layout itself threw? ─────────────→  global-error.tsx       (layer 3)
```

> **Why layer 4 exists — the non-obvious one.** `error.tsx` reliably catches errors from async
> work and server rendering. A **synchronous throw during a client render** can escape it and take
> the whole app white with nothing logged to the user. The React boundary in the provider tree is
> what stops that. Skipping it is the single most common reason a production app dies silently.

**Prefer layer 1 to layer 2.** A segment boundary keeps the shell mounted, so the user can
navigate away from the broken page. A root boundary means the only exit is a reload.

### Layer 1 — segment `error.tsx`

Every route segment with data or interaction gets one. It must be a client component and takes
the `{ error, reset }` pair.

```tsx
// app/(main)/orders/error.tsx
"use client";

import { useEffect } from "react";
import { ErrorState } from "@libs-web/ui-components";

export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to the error tracker here. The user already sees the fallback;
    // this is for the people who have to fix it.
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Couldn't load orders"
      message={error.message}
      digest={error.digest}
      onRetry={reset}
    />
  );
}
```

> **Surface `error.digest` in production.** The stack is stripped from client-visible errors, so
> the digest is the *only* handle support has to find the matching server log. An error report
> that says "it broke" costs an hour; one that says "digest a1b2c3" costs a grep.

### Layer 3 — `global-error.tsx`

Only fires when the root layout itself throws, which means the layout's `<html>`/`<body>` never
rendered. **This file must render its own `<html>` and `<body>`** — nothing else will.

```tsx
// app/global-error.tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main>
          <h1>Something went wrong</h1>
          {error.digest ? <p>Error ID: {error.digest}</p> : null}
          <button onClick={reset}>Try again</button>
        </main>
      </body>
    </html>
  );
}
```

> Style this with inline styles or a minimal inline `<style>`, not the design system. If the root
> layout failed, assume the stylesheet and providers are unavailable too — a fallback that itself
> depends on a token file is a fallback that renders unstyled at the worst moment.

### Layer 4 — `ErrorBoundary` in the provider tree

Innermost, so it catches render throws before they reach a route boundary:

```tsx
// app/providers.tsx
<Provider store={store}>                 {/* Redux */}
  <QueryClientProvider client={qc}>
    <ThemeProvider>
      <ErrorBoundary onError={reportError}>
        {children}
      </ErrorBoundary>
    </ThemeProvider>
  </QueryClientProvider>
</Provider>
```

`ErrorBoundary` props: `fallback` (node or render fn), `onError` (report), `onReset` (clear state).

---

## 3. `not-found` and permission-denied

Two states that look like errors, aren't, and must not be modelled as one.

**`not-found.tsx`** — the route matched but the resource doesn't exist. Trigger it from a Server
Component with `notFound()`. Do **not** throw a generic error for a missing record; a 404 that
renders as "something went wrong" tells the user to retry something that will never work.

```tsx
// app/(main)/orders/[id]/not-found.tsx
import { EmptyState } from "@libs-web/ui-components";

export default function OrderNotFound() {
  return (
    <EmptyState
      title="Order not found"
      description="It may have been deleted, or the link may be wrong."
      action={{ label: "Back to orders", href: "/orders" }}
    />
  );
}
```

> **A client-side detail page needs a *separate* not-found branch.** When the fetch succeeds but
> returns nothing, `not-found.tsx` never fires — that file only handles routing-time misses. See
> the detail archetype in [`page-templates.md`](page-templates.md) §3.

**Permission denied (403)** is its own surface, not a 404 and not a crash. The user is
authenticated, the resource exists, and they may legitimately need to request access — so the copy
must say so rather than implying the thing is missing.

```tsx
<EmptyState
  title="You don't have access to this"
  description="Ask an administrator to grant you access."
/>
```

> The API is the enforcement wall; this is UX only. Never gate on the client and assume you're
> secure — hiding a button is not authorisation.

---

## 4. The normalized error object

Every `/api/v1/*` error shares the envelope in frontend-agent §2.5 — `{ code, message,
validationErrors?, timestamp }`. Normalize it **once**, in the api-handler layer, into an object
carrying booleans instead of forcing every call site to re-parse status codes:

```typescript
export interface SerializedApiError {
  message: string;                          // safe to show a user
  code?: string;
  validationErrors?: Record<string, string>; // field name → message
  status?: number;

  isValidationError: boolean;               // 422 / 400 with field detail
  isAuthError: boolean;                     // 401 / 403
  isNetworkError: boolean;                  // never reached the server
  isTimeout: boolean;
  isRateLimited: boolean;                   // 429
  isServerError: boolean;                   // 5xx
}
```

> **Why flags and not status codes at the call site.** `err.status === 422 || err.status === 400`
> repeated across forty components is forty places to update when the API adds a case. One
> normalizer, one edit. It also keeps transport details out of components entirely.

`getErrorMessage(err)` (exported from `@libs-common/api-handler`) returns the user-safe string for
any thrown value — use it for every toast rather than `err.message`, which can be a raw Axios
string like `Request failed with status code 500`.

**Prefer the server's message when it has one.** The API knows why it refused; a hardcoded
`"Something went wrong"` throws that away. Use a generic string only for `isNetworkError` and
`isServerError`, where the server message is either absent or an internal detail.

---

## 5. Error copy

Error text is **voice**, so it comes from `docs/branding/brand.md`, not from the developer's
instinct in the moment. Three rules that hold regardless of voice:

- **Say what happened and what to do next.** "Couldn't load orders — check your connection and
  try again" beats "Error: request failed".
- **Never show a stack, a raw exception, or an internal identifier** (table names, endpoint paths).
  The digest is the exception — it's opaque by design.
- **Don't blame the user** for something the system did.

---

## Checklist

- [ ] Every route segment that fetches has `error.tsx`.
- [ ] `app/error.tsx` and `app/global-error.tsx` exist; `global-error.tsx` renders `<html>`/`<body>`.
- [ ] An `ErrorBoundary` wraps `{children}` in the provider tree.
- [ ] `error.digest` is surfaced in every fallback.
- [ ] Query failures render `ErrorState` **with a retry**, not a toast.
- [ ] Mutation failures toast via `getErrorMessage`.
- [ ] `validationErrors` are mapped onto fields ([`form-templates.md`](form-templates.md) §5).
- [ ] Missing resources use `not-found`, not a thrown error; 403 has its own copy.
- [ ] Error strings follow the voice table in `docs/branding/brand.md`.

---

**Related:** [`page-templates.md`](page-templates.md) (state branches per archetype) ·
[`form-templates.md`](form-templates.md) (field-level errors) · frontend-agent §2.5 (response
shape) · `docs/design/design-system.md` (`ErrorState` inventory row and its states).
