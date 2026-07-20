# Add Space Flow (Owner)

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
