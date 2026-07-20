# Vehicle Management Flow (Parker)

- **Status:** agreed
- **Milestone:** `v0.3` (work item `v0.3-A`)
- **Owner:** unassigned

## Overview
Where a user adds, edits, and removes the vehicles they park — a prerequisite for Booking Confirm's "Select vehicle" step, which was previously undocumented as its own screen.

---

## Flow Diagram

```
PROFILE → "My Vehicles" tapped
  (also reachable inline from Booking Confirm
   via "+ Add a vehicle" if the list is empty)
              ↓
┌─────────────────────────────────────┐
│             MY VEHICLES                 │
├─────────────────────────────────────┤
│  List of saved vehicles:                  │
│    - Vehicle nickname (e.g. "My Car")        │
│    - Registration number                        │
│    - Type: 2-wheeler / 4-wheeler / EV               │
│    - Default badge (one marked default)                │
│  "+ Add Vehicle" button                                    │
└─────────────────────────────────────┘
              ↓
        Tap "+ Add Vehicle"
              ↓
┌─────────────────────────────────────┐
│            ADD VEHICLE                  │
├─────────────────────────────────────┤
│  - Registration number (validated format)   │
│  - Vehicle type                                 │
│  - Nickname (optional)                              │
│  - "Set as default" toggle                             │
│  - Save                                                     │
└─────────────────────────────────────┘
              ↓
        POST /users/me/vehicles
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Parker (any signed-in user) | List, add, edit, delete their own vehicles; mark one as default |
| Owner | Nothing here — vehicles belong to the parking side of the account. The same user has them, but a space listing never reads them |
| Admin | Read-only, for dispute context. No admin CRUD on a user's vehicles is specified |

## User stories

### US-1 — See my saved vehicles

As a **Parker**, I can **open "My Vehicles" from Profile and see every vehicle I've saved** so that
**I know what I can pick from before I try to book**.

- **AC1:** Given I have saved vehicles, when I open My Vehicles, then each row shows nickname,
  registration number and vehicle type.
- **AC2:** Given exactly one vehicle is marked default, when the list renders, then that row and
  only that row carries a "Default" badge.
- **AC3:** Given I have no vehicles, when I open My Vehicles, then I see an empty state with
  "+ Add Vehicle" as the primary action, not a blank list.
- **AC4:** Given the list request fails, when the screen loads, then I see a retry affordance and
  not a permanently empty list.

### US-2 — Add a vehicle

As a **Parker**, I can **save a vehicle's registration number and type** so that **I can attach it
to a booking without retyping it every time**.

- **AC1:** Given I enter a registration number matching my country's plate pattern, when I tap
  Save, then the vehicle is created and I return to the list with it visible.
- **AC2:** Given the registration number fails the country plate pattern, when I tap Save, then an
  inline field error appears and nothing is created.
- **AC3:** Given I leave nickname blank, when I tap Save, then the vehicle still saves — nickname
  is optional.
- **AC4:** Given vehicle type is not selected, when I tap Save, then Save is blocked with an
  inline error — type is required, because it drives space compatibility filtering.
- **AC5:** Given this is my first vehicle, when it saves, then it becomes the default without me
  toggling anything.

### US-3 — Edit a vehicle

As a **Parker**, I can **correct a vehicle's registration, type or nickname** so that **a typo
doesn't force me to delete and re-add it**.

- **AC1:** Given I change the registration number to a valid one, when I save, then the vehicle
  row reflects the new value.
- **AC2:** Given the vehicle was used on a past completed booking, when I edit it, then that
  booking's stored record is unchanged — history does not retroactively rewrite.
- **AC3:** Given the new registration fails the plate pattern, when I save, then an inline error
  appears and the stored vehicle is untouched.

### US-4 — Choose my default vehicle

As a **Parker**, I can **mark one vehicle as my default** so that **Booking Confirm pre-selects it
and repeat bookings are one tap shorter**.

- **AC1:** Given vehicle A is default, when I set vehicle B as default, then A loses the badge and
  B gains it — never two at once.
- **AC2:** Given a default is set, when I open Booking Confirm, then that vehicle is pre-selected.
- **AC3:** Given a default is set, when I open Booking Confirm, then I can still switch to another
  saved vehicle for that booking only, without changing my default.

### US-5 — Delete a vehicle

As a **Parker**, I can **remove a vehicle I no longer own** so that **my list stays short and I
don't mis-pick a sold car**.

- **AC1:** Given the vehicle is not attached to any booking that is currently in-flight, when I
  confirm deletion, then it disappears from the list.
- **AC2:** Given the vehicle is attached to a booking whose session has not completed, when I tap
  Delete, then deletion is blocked with a message naming the active session.
- **AC3:** Given the vehicle was used on completed bookings, when I delete it, then those bookings
  still display the vehicle they were made with.
- **AC4:** Given I delete the vehicle currently marked default and other vehicles remain, when the
  delete succeeds, then exactly one of the remaining vehicles is default.

### US-6 — Add a vehicle from inside the booking flow

As a **Parker with no saved vehicle**, I can **add one without abandoning the booking I started**
so that **the "at least one vehicle" rule doesn't cost me the space**.

- **AC1:** Given my vehicle list is empty, when I reach Booking Confirm, then Confirm is blocked
  and "+ Add a vehicle" is offered inline.
- **AC2:** Given I add a vehicle from that entry point, when it saves, then I am returned to
  Booking Confirm with the new vehicle selected and the space still the one I chose.
- **AC3:** Given I cancel out of the inline add, when I return, then Booking Confirm is still
  blocked and no partial vehicle was created.

## Business rules

- **BR-1:** **At least one vehicle must exist before a booking can be confirmed.** Booking Confirm
  blocks and deep-links here rather than letting a booking exist with no vehicle on it.
- **BR-2:** **Exactly one vehicle per user is default** — enforced, not merely encouraged
  (Invariant 5). Setting a new default clears the old one in the same operation.
- **BR-3:** Registration number is validated against the **country's plate pattern**, mirroring the
  country-aware phone validation in `01-login-flow.md`. There is no single global regex.
- **BR-4:** Vehicle type is not decoration — it feeds space **compatibility filtering**
  (`04-map-search-flow.md`) and the **platform rate table** (`14-billing-logic.md` §2). It is
  therefore mandatory.
- **BR-5:** **A vehicle in an in-flight booking cannot be deleted** (Invariant 7). The check is on
  the session not having completed, not merely on the row existing.
- **BR-6:** Editing a vehicle changes the registration on file going forward only. It must not
  alter what a completed booking recorded.
- **BR-7:** Vehicles are **per user, single-tenant**. There is no sharing, no household, no
  transferring a vehicle to another account.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `vehicle` | new | `user_id`, `registration_number`, `vehicle_type_id`, `nickname`, `is_default` |
| `vehicle_type` | new (seed) | Lookup — 2-wheeler / 4-wheeler / EV. Never a `text` enum |
| `country` | read | Supplies the plate-validation pattern |
| `booking` | read | `vehicle_id` FK — the reason delete is restricted |

**Invariants this introduces:** exactly one default vehicle per user (partial unique index on
`vehicle(user_id) WHERE is_default`), and a vehicle referenced by an in-flight booking cannot be
deleted. Both recorded in [`../architecture/data.md`](../architecture/data.md) as Invariants 5
and 7.

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| My Vehicles | `/(tabs)/profile/vehicles` | `pages/my-vehicles.md` |
| Add / Edit Vehicle | `/(tabs)/profile/vehicles/[id]` | `pages/vehicle-form.md` |

## Out of scope

- **Vehicle photos or documents.** No RC book upload, no insurance, no verification of ownership.
- **Verifying the plate is real.** Format validation only — SpotKey does not check a registry.
- **Owner-side vehicle records.** An Owner never registers vehicles; they receive whatever the
  Parker declared.
- **Multiple defaults or per-space defaults.** One default per user, full stop.
- **Vehicle-based pricing to the Parker.** Vehicle type affects the Owner's platform fee, not what
  the Parker is quoted.
- **Bulk import or transfer between accounts.**

## Open questions

- [ ] **Soft-delete or `ON DELETE RESTRICT` for `vehicle`?** `architecture/data.md` Open Question 5
      notes RESTRICT is stricter than this spec — it would block deleting a vehicle used only on
      *completed* bookings, which AC1 of US-5 permits. Decide before the schema lands.
- [ ] Is there a maximum number of saved vehicles per user? Unstated.
- [ ] Is the registration number unique per user, globally unique, or not unique at all? Two
      accounts legitimately sharing a family car is plausible and unaddressed.
- [ ] Which country supplies the plate pattern — the user's `country_id` from login, or a
      per-vehicle country? Cross-border plates are unaddressed.
- [ ] What happens on deleting the **only** vehicle while a booking is being composed elsewhere?

---

## Key Behavior

| Element | Behavior |
|---|---|
| Minimum required | At least one vehicle must exist before a booking can be confirmed — Booking Confirm blocks and deep-links here if the list is empty |
| Default vehicle | Pre-selected on Booking Confirm to speed up repeat bookings; user can still switch per booking |
| Edit/Delete | Editing changes the registration on file (does not affect past completed bookings' records); deleting a vehicle used in an **active** booking is blocked until that session completes |
| Validation | Registration number format is checked against the vehicle's country plate pattern (mirrors the country-aware validation used in `01-login-flow.md` for phone numbers) |

---

## API Touchpoints (indicative)
- `GET /users/me/vehicles`
- `POST /users/me/vehicles`
- `PUT /users/me/vehicles/:id`
- `DELETE /users/me/vehicles/:id`

---

## Related Docs
- `06-booking-flow.md` — Where vehicle selection is consumed
- `15-profile-flow.md` — Where this screen is reached from
