# Owner Flow (Manage My Space)

- **Status:** agreed
- **Milestone:** `v0.2` (work item `v0.2-C`)
- **Owner:** unassigned

## Overview
This is the flow a user follows when they choose **"My Space"** from Home. It covers creating a space, the ON/OFF live toggle (which drives billing — see `14-billing-logic.md`), managing booking requests, active sessions, and exit verification.

**No subscription exists for owners.** Billing is entirely usage-based via the toggle, detailed in `14-billing-logic.md`.

---

## Flow Diagram

```
HOME → "My Space" tapped
              ↓
┌───────────────────────────────────┐
│   Has the user added a space yet?  │
└───────────────────────────────────┘
        NO                YES
         ↓                  ↓
┌────────────────┐   ┌───────────────────────────┐
│   ADD SPACE     │   │   MY SPACES DASHBOARD      │
│  (first time)   │   ├───────────────────────────┤
└────────────────┘   │  - List of owned spaces      │
         ↓            │  - Each with ON/OFF toggle    │
   (7-step form)      │  - Pending requests count      │
         ↓            │  - Earnings summary               │
   POST /spaces/create │  - "+ Add another space" option    │
         ↓            └───────────────────────────┘
   Space created                    ↓
   (status: Active —         Tap a specific space
    NO approval gate)                ↓
         ↓                ┌───────────────────────────┐
   Appears in dashboard   │      SPACE DETAIL (Owner)   │
   immediately, toggle     ├───────────────────────────┤
   available (still OFF)   │  - Edit price/photos/amenities│
         ↓                 │  - ON/OFF LIVE TOGGLE          │
         │                 │  - Pending requests for this    │
         │                 │    space                          │
         └─────────────────┴───────────────────────────┘
                              ↓
              ┌───────────────────────────────────┐
              │      OWNER TAPS TOGGLE → ON         │
              │   (see 14-billing-logic.md for      │
              │    full first-time confirmation +     │
              │    daily billing rules)                │
              └───────────────────────────────────┘
                              ↓
              Space is LIVE → visible on map to Parkers
                              ↓
              ┌───────────────────────────────────┐
              │        BOOKING REQUESTS             │
              ├───────────────────────────────────┤
              │  - Incoming request from a Parker    │
              │  - Shows: vehicle, duration, parker    │
              │    profile                              │
              │  - Approve / Reject buttons              │
              └───────────────────────────────────┘
                              ↓
                        Owner Approves
                              ↓
              ┌───────────────────────────────────┐
              │         ACTIVE BOOKINGS             │
              ├───────────────────────────────────┤
              │  - Track all ongoing sessions         │
              │    across this owner's spaces          │
              │  - Live status per session               │
              └───────────────────────────────────┘
                              ↓
              ┌───────────────────────────────────┐
              │       EXIT VERIFICATION             │
              ├───────────────────────────────────┤
              │  - Owner confirms parker has left     │
              │  - Confirms space condition             │
              │  - Finalizes session amount               │
              │  - QR code (from Owner's UPI ID)            │
              │    displayed for Parker to scan & pay        │
              │    (external payment — see PARKER_FLOW.md)    │
              └───────────────────────────────────┘
                              ↓
                    Session marked complete
                    Owner can toggle space
                    ON/OFF anytime, freely
                              ↓
                        Back to HOME
              (can switch to Parker mode anytime)
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Owner (the space's owner) | See their spaces, open a space's detail, toggle a space ON or OFF, see pending request counts and earnings summary |
| Owner (any other user's) | Nothing — a user only ever sees spaces they own. There is no shared or delegated ownership |
| Parker | Nothing here. A Parker sees a live space only through search/map (`04-map-search-flow.md`) |
| Admin | Suspend or un-suspend a space from the desktop panel. Admin never touches the owner's toggle |

## User stories

### US-1 — See my spaces at a glance

As an **owner**, I can **open "My Space" from Home and see every space I own with its live state**
so that **I know what is earning and what is idle without opening each one**.

- **AC1:** Given I own no spaces, when I tap "My Space", then I am taken into the Add Space flow
  (`09-add-space-flow.md`) rather than an empty list.
- **AC2:** Given I own one or more spaces, when I tap "My Space", then I see each space as a row
  with its ON/OFF toggle, its pending-request count, and an earnings summary.
- **AC3:** Given I have just published a space, when the dashboard loads, then that space appears
  immediately with its toggle present and set to OFF — no "Pending Approval" state is ever shown.
- **AC4:** Given I am on the dashboard, when I tap "+ Add another space", then the Add Space flow
  starts fresh with no fields carried over from an existing space.

### US-2 — Open one space's owner detail

As an **owner**, I can **tap a space and see its owner-side detail** so that **I can act on that
one space without wading through the others**.

- **AC1:** Given I tap a space row, when Space Detail opens, then it shows that space's current
  price, photos, amenities, ON/OFF toggle, and the pending requests for *that* space only.
- **AC2:** Given I am on Space Detail, when I tap "Edit", then I enter the edit flow
  (`22-edit-space-flow.md`) with every field pre-filled.
- **AC3:** Given a space I do not own, when its id is requested, then the API returns 404/403 and
  no space data is disclosed.

### US-3 — Toggle a space ON *(work item `v0.3-B`)*

As an **owner**, I can **switch a space ON** so that **Parkers can find and book it**.

- **AC1:** Given a space with `space_status = active` and `is_live = false`, when I toggle it ON,
  then `is_live` becomes `true` and the space appears on the Parker map.
- **AC2:** Given **this space** has never been live before, when I tap the toggle, then a
  confirmation toast explaining that charging begins is shown and the toggle only commits after I
  confirm.
- **AC3:** Given **this space** has been live at least once before, when I toggle it ON again,
  then no toast is shown and the change commits directly.
- **AC3b:** Given I already confirmed the toast for one space, when I first toggle ON a
  **different** space, then that space shows its own first-activation toast — the toast is per
  space, not per owner (`14-billing-logic.md` BR-9).
- **AC4:** Given the space is `suspended` by admin, when I attempt to toggle it ON, then the
  toggle is disabled, an inline reason is shown, and `is_live` does not change.
- **AC5:** Given the toggle commits, when the day is billed, then that day counts as a live day
  for this space per `14-billing-logic.md` — this doc asserts no rate value.

### US-4 — Toggle a space OFF

As an **owner**, I can **switch a space OFF at any time** so that **I can close for the evening
without deleting the listing or being charged for the day**.

- **AC1:** Given a space with `is_live = true`, when I toggle it OFF, then it disappears from the
  Parker map and accepts no new booking requests.
- **AC2:** Given I toggle a space OFF, when the change commits, then `space_status` is unchanged —
  only `is_live` flips.
- **AC3:** Given I toggle OFF, when I look at the space, then existing approved bookings and
  in-progress sessions are unaffected and still complete normally.
- **AC4:** Given I toggle a space OFF and back ON, when either action commits, then no
  confirmation toast appears beyond that space's own first-ever confirmation in US-3.

### US-5 — An admin suspension reaches my phone instantly

As an **owner**, I can **see a suspension the moment admin applies it** so that **I am not left
believing a space is earning when it has been taken down**.

- **AC1:** Given my space is live, when admin suspends it, then within the Socket.IO round trip
  the space leaves the map, my toggle disables, and an inline reason appears — with no app
  refresh, re-login, or poll.
- **AC2:** Given my space is suspended, when admin un-suspends it, then the toggle re-enables and
  the space returns to whatever `is_live` value I had previously chosen — not a default.
- **AC3:** Given admin edits a space's details, when the change is saved, then the updated fields
  appear on Space Detail without a refresh.
- **AC4:** Given a suspended space, when any map or search query runs, then it is excluded —
  visibility requires `space_status = active` AND `is_live = true` (ADR-0004).

## Business rules

- **BR-1:** A space is visible to Parkers only when `space_status = active` **and**
  `is_live = true`. Both columns are checked on every visibility query (ADR-0004).
- **BR-2:** `is_live` is the **owner's** lever and is the billable one. `space_status` is
  **admin's** lever and is an enforcement state. They are separate columns and are never
  collapsed, or "was this space billable on the 14th?" becomes unanswerable.
- **BR-3:** Admin suspension never overwrites `is_live`. The owner's chosen toggle state survives
  a suspension and is restored on un-suspend.
- **BR-4:** Publishing a space never sets `is_live = true`. Going live is always an explicit owner
  action (`09-add-space-flow.md`).
- **BR-5:** The first-ever toggle-ON **of each space** shows a confirmation toast; subsequent
  toggles of that space do not. The toast is **per space, not per owner** — see
  `14-billing-logic.md` BR-9, which is the authority on billing behaviour.

  > The failure this prevents: an owner who confirmed once for a driveway would otherwise list a
  > second, larger space and start a **separate billing clock at a different daily rate** with no
  > warning at all. Since the rate is a function of slot count and vehicle type
  > (`14-billing-logic.md` §2), each space costs a different amount per live day — so each space
  > needs its own consent moment.
- **BR-6:** There is no owner subscription. The only charge is the platform fee for days a space
  was live, a function of slot count and vehicle type (`14-billing-logic.md`). **No rate value is
  stated anywhere yet — do not invent one.**
- **BR-7:** Toggling OFF never cancels an already-approved booking or an in-progress session.
- **BR-8:** SpotKey never handles the Parker→Owner payment. The QR shown at exit is the owner's
  own UPI; the app does not learn whether money moved.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `space` | new | Owned by one `user`; carries `is_live` (boolean) and `space_status_id` (FK) |
| `space_status` | new (seed) | Lookup — `active`, `suspended`. **No `pending_approval` row** (ADR-0002) |
| `space` | changed | Needs a flag recording that **this space** has had its first-time billing confirmation (BR-5). Not on `user` — the toast is per space |
| — | Socket.IO, not a table | `spaces:live-updates`, `space:{id}:availability`, `admin:{userId}:account-status` |

**Invariants this introduces:** a space is map-visible only when `space_status = active AND
is_live = true`; and `is_live` may not be `true` while `space_status = suspended` — worth a DB
`CHECK`. Recorded as Invariant 11 in [`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| My Spaces Dashboard | `/(owner)/spaces` | `pages/my-spaces.md` |
| Space Detail (Owner) | `/(owner)/spaces/[id]` | `pages/space-detail-owner.md` |

