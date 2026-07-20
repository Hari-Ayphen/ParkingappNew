# Space Detail Flow (Parker)

- **Status:** agreed
- **Milestone:** `v0.3` (work item `v0.3-E`)
- **Owner:** unassigned

## Overview
Shown when a Parker taps a space from the Map/Search screen. Gives full information about the space before booking.

---

## Flow Diagram

```
MAP/SEARCH → Tap a space
              ↓
┌─────────────────────────────────────┐
│            SPACE DETAIL                │
├─────────────────────────────────────┤
│  - Photo carousel                        │
│  - Space name / address                    │
│  - Hourly rate                                │
│  - Amenities list (icons)                       │
│  - Owner name + rating (from past sessions)       │
│  - Parker reviews (list, most recent first)         │
│  - Map preview (mini, non-interactive)                │
│  - Live availability indicator                          │
│    ("Available now" / "Currently occupied")                │
│  - "Book Now" button (disabled if occupied)                  │
└─────────────────────────────────────┘
              ↓
        Tap "Book Now"
              ↓
        Navigate to BOOKING_CONFIRM
        (see 06-booking-flow.md)
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Parker (any signed-in user) | View full space detail, read reviews, start a booking request |
| Owner of this space | Sees the same page. Nothing here lets them edit — editing lives in `22-edit-space-flow.md` |
| Admin | Nothing here. An admin suspension arrives over Socket.IO and disables Book Now in place |

## User stories

### US-1 — See everything about a space before committing

As a **Parker**, I can **see a space's photos, address, hourly rate and amenities on one screen**
so that **I can decide whether it's worth requesting before I involve the owner**.

- **AC1:** Given I arrive from the map or list, when the screen loads, then it shows the photo
  carousel, name, address, hourly rate and amenity icons for that exact space.
- **AC2:** Given the space has multiple photos, when I swipe the carousel, then I can reach every
  photo on the listing.
- **AC3:** Given the space detail request fails, when the screen loads, then I see an error state
  with retry — never a half-rendered page with blank fields.
- **AC4:** Given the space no longer exists or was removed, when I open it from a stale pin, then I
  see a clear "no longer available" state rather than an error.

### US-2 — Judge the owner and the space by past sessions

As a **Parker**, I can **see the owner's rating and read reviews other Parkers left** so that
**nothing has been vetted up front, but I can still assess risk myself**.

- **AC1:** Given past rated sessions exist, when the screen loads, then the owner's average rating
  is shown alongside their name.
- **AC2:** Given reviews exist, when the reviews list renders, then it is ordered most recent
  first.
- **AC3:** Given no session has ever been rated, when the screen loads, then the rating area shows
  a "no ratings yet" state and not a zero or a misleading default.
- **AC4:** Given many reviews exist, when I reach the end of what's rendered, then I can load more
  without leaving the screen.

### US-3 — See where the space actually is

As a **Parker**, I can **see a mini map preview of the space's location** so that **I can confirm
it's the entrance I think it is before requesting**.

- **AC1:** Given the space has coordinates, when the screen loads, then a mini map preview shows
  its position.
- **AC2:** Given I interact with the mini map, when I tap or drag it, then it does not pan or zoom —
  it is a preview, not a second map surface.

### US-4 — Know right now whether I can book it

As a **Parker**, I can **see a live availability indicator and a Book Now button whose state
matches it** so that **I never start a request for a space that is already taken**.

- **AC1:** Given the space has no active session, is toggled ON and is not suspended, when the
  screen loads, then availability reads "Available now" and Book Now is enabled.
- **AC2:** Given **every active slot** on the space has a live session, when the screen loads, then
  availability reads "Currently occupied" and Book Now is disabled.
- **AC2b:** Given a multi-slot space with at least one free slot, when the screen loads, then
  availability shows how many remain (e.g. "3 of 10 free") and Book Now stays enabled.
- **AC3:** Given Book Now is disabled, when I look at it, then an inline reason states *why* —
  occupied, toggled off, or suspended — and the three are distinguishable.
- **AC4:** Given Book Now is enabled, when I tap it, then I navigate to Booking Confirm for this
  space.

### US-5 — Have the page correct itself while I'm reading it

As a **Parker lingering on this screen**, I can **have availability update in place** so that
**I don't tap Book Now on a space someone else took thirty seconds ago**.

- **AC1:** Given another Parker's booking becomes active for this space, when the Socket.IO event
  arrives, then availability flips to "Currently occupied" and Book Now disables without a
  refresh.
- **AC2:** Given that session completes, when the event arrives, then availability returns to
  "Available now" and Book Now re-enables.
- **AC3:** Given the owner toggles the space OFF while I'm viewing, when the event arrives, then
  Book Now disables with the toggled-off reason.
- **AC4:** Given an admin suspends the space while I'm viewing, when the event arrives, then Book
  Now disables mid-view with the suspended reason.
- **AC5:** Given the socket reconnects after a drop, when it reconnects, then availability is
  re-fetched rather than trusted from before the drop.

## Business rules

- **BR-1:** The hourly rate shown here is **indicative**. Nothing is frozen until Booking Confirm —
  see Invariant 1. This screen must never present the rate as a locked or agreed price.
- **BR-2:** **No amount payable is ever shown here.** There is no total, no deposit and no Pay
  action anywhere on this screen.
- **BR-3:** Book Now starts a **request**, not a booking. Reaching Booking Confirm guarantees
  nothing about the owner approving.
- **BR-4:** Book Now is disabled when the space is occupied, toggled OFF, or admin-suspended — and
  the reason is always surfaced, never a silently dead button.
- **BR-5:** "Currently occupied" derives from Invariant 4 — one active session per **slot**
  (ADR-0005). A space is occupied only when **every active slot** is busy. It is a fact computed
  from the session table, not a field an owner sets.
- **BR-6:** Ratings are **computed from past sessions' rating rows**, not a stored average.
- **BR-7:** Nothing on this listing has been vetted before publication. Trust is reactive —
  ratings, in-session issue reports and admin takedown after the fact.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `space` | read | Name, address, `lat`/`lng`, `hourly_rate_paise`, `is_live`, `space_status_id` |
| `space_photo` | read | Carousel, in stored order |
| `amenity` / `space_amenity` | read | Amenity icon list |
| `space_vehicle_type` | read | Which vehicle types are accepted |
| `booking_session` | read | Drives "Currently occupied" |
| `rating` / `rating_tag` | read | Owner and space rating, review list |
| `user` | read | Owner display name and photo only — never their phone or UPI ID |

**Invariants this relies on:** Invariant 4 (one active session per **slot** — ADR-0005).
Availability is a count of free active slots, not a boolean. This feature introduces no new
invariants.

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Space Detail | `/spaces/[id]` | `pages/space-detail.md` |
| Reviews (full list) | `/spaces/[id]/reviews` | `pages/space-reviews.md` |

## Out of scope

- **Confirming a booking.** This screen only navigates to Booking Confirm.
- **Any payment surface.** No amount, no QR, no Pay button — payment display belongs only to
  Session Complete.
- **Messaging the owner** before a booking exists.
- **Editing the space.** Owner edits live in `22-edit-space-flow.md`.
- **Leaving a review from here.** Reviews are written after a session, in `24-rating-review-flow.md`.
- **Reporting the space from here.** Issue reports are session-scoped
  (`25-issue-dispute-report-flow.md`).
- **Favouriting or sharing a space.**
- **Showing the owner's contact details or UPI ID** before a session exists.

## Open questions

- [ ] **Is "Currently occupied" reachable at all from the map**, given `04` removes occupied pins?
      Either this state is only reachable via a stale pin or a direct link, or `04` should keep the
      pin. The two docs imply different things.
- [ ] Are reviews paginated, and what page size? US-2 AC4 assumes "load more" exists.
- [ ] Is the rating shown the **owner's** across all their spaces, or **this space's**? The doc
      says "owner name + rating" and also "Parker reviews", without saying which aggregate.
- [ ] Are `space_availability_rule` day/hour hints surfaced on this screen? They are a display hint
      elsewhere and this doc doesn't mention them.
- [x] ~~Does the page show slot count or remaining slots?~~ **Resolved 2026-07-20 (ADR-0005):**
      remaining slots. Invariant 4 is now one active session per *slot*, so the page shows free
      slots ("3 of 10 free") and reads "Currently occupied" only when all are busy.
- [ ] Can a Parker open their **own** space here, and should Book Now be blocked if so?

---

## Key Behavior

| Element | Behavior |
|---|---|
| Live availability | Updated via Socket.IO — if another Parker books first, this screen updates in real time to "Currently occupied" |
| Rating | Average of past session ratings left by other Parkers (see `07-booking-history-flow.md`) |
| Booking disabled | If space is occupied, toggled OFF while viewing, or **suspended by admin**, "Book Now" disables with an inline reason. Admin suspension arrives over Socket.IO and disables the button in place, mid-view (see `08-my-space-flow.md` — Admin Sync) |

---

## API Touchpoints (indicative)
- `GET /spaces/:id` — full space detail
- `GET /spaces/:id/reviews` — reviews list
- Socket.IO channel: `space:{id}:availability` — live occupancy state

---

## Related Docs
- `04-map-search-flow.md` — Where the Parker comes from
- `06-booking-flow.md` — What happens after "Book Now"
