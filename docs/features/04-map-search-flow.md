# Map / Search Flow (Parker)

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