## Out of scope

- **Creating a space** — `09-add-space-flow.md`.
- **Editing a space** — `22-edit-space-flow.md`.
- **Approving or rejecting booking requests, active sessions, exit verification** — `10`–`13`.
- **The billing math itself** — the 7-day cycle, per-day counting, and invoice generation live in
  `14-billing-logic.md`. This doc only covers the toggle's effect on visibility and bookings.
- **The autopay mandate setup** — `23-upi-autopay-mandate-flow.md`.
- **The admin panel screens** that perform the suspension. Only the mobile-side effect is here.
- **Any approval queue.** Removed by ADR-0002 and not coming back in this milestone.
- **Ratings and dispute handling** — `24` and `25`.

## Open questions

- [ ] **Must an active autopay mandate exist before the first toggle-ON?**
      `23-upi-autopay-mandate-flow.md:69` makes it a hard precondition; this doc and
      `14-billing-logic.md` show toggle → toast → billing with no mandate step. The owner's
      first-run sequence is ambiguous, and the two orderings produce different screens.
      *(Known Gotcha 2 — must be resolved before this milestone closes.)*
- [ ] What counts as "ON for a day" — any moment of ON, or the state at a cutoff time? Decides
      whether five minutes of ON costs a full day. *(Known Gotcha 3.)*
