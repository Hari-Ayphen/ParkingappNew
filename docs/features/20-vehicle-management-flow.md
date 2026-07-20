# Vehicle Management Flow (Parker)

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
