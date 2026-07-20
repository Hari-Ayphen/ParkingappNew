# Form templates — web

> Reference for the **frontend-agent** (§3.2). Read before building any form with 3+ fields, any
> validation, or any edit mode. A two-field search box doesn't need this; anything that writes to
> the API does.

Forms are where the most state converges — server data, user input, validation, submission, and
server rejection all in one component. The structure below exists so those five concerns don't
end up in one 400-line file.

---

## 1. Structure

```
components/<feature>/
  <feature>-form.schema.ts        Zod schema + the defaults factory
  <feature>-form.tsx              the form component
  hooks/
    use-<feature>-form.ts         RHF wiring, mode, submit, server errors
    use-<feature>-form-data.ts    lookup/dropdown fetches (only if it has any)
  mappers/
    form-to-api.ts                form values → request body
    api-to-form.ts                entity → form values
  fields/                         field components (single-step)
  steps/                          step components (multi-step only)
```

Single-step forms with no lookups collapse to `schema` + `form.tsx` + `hooks/` — don't create
empty folders. The split earns its keep the moment a form has both an edit mode and a dropdown.

---

## 2. Schema

One schema file. It exports the schema, the inferred type, **and a defaults factory** — not a
defaults constant.

```typescript
// order-form.schema.ts
import { z } from "zod";

export const orderFormSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  qty: z.coerce.number().int().min(1, "At least 1"),
  // Optional text: allow "" so an untouched input stays valid.
  note: z.string().max(280).optional().or(z.literal("")),
  priority: z.boolean().default(false),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;

// A factory, not a shared object — see the rule below.
export function getDefaultOrderFormValues(): OrderFormValues {
  return { itemId: "", qty: 1, note: "", priority: false };
}
```

- **A factory, not a module-level constant.** A shared object is one reference handed to every
  mount; RHF mutates it, so a second form opens holding the first one's edits.
- **`z.coerce.number()` for numeric inputs** — an `<input>` yields a string, and an uncoerced
  `z.number()` fails on the user's first keystroke with a type error they can't act on.
- **`.or(z.literal(""))` on optional text** — `.optional()` alone rejects `""`, so an untouched
  optional field blocks submit.
- **Mirror the backend's refinements.** Cross-field rules (`.refine()`) that exist in the API DTO
  belong here too, so the user sees them before a round trip — not as a 422 after submit.

---

## 3. Defaults: `useMemo`, never `useEffect` + `reset`

```typescript
const defaultValues = useMemo(
  () => (entity ? mapApiToFormValues(entity) : getDefaultOrderFormValues()),
  [entity],
);

const form = useForm<OrderFormValues>({
  resolver: zodResolver(orderFormSchema),
  defaultValues,
});
```

> **Never `useEffect(() => form.reset(mapApiToFormValues(entity)), [entity])`.** React Query
> refetches on window focus. The user alt-tabs to check a reference number, comes back, and the
> refetch fires a new `entity` — the effect resets the form and their half-typed input is gone.
> It is intermittent, it never reproduces locally, and it is always this.

The exception: after a **successful submit** on a form that stays mounted, call
`form.reset(values)` explicitly to re-baseline `isDirty`. That's a deliberate reset in response to
a user action, not a reactive one.

---

## 4. Mappers

The form's shape and the API's shape are different, and they drift independently. Map at the
boundary — never inline in the submit handler.

```typescript
// api-to-form.ts
export function mapApiToFormValues(order: Order): OrderFormValues {
  return {
    itemId: order.item?.id ?? "",
    qty: order.qty ?? 1,
    note: order.note ?? "",
    priority: order.priority ?? false,
  };
}
```

> **Null-coalesce every field.** The API returns `null` for an empty column; React reads `null` as
> "uncontrolled", so the input silently drops to uncontrolled and the user's typing vanishes — with
> a console warning nobody reads. `?? ""` / `?? 0` / `?? []` on every single field, no exceptions.

`form-to-api.ts` goes the other way — strip empty optionals, convert types the API expects
differently. Both are pure functions, so they're the cheapest thing in the feature to unit-test.

---

## 5. Server errors → fields

The highest-value rule in this file. The API's error envelope carries `validationErrors`
(frontend-agent §2.5) — fan it onto the fields instead of flattening it to a toast.

