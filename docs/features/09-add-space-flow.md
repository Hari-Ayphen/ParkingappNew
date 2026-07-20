# Add Space Flow (Owner)

- **Status:** agreed
- **Milestone:** `v0.2` (work items `v0.2-A` and `v0.2-B`)
- **Owner:** unassigned

## Overview
The 7-step form an Owner fills out to list a new parking space. Triggered from My Space Dashboard's "+ Add Space" (first time or additional spaces).

---

## Flow Diagram

```
MY SPACE DASHBOARD → "+ Add Space"
              ↓
┌─────────────────────────────────────┐
│  STEP 1 — LOCATION                     │
│  - Map pin drop / search address         │
│  - Confirm pin accuracy                    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  STEP 2 — PHOTOS                       │
│  - Upload 3-8 photos                     │
│  - At least 1 required to proceed          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  STEP 3 — SPACE TYPE & SIZE             │
│  - Type: driveway / lot / covered / open   │
│  - Vehicle types supported                    │
│  - Number of slots (if multiple)                 │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  STEP 4 — AMENITIES                    │
│  - Covered, CCTV, security guard,          │
│    EV charging, lighting, washroom access     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  STEP 5 — PRICING                      │
│  - Hourly rate                            │
│  - (No subscription fields — usage-only,     │
│     see 14-billing-logic.md)                    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  STEP 6 — AVAILABILITY RULES            │
│  - Days/hours generally available          │
│  - (Independent of the live ON/OFF toggle —   │
│     this is a display hint, not a hard gate)    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  STEP 7 — REVIEW & SUBMIT               │
│  - Summary of all steps                    │
│  - Edit any step inline                       │
│  - "Publish Space" button                        │
└─────────────────────────────────────┘
              ↓
        POST /spaces/create
              ↓
        Space created, status = "Active"
        (NO admin approval gate)
              ↓
   Space appears in My Spaces Dashboard
   immediately, toggle available
   (still OFF by default — see below)
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Owner (any authenticated user) | Fill the 7-step form, upload photos, resume a draft, publish the space |
| Parker | Nothing. A published-but-OFF space is invisible to Parkers |
| Admin | Nothing *before* publication — there is no queue to review. Admin's only lever is suspension **after** the space exists (`08-my-space-flow.md` — Admin Sync) |

## User stories

### US-1 — Fill the 7-step listing form *(work item `v0.2-A`)*

As an **owner**, I can **work through a 7-step form describing my space** so that **a Parker has
enough information to decide to book it**.

- **AC1:** Given I tap "+ Add Space", when the flow opens, then I land on Step 1 (Location) with a
  visible step indicator showing 1 of 7.
- **AC2:** Given I am on any step, when a required field for that step is empty or invalid, then
  "Next" is blocked and the offending field shows an inline error.
- **AC3:** Given Step 1, when I drop or search a map pin, then I must explicitly confirm the pin's
  accuracy before proceeding.
- **AC4:** Given Step 3, when I choose a space type, vehicle types supported, and slot count, then
  all three are stored — slot count and vehicle type are the inputs to the platform fee
  (`14-billing-logic.md`), so neither may be left unset.
- **AC4b:** Given a slot count of N, when the space is created, then **N `space_slot` rows are
  created with it** — slots are rows, not just a number (ADR-0005). A space with a slot count and
  no slot rows is unbookable, because bookings attach to a slot.
- **AC5:** Given Step 6 (Availability rules), when I save them, then they are recorded as a
  display hint only and do not gate bookings or the live toggle.
- **AC6:** Given Step 7, when the summary renders, then every earlier step is shown and each is
  editable inline without restarting the form.

### US-2 — Upload photos of the space *(work item `v0.2-A`)*

As an **owner**, I can **upload photos of my space** so that **a Parker can see what they are
booking before they arrive**.

- **AC1:** Given Step 2, when I have uploaded zero photos, then "Next" is blocked.
- **AC2:** Given Step 2, when I upload between 1 and 8 photos, then each appears as a thumbnail
  and can be removed individually.
- **AC3:** Given I attempt to upload a 9th photo, when the limit is reached, then the picker is
  disabled or the extra file is rejected with a message.
- **AC4:** Given an upload fails (network, size, format), when it fails, then that one photo shows
  a retry affordance and the other uploads are unaffected.
- **AC5:** Given the camera or photo-library permission has not been granted, when I first tap to
  add a photo, then the permission is requested at that moment — never earlier in the flow.

### US-3 — Resume an interrupted draft *(work item `v0.2-A`)*

As an **owner**, I can **leave the form part-way and come back to it** so that **a phone call or a
backgrounded app doesn't cost me seven steps of typing**.

- **AC1:** Given I have completed some steps, when I background or close the app, then my progress
  is persisted locally.
- **AC2:** Given a saved draft exists, when I re-enter Add Space, then I am offered to resume it
  at the step I left, or discard it and start fresh.
- **AC3:** Given I publish the space, when publication succeeds, then the local draft is cleared.
- **AC4:** Given a draft exists, when it is inspected, then it is not visible to Parkers, to
  admin, or in My Spaces — a draft is not a space.

### US-4 — Publish the space and see it immediately *(work item `v0.2-B`)*

As an **owner**, I can **publish my completed space and have it exist at once** so that **I am not
waiting on a human before I can start earning**.

- **AC1:** Given a complete form, when I tap "Publish Space", then `POST /spaces/create` creates
  the space with `space_status = active`.
- **AC2:** Given the space is created, when I return to the dashboard, then it is listed
  immediately — there is no "Pending Approval" state, no review queue, and no approved/rejected
  branch anywhere in this flow.
- **AC3:** Given the space is created, when I look at its toggle, then `is_live` is `false` and no
  billing has begun.
- **AC4:** Given publication succeeds, when the response is inspected, then nothing in it starts a
  billing cycle, charges an amount, or references a mandate.
- **AC5:** Given publication fails, when the error returns, then I stay on Step 7 with all my
  entered data intact and can retry.

## Business rules

- **BR-1:** A space is created directly in `Active` status. **There is no admin approval gate, no
  `Pending Approval` state, and no approved/rejected branch** (ADR-0002). The failure this
  prevents is a queue that puts a human between an owner and their first earnings, throttling
  supply on a marketplace whose launch risk is an empty map.
- **BR-2:** **Publishing is not going live.** Publishing is free and instant; **toggling ON** is
  the billable act. Publishing must never set `is_live = true` — auto-activating would start
  charging an owner who never saw the confirmation toast.
- **BR-3:** The toggle is OFF by default after publishing, and going live is a separate explicit
  action gated by the first-time confirmation toast and (from v0.5) an active autopay mandate.
- **BR-4:** Because nothing is vetted before publication, trust is entirely **reactive** —
  ratings, in-session issue reports, and admin suspension after the fact. Admin may suspend a live
  space at any time, and that reaches mobile instantly over Socket.IO.
- **BR-5:** At least 1 photo is required; the cap is 8.
- **BR-6:** Availability rules (Step 6) are a display hint, independent of `is_live`. They never
  gate a booking.
- **BR-7:** Step 5 collects the Parker-facing hourly rate only. It has no relation to the platform
  fee, which is a function of slot count and vehicle type and whose **rate values are undecided —
  never hardcode a number**.
- **BR-8:** Every field captured here is editable later with immediate effect and no re-review
  (`22-edit-space-flow.md`).
- **BR-9:** One user, one account, no organisation. A space belongs to an individual user; there
  is no shared or transferred ownership.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `space` | new | Location, type, slot count, hourly rate (integer paise), availability rules; `space_status_id` set to `active` on insert, `is_live` defaults `false` |
| `space_slot` | new | **One row per bookable slot**, created alongside the space (ADR-0005). Bookings attach here, not to `space` |
| `space_status` | new (seed) | Lookup — `active`, `suspended`, `suspended_pending_review`. **Must contain no `pending_approval` row** |
| `space_type` | new (seed) | Lookup — driveway / lot / covered / open |
| `vehicle_type` | new (seed) | Lookup; also an input to the platform fee |
| `amenity` + `space_amenity` | new | Lookup plus join table — amenities are a list, not booleans on `space` |
| `space_photo` | new | 1–8 rows per space, ordered |
| — | local device storage, not a table | The in-progress draft. It never reaches the server |

**Invariants this introduces:** a space always has a `space_status` and it is `active` at
creation; a live-eligible space has between 1 and 8 photos; `is_live` is `false` at creation.
Record in [`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Add Space — Location | `/(owner)/spaces/new/location` | `pages/add-space-location.md` |
| Add Space — Photos | `/(owner)/spaces/new/photos` | `pages/add-space-photos.md` |
| Add Space — Type & Size | `/(owner)/spaces/new/type` | `pages/add-space-type.md` |
| Add Space — Amenities | `/(owner)/spaces/new/amenities` | `pages/add-space-amenities.md` |
| Add Space — Pricing | `/(owner)/spaces/new/pricing` | `pages/add-space-pricing.md` |
| Add Space — Availability | `/(owner)/spaces/new/availability` | `pages/add-space-availability.md` |
| Add Space — Review & Submit | `/(owner)/spaces/new/review` | `pages/add-space-review.md` |