- [ ] What the earnings summary on the dashboard actually sums. SpotKey does not observe
      Parker→Owner payments, so this cannot be realised revenue — undefined today.
- [ ] Whether the pending-request count is per space, aggregated, or both.
- [ ] Whether an owner may toggle ON a space that has never had a booking-capable field set
      (e.g. no price), or whether publish already guarantees completeness.
- [ ] What the owner sees as the suspension "reason" — free text from admin, a reason lookup, or
      nothing. No doc specifies it.

---

## Add Space (First-Time Setup)

7-step form to list a new parking spot:
1. Location (address/map pin)
2. Photos of the space
3. Space type/size details
4. Amenities (covered, CCTV, security, EV charging, etc.)
5. Hourly/daily rate
6. Availability rules
7. Review & submit

After submission the space is **created directly in `Active` status** — there is no admin approval
gate. It appears in the My Spaces Dashboard immediately with its toggle available (OFF by default).

See `09-add-space-flow.md` for why the gate was removed and what covers the risk instead.

---

## Admin Sync — admin changes reach mobile instantly

The admin panel is a **desktop web application connected to the same backend as the mobile app**.
Any admin action on a space, booking, or account **propagates to the mobile app in real time over
Socket.IO** — no refresh, no re-login, no waiting for a poll.

| Admin action | What the owner/parker sees on mobile |
|---|---|
| Suspend a space | Space drops off the map immediately; owner's toggle disables with an inline reason |
| Un-suspend a space | Space returns to the dashboard, toggle re-enabled |
| Edit a space's details | Updated fields appear on Space Detail without a refresh |
| Resolve a dispute / adjust an amount | Booking detail and invoice update live on both sides |
| Flag or restrict an account | Restriction takes effect on the next action, not the next login |

> **Why instant and not eventual.** Admin's main lever is now takedown *after* a space is already
> live and bookable (the approval gate is gone). A suspension that takes minutes to reach devices
> is a suspension that lets someone book an unsafe space in the meantime. The whole point of
> reactive moderation is that the reaction is fast.

Channels follow the existing pattern: `spaces:live-updates` for map-level add/remove,
`space:{id}:availability` for a single space, plus an `admin:{userId}:account-status` channel for
account-level actions.

---

## The Toggle — Core of the Owner Experience

- Every space has a single **ON/OFF toggle**.
- **Toggle ON** → space becomes visible on the map to Parkers, can receive bookings, and billing starts counting for that day.
- **Toggle OFF** → space disappears from map, no new bookings accepted, billing does not count for that day.
- Full billing math (7-day cycle, per-day counting, first-time confirmation toast) is documented separately in `14-billing-logic.md` — this doc only covers the toggle's effect on visibility/bookings.

---

## No Subscription

- There is no monthly plan, no tier, no recurring subscription fee independent of usage.
- The owner only ever pays based on days the toggle was ON, billed every 7 days automatically (see `14-billing-logic.md`).

---

## Related Docs
- `02-after-login-flow.md` — How the user reaches Home/My Space
- `06-booking-flow.md` — Parker side of booking + exit payment
- `14-billing-logic.md` — Full toggle billing logic, 7-day invoice, auto-debit