```typescript
async function onSubmit(values: OrderFormValues) {
  try {
    await createOrder.mutateAsync(mapFormToApiRequest(values));
    toast.success("Order placed");
    onClose();
  } catch (err) {
    const e = err as SerializedApiError;

    if (e.isValidationError && e.validationErrors) {
      // Field-level: put each message on its own input.
      Object.entries(e.validationErrors).forEach(([field, message]) => {
        form.setError(field as keyof OrderFormValues, { message });
      });
      return;
    }

    if (e.isAuthError) {
      router.push("/login");
      return;
    }

    toast.error(getErrorMessage(err));
  }
}
```

> **Why this matters more than it looks.** Client and server validation *will* diverge — a rule
> changes on the API and the frontend schema lags. When that happens, this is the difference
> between "Quantity exceeds available stock" under the quantity field and a toast saying
> "Validation failed" over a form the user cannot fix.

Set the field name to whatever the API sends; if it names a field the form doesn't have, fall
through to the toast rather than calling `setError` with a key RHF will ignore.

---

## 6. Numeric and currency inputs

**Never `<input type="number">`.** It ships browser spinners, the scroll wheel silently changes the
value when a user scrolls past a focused field, it accepts `1e5` as valid input, and the decimal
separator follows the *browser* locale — so a user typing `1,50` gets either 150 or nothing
depending on where they are. Use the library's `NumberInput` (`inputMode="numeric"`) or
`CurrencyInput`.

| Field | Component |
|---|---|
| Count, quantity, integer | `NumberInput` |
| Percentage, rating, decimal | `NumberInput` with `decimalPlaces` |
| **Money** | `CurrencyInput` |
| Phone, card, postcode | plain `Input` — these are **strings**, not numbers |

> Identifiers that happen to be digits are strings. A phone number in a numeric field loses its
> leading zero, and a card number loses precision past 16 digits.

### Money is an integer in minor units

**Store and transmit money as an integer count of the smallest unit** (cents, paise, satang) —
never a float, never a formatted string.

```typescript
// Schema: the form edits major units, the API takes minor units.
export const priceFormSchema = z.object({
  // "12.34" → 1234. Validate the integer, so the message is about money, not floats.
  amountMinor: z.coerce.number().int("Use at most 2 decimal places").min(0, "Can't be negative"),
  currency: z.string().length(3),   // ISO 4217 — "USD", "INR", "JPY"
});
```

> **Why this is not optional.** Floats can't represent most decimal fractions:
> `0.1 + 0.2 === 0.30000000000000004`. Sum a hundred line items as floats and the invoice total
> is off by a cent — which is both a support ticket and, in a billing system, an audit finding.
> The bug appears only at scale and is unfixable after the data is written, because the precision
> was lost on the way in.

Two rules follow:

- **Convert at the mapper boundary** (§4), not in the component: `form-to-api` multiplies to minor
  units and rounds *once*; `api-to-form` divides for display. Everything between them is integers.
- **The API contract is minor units.** If backend and frontend disagree about this, you get a
  100× pricing bug — agree it in `docs/architecture/api` and pin it with a test.

### Decimals and symbols are properties of the currency

```tsx
<CurrencyInput
  name="amount"
  currency={currency}          // drives BOTH the symbol and the decimal places
  control={form.control}
/>
```

**Never hardcode 2 decimal places or a leading `$`.** JPY and KRW have **zero** minor units (¥100
is 100, not 10000); KWD and BHD have **three**. Hardcoding 2 makes a ¥ price 100× wrong. Symbol
placement is locale-dependent too — `$1.00` but `1,00 €`. Derive both from the currency code
(`Intl.NumberFormat`), and if the app is single-currency, still read it from config rather than
inlining it, so adding a second currency is a config change and not a sweep.

**Format on blur, not on keystroke.** Reformatting while the user types moves the cursor — they
type `1234`, a separator is inserted, and the caret jumps to the end mid-number. Keep the raw
string in the field while focused; format on blur.

For display outside a form (tables, totals), right-align and use tabular figures
(`text-right tabular-nums`) so decimal points line up down the column. Ragged numeric columns are
unreadable at a glance, which is the entire reason someone is looking at a column of money.

## 7. Submission state

```tsx
<Button type="submit" disabled={isPending}>
  {isPending ? "Saving…" : "Save"}
</Button>
```

- **Disable submit while pending.** Without it a double-click sends two POSTs and creates two
  records. This is a design-system non-negotiable, not a nicety.
- **`isPending` covers both mutations** on a form with create and edit modes:
  `createOrder.isPending || updateOrder.isPending`.
- Disable Cancel too while pending — closing mid-flight leaves the user unsure whether it saved.

---

## 8. Unsaved-changes guard

Any form a user can navigate away from mid-edit needs one. `isDirty` is the signal.