## Out of scope

- **Going live.** The toggle and everything it triggers is `08-my-space-flow.md`.
- **Billing.** No charge originates in this flow — `14-billing-logic.md`.
- **The autopay mandate** — `23-upi-autopay-mandate-flow.md`.
- **Editing a published space** — `22-edit-space-flow.md`.
- **Any admin review, moderation queue, or approval UI.** There is none by ADR-0002.
- **Address verification or ownership proof.** Nothing checks that the owner controls the
  location they pinned.
- **Deleting a space** — `22-edit-space-flow.md`.

## Open questions

- [ ] Whether an owner may hold more than one draft at a time, and whether drafts expire.
- [ ] Whether a draft should survive an app reinstall — local-only persistence means it does not.
- [ ] Maximum photo file size, accepted formats, and whether images are compressed on device or
      server-side.
- [ ] Is there a cap on how many spaces one owner may publish? Nothing states one, and with no
      approval gate nothing throttles it either.
- [ ] Minimum and maximum hourly rate bounds, if any. An unbounded rate field lets a listing be
      priced at zero or absurdly high.
- [ ] Whether two spaces may be pinned at the same location by different owners, and what happens
      if so.
- [ ] Whether availability rules are structured (day/hour ranges) or free text. Step 6 says
      "days/hours generally available" without specifying a shape.

