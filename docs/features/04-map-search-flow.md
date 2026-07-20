# Map / Search Flow (Parker)

- **Status:** agreed
- **Milestone:** `v0.3` (work items `v0.3-C` and `v0.3-D`)
- **Owner:** unassigned

## Overview
This is the first screen a Parker sees after tapping **"Book a Space"** from Home. It shows nearby live spaces on a map (default) or as a list, and lets the Parker filter/search before drilling into a specific space.

---

## Flow Diagram

```
HOME → "Book a Space" tapped
              ↓
┌─────────────────────────────────────┐
│           SEARCH / MAP SCREEN          │
├─────────────────────────────────────┤
│  Top: Search bar (location/address)    │
│  Toggle: [ Map View ] / [ List View ]    │
│                                           │
│  MAP VIEW (default):                       │
│    - Current location pin (blue dot)         │
│    - Live space pins (toggle-ON spaces only)   │
│    - Pin shows price on tap                     │
│    - Tap pin → mini preview card → "View Details"│
│                                                     │
│  LIST VIEW:                                          │
│    - Cards: photo, name, distance, price/hr, rating    │
│    - Sorted by distance (default)                        │
│                                                              │
│  FILTERS (bottom sheet):                                       │
│    - Price range                                                 │
│    - Distance radius                                               │
│    - Amenities (covered, CCTV, EV charging, security)                │
│    - Vehicle type compatibility                                        │
└─────────────────────────────────────┘
              ↓
        Tap a pin / card
              ↓
        Navigate to SPACE_DETAIL
        (see 05-space-detail-flow.md)
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Parker (any signed-in user) | Browse live spaces on a map or list, search a locality, filter, open a space |
| Owner | Sees this screen exactly as a Parker does — their own live spaces appear like anyone else's. Owning a space grants no special view |
| Admin | Nothing here. Admin suspends spaces from the desktop panel; the effect *arrives* here over Socket.IO |

> Work item `v0.3-C` is the map/list surface itself (US-1 to US-4); `v0.3-D` is filtering and
> live pin updates (US-5 to US-7). They ship in that order — filters need something to filter.

## User stories

### US-1 — See live spaces near me on a map

As a **Parker**, I can **open Search and see nearby spaces as pins on a map centred on me** so that
**I can judge distance spatially before reading any details**.

- **AC1:** Given location permission is granted, when the screen opens, then the map centres on my
  GPS position and shows a blue current-location dot.
- **AC2:** Given spaces exist within the searched area, when results load, then one pin renders per
  space and **only** for spaces whose owner toggle is ON.
- **AC3:** Given a space is toggled OFF, suspended by admin, or currently occupied by an active
  session, when results load, then it has no pin.
- **AC4:** Given the results request fails, when the screen loads, then I see an error state with
  retry — not an empty map implying no spaces exist.

### US-2 — Grant, deny, or recover from location permission

As a **Parker**, I can **be asked for location only when I open the map, and still get a usable
screen if I say no** so that **denying permission doesn't dead-end the product**.

- **AC1:** Given I have never been asked, when I open this screen for the first time, then the
  location prompt appears here — not on splash or onboarding.
- **AC2:** Given I deny permission, when the screen loads, then it falls back to my last known
  location, or to manual location entry if there is none.
- **AC3:** Given I denied earlier, when I return to this screen, then I am offered a way to enter a
  location manually and a path to app settings, and I am not re-prompted natively on every visit.

### US-3 — Switch between map and list

As a **Parker**, I can **toggle to a list of result cards** so that **I can compare price, rating
and distance side by side instead of tapping pins one at a time**.

- **AC1:** Given results are loaded, when I tap "List View", then each result renders as a card
  with photo, name, distance, price per hour and rating.
- **AC2:** Given no explicit sort is chosen, when the list renders, then it is sorted by distance
  ascending.
- **AC3:** Given I switch between Map and List, when I switch, then the same result set and the
  same active filters apply to both — the two views never disagree.
- **AC4:** Given the screen opens fresh, when it renders, then Map View is the default.

### US-4 — Preview a space and open it

As a **Parker**, I can **tap a pin to see a mini preview and go through to full detail** so that
**I can dismiss unsuitable spaces without a full screen transition each time**.

- **AC1:** Given I tap a pin, when the preview appears, then it shows the space's price and enough
  identity to recognise it, plus a "View Details" action.
- **AC2:** Given I tap "View Details" (or a list card), when navigation completes, then I am on
  Space Detail for that exact space.
- **AC3:** Given a preview is open, when I tap elsewhere on the map, then the preview dismisses
  without navigating.

### US-5 — Search a locality

As a **Parker**, I can **type an address or locality into the search bar** so that **I can look for
parking where I'm going, not only where I currently am**.

- **AC1:** Given I search a valid locality, when results return, then the map re-centres on it and
  results reload for that area.
- **AC2:** Given I search a locality, when the map re-centres, then my active filters are
  **unchanged** — search re-centres, it does not filter.
- **AC3:** Given the searched area has no live spaces, when results return, then I see the
  "No spaces found nearby" empty state with a prompt to widen the distance filter.

### US-6 — Filter results

As a **Parker**, I can **narrow results by price, distance, amenities and vehicle-type
compatibility** so that **I only see spaces my vehicle actually fits in and I can afford**.

- **AC1:** Given I open the filter sheet and apply a price range, when results reload, then no
  result has an hourly rate outside that range.
- **AC2:** Given I apply a distance radius, when results reload, then no result is farther than
  that radius from the map centre.
- **AC3:** Given I select amenities, when results reload, then every result has **all** selected
  amenities, not any of them.
- **AC4:** Given I select a vehicle type, when results reload, then every result is a space that
  accepts that type.
- **AC5:** Given filters are active, when I look at the screen, then it is visibly indicated that
  results are filtered and I can clear all filters in one action.
- **AC6:** Given filters exclude everything, when results reload, then the empty state distinguishes
  "nothing matches your filters" from "nothing exists nearby".

### US-7 — See pins appear and disappear live

As a **Parker with the map open**, I can **see availability change without pulling to refresh** so
that **I don't drive to a space that stopped being available while I was looking at it**.

- **AC1:** Given the map is open and an owner toggles a space ON within my viewport, when the
  Socket.IO event arrives, then a pin appears without a manual refresh.
- **AC2:** Given an owner toggles a space OFF, when the event arrives, then its pin is removed.
- **AC3:** Given an admin suspends a space, when the event arrives, then its pin is removed on the
  same channel and with the same latency budget as a toggle-OFF.
- **AC4:** Given a space becomes occupied by an approved booking, when the event arrives, then its
  pin is removed.
- **AC5:** Given a live update arrives for a space outside my current filters, when it is
  processed, then no pin appears — realtime updates respect active filters.
- **AC6:** Given the socket disconnects, when it reconnects, then results are re-fetched so the map
  cannot silently show a stale world.

## Business rules

- **BR-1:** **Only toggle-ON spaces appear.** `is_live = true` is the entry condition. A published
  but toggled-OFF space is invisible here — publishing is not the same as being live.
- **BR-2:** A space with `space_status = suspended` never appears, regardless of `is_live`. Admin's
  lever outranks the owner's.
- **BR-3:** A space stops appearing as bookable only when **every one of its active slots** has a
  live session — one active session per **slot** (Invariant 4, ADR-0005). A 10-slot lot with 3 cars
  in it is still bookable.
- **BR-4:** **Search re-centres; filters filter.** They are separate mechanisms and neither
  silently resets the other.
- **BR-5:** Amenity filtering is **conjunctive** (all selected must be present). A parker choosing
  "covered" and "CCTV" means both.
- **BR-6:** Location permission is requested **just-in-time on first map open**, never on splash
  or onboarding — asking upfront raises denial rates.
- **BR-7:** Prices displayed here are the space's **current** hourly rate. They are indicative
  only; nothing is frozen until Booking Confirm (Invariant 1).
- **BR-8:** No money moves on this screen and no amount is ever presented as payable.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `space` | read | `lat`, `lng`, `hourly_rate_paise`, `is_live`, `space_status_id`, `slot_count` |
| `space_photo` | read | First photo drives the list card thumbnail |
| `amenity` / `space_amenity` | read | Amenity filter |
| `space_vehicle_type` | read | Vehicle-type compatibility filter |
| `booking_session` | read | To exclude spaces with an open session |
| `rating` | read (aggregate) | Card rating — computed on read, not stored |

**Invariants this relies on:** Invariant 4 (one active session per **slot** — ADR-0005). "Occupied"
is therefore *all slots busy*, computed as `COUNT(free active slots) = 0`, not a boolean on the
space. This feature introduces no new invariants.

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Search / Map | `/(tabs)/search` | `pages/search-map.md` |
| Filters (bottom sheet) | `/(tabs)/search` (sheet) | `pages/search-filters.md` |

## Out of scope

- **Booking anything.** This screen only navigates to Space Detail.
- **Scheduling a future booking or a date/time picker.** Availability here is "live right now".
- **Saved searches, favourites, or search history.**
- **Turn-by-turn navigation to a space.** Deep-linking to a maps app is not specified here.
- **Any payment surface.** No amount is payable on this screen.
- **Owner-side visibility of who is looking.** Owners get no search analytics.
- **Ranking or promoted placement.** Sort is distance; there is no paid boosting.

## Open questions

- [ ] **Default distance radius, and the min/max of the radius filter.** Unstated and load-bearing —
      it decides the first result set every Parker ever sees.
- [ ] **Price-range filter bounds and step.** Unstated.
- [ ] Does searching a locality change the radius origin to the searched point, or keep it on the
      device? The doc says re-centre but not what "distance" is then measured from.
- [ ] Is there a result cap / pagination for a dense area, and does the map cluster pins?
- [ ] Does the "Currently occupied" state remove the pin entirely, or show it disabled? `05`
      renders occupancy in-place, which implies the space is still reachable from somewhere.
- [ ] What is the acceptable latency for a suspension to leave the map? Reactive moderation is only
      as good as its latency, but no target is stated.
- [ ] Which map provider, and does the Socket.IO subscription follow the viewport or a fixed radius?

---

## Key Behavior

| Element | Behavior |
|---|---|
| Only live spaces shown | A space only appears here if its owner has the toggle **ON** (see `08-my-space-flow.md`, `14-billing-logic.md`) |
| Real-time updates | Socket.IO pushes pin add/remove as owners toggle spaces ON/OFF while the Parker has the map open |
| Default view | Map view, centered on device GPS location (falls back to last known / manually entered location if permission denied) |
| Search | Address/locality search re-centers the map; does not filter by itself — filters are separate |
| Empty state | "No spaces found nearby" + suggestion to widen the distance filter |

---

## API Touchpoints (indicative)
- `GET /spaces/search?lat=&lng=&radius=&filters=` — initial + filtered results
- Socket.IO channel: `spaces:live-updates` — pin appears/disappears as owners toggle

---

## Related Docs
- `02-after-login-flow.md` — How the Parker reaches this screen
- `05-space-detail-flow.md` — What happens after tapping a space
- `08-my-space-flow.md` — Why some spaces don't appear (toggle OFF)