```tsx
const { isDirty } = form.formState;

// Browser chrome: refresh, tab close, back button out of the app.
useEffect(() => {
  if (!isDirty) return;
  const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
  window.addEventListener("beforeunload", onBeforeUnload);
  return () => window.removeEventListener("beforeunload", onBeforeUnload);
}, [isDirty]);
```

For in-app navigation and dialog dismissal, intercept the action and confirm:

```tsx
function handleClose() {
  if (isDirty && !window.confirm("Discard your changes?")) return;
  onClose();
}
```

> `isDirty` is only meaningful if `defaultValues` are correct — which is the other reason §3
> matters. A form whose defaults arrive via `reset` reports dirty immediately and the guard fires
> on every close, so people learn to click through it.

---

## 9. Multi-step forms

Only when the field count genuinely warrants it. A wizard is more state, more edge cases, and a
worse experience for anyone who just wants to fix one field.

**One schema per step, composed into the whole.** This gives per-step validation and a single
submit payload without duplicating rules:

```typescript
export const stepOneSchema = z.object({ itemId: z.string().min(1), qty: z.coerce.number().min(1) });
export const stepTwoSchema = z.object({ address: z.string().min(1), note: z.string().optional() });

export const orderFormSchema = stepOneSchema.merge(stepTwoSchema);
export type OrderFormValues = z.infer<typeof orderFormSchema>;

export const STEP_FIELDS = [
  Object.keys(stepOneSchema.shape),
  Object.keys(stepTwoSchema.shape),
] as const;
```

**Validate the current step before advancing** with `trigger`, scoped to that step's fields:

```typescript
async function next() {
  const valid = await form.trigger(STEP_FIELDS[step] as (keyof OrderFormValues)[]);
  if (!valid) return;                 // errors are already on the fields
  setStep((s) => s + 1);
}
```

> **Never validate the whole form to advance one step.** `form.trigger()` with no argument
> validates every field, so step 1 fails on step 3's empty inputs and the user is stuck on a page
> whose errors are all invisible.

**One `FormProvider` around the whole wizard; steps read context.**

```tsx
<FormProvider {...form}>
  {step === 0 && <StepOne />}       {/* each step calls useFormContext<OrderFormValues>() */}
  {step === 1 && <StepTwo />}
</FormProvider>
```

> **Never pass `form` (a `UseFormReturn`) down as a prop.** It couples every step to the parent's
> generic, and any component between them has to re-declare the type to pass it through. Context
> is what RHF ships for exactly this.

Unmounting a step keeps its values (RHF holds them in the form, not the component), so back/next
preserves input for free. Submit only from the final step, and show a review of all steps before
it — a wizard that submits without a summary makes step 1 unverifiable.

---

## 10. Where the frame stops

The layout contract (frontend-agent §2.1a) says a `page.tsx` never sets `max-w-*`, `mx-auto`, or
page padding. **A form component may set its own measure**, because a form's readable width is a
property of the form, not the page:

```tsx
// In a form component — correct.
<form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-6">
```

The rule to keep: **the form sets width, the layout sets position.** Use `max-w-*` in the form;
leave `mx-auto` and page padding to `PageLayout` via `contentWidth`. A form that centres itself
inside a layout that also centres is how a page ends up double-padded on one breakpoint.

---

## Checklist

- [ ] Schema exports a defaults **factory**, not a constant.
- [ ] `defaultValues` via `useMemo` — no `useEffect` + `reset`.
- [ ] `api-to-form` null-coalesces every field.
- [ ] `validationErrors` mapped onto fields via `setError`; auth errors redirect; rest toast.
- [ ] Submit and Cancel both disabled while `isPending`.
- [ ] `isDirty` guard on any form the user can navigate away from.
- [ ] Multi-step: per-step `trigger`, `FormProvider` + `useFormContext`, review before submit.
- [ ] `FieldControlled` for every field; `NumberInput` for numeric (never `<input type="number">`).
- [ ] Money uses `CurrencyInput`, travels as **integer minor units**, and derives decimal places
      and symbol from the currency code — never a hardcoded 2 or `$`.
- [ ] Digit-shaped identifiers (phone, card, postcode) are plain `Input`, typed as strings.

---

**Related:** [`error-architecture.md`](error-architecture.md) §1, §4 (the error taxonomy and the
normalized error) · [`page-templates.md`](page-templates.md) §4 (the create/edit archetype) ·
frontend-agent §2.5 (response shape) · `docs/design/design-system.md` (field states).