---

## No Admin Approval Gate

A submitted space is **live-eligible the moment it is created**. There is no "Pending Approval"
state, no admin review queue, and no approved/rejected branch.

Why: an approval queue throttles supply growth and puts a human in the path of every owner's
first success. An owner who lists at 9pm can be earning by 9:05pm.

> **What this costs, and how it's covered.** Nobody vets a listing before a stranger parks there.
> Trust is therefore entirely **reactive** — ratings (`24-rating-review-flow.md`), in-session
> issue reports (`25-issue-dispute-report-flow.md`), and admin takedown after the fact. Admin
> moderation is no longer a back-office nicety; it is the only safety net. A space can be
> **suspended by admin at any time**, and that suspension reaches the mobile app instantly
> (see `08-my-space-flow.md` — Admin Sync).

---

## Publishing ≠ Going Live

Two separate things — don't collapse them:

| Step | What it means | Billing |
|---|---|---|
| **Publish** (this flow) | The space exists, is complete, and is eligible to go live | ₹0 — nothing charged |
| **Toggle ON** (`08-my-space-flow.md`) | The space is visible on the map and can take bookings | Billing starts that day |

Publishing does **not** auto-activate the space. The toggle stays OFF until the owner explicitly
turns it on, which triggers the first-time confirmation toast and the autopay-mandate gate
(`14-billing-logic.md`, `23-upi-autopay-mandate-flow.md`).

> The failure this prevents: auto-activating on publish would start the billing clock on a space
> the owner never consented to pay for — they'd never see the toast that tells them charging has
> begun. Publishing is free; going live is the billable act, and it stays an explicit choice.

---

## Key Behavior

| Element | Behavior |
|---|---|
| Draft saving | Progress is saved locally between steps if the owner backgrounds the app |
| Toggle stays OFF after publishing | Publishing does not auto-activate the space — the owner must explicitly toggle ON, which triggers the first-time confirmation toast (see `14-billing-logic.md`) and requires an active autopay mandate (see `23-upi-autopay-mandate-flow.md`) |
| Editing later | Every field can be edited anytime from My Space Dashboard → Space Detail, and takes effect immediately — no re-review for any change (see `22-edit-space-flow.md`) |
| Admin takedown | Admin can suspend a live space at any point after publishing; the space drops off the map and the owner is notified. This is the reactive counterpart to the removed approval gate |

---

## API Touchpoints (indicative)
- `POST /spaces/create` — creates the space directly in `Active` status
- `POST /spaces/:id/photos`
- `GET /spaces/:id`

---

## Related Docs
- `08-my-space-flow.md` — Where this flow starts, and where the space lands immediately after publishing
- `22-edit-space-flow.md` — Editing a published space (no re-review)
- `23-upi-autopay-mandate-flow.md` — The mandate gate that stands between publishing and going live
- `14-billing-logic.md` — What happens once the owner actually toggles the space live
