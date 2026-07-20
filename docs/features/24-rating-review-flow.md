# Rating & Review Flow

- **Status:** agreed
- **Milestone:** `v0.4` (work item `v0.4-B`)
- **Owner:** unassigned

## Overview
`06-booking-flow.md` mentions rating happens at Session Complete, but doesn't detail the rating UI, how reviews are viewed later, or how an aggregate rating is computed and displayed. This fills that in for both directions — Parker rates Owner/space, and Owner rates Parker.

---

## Flow Diagram — Giving a Rating

```
SESSION COMPLETE (either side)
              ↓
┌─────────────────────────────────────┐
│            RATE THIS SESSION            │
├─────────────────────────────────────┤
│  Parker rates:                            │
│    - Space (1-5 stars)                        │
│    - Owner (1-5 stars)                            │
│    - Optional written review                          │
│    - Optional tags ("Clean", "Easy access",              │
│      "As described")                                        │
│                                                                   │
│  Owner rates:                                                       │
│    - Parker (1-5 stars)                                                │
│    - Optional tags ("On time", "Careful",                                 │
│      "Followed instructions")                                                │
│                                                                                   │
│  "Skip" is allowed — rating is optional,                                            │
│  not a gate to closing the session                                                     │
└─────────────────────────────────────┘
              ↓
        POST /bookings/:id/rate
```

## Flow Diagram — Viewing Ratings

```
SPACE DETAIL (Parker view)
  → "Reviews" section shows Space's aggregate rating
    + list of written reviews, most recent first

PROFILE (any user, viewed by others via Space Detail's
"Hosted by" or Booking Confirm's Parker info)
  → Aggregate rating badge, no written review list
    shown for privacy — only the number + count

BOOKING HISTORY → completed booking → BOOKING DETAIL
  → Shows the rating *you* gave, editable within
    a short window (e.g. 48 hours) after submission
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Parker | Rates the space and the owner after a completed session, optionally with a written review and tags. Reads a space's aggregate rating and reviews before booking |
| Owner | Rates the parker after a completed session, with tags. Sees their space's aggregate and reviews. Cannot delete or reply to a review |
| Admin | Moderates flagged reviews before they publish, and removes abusive ones after the fact. Never edits a rating's numeric value |

## User stories

### US-1 — Rate a space and owner after a session (Parker)

As a **Parker**, I can **rate the space and the owner when a session completes** so that **the
next person booking that driveway has something to go on**.

- **AC1:** Given a session I was the Parker on has just completed, when the Session Complete
  screen shows, then I am offered a 1–5 star rating for the space and a separate 1–5 for the owner.
- **AC2:** Given I am rating, when I submit, then an optional written review and optional tags
  ("Clean", "Easy access", "As described") are saved with it.
- **AC3:** Given I tap "Skip", when I navigate away, then the session is closed normally and no
  rating is recorded.
- **AC4:** Given I have already rated this booking, when I return to it, then I see my rating
  rather than a fresh rating form.
- **AC5:** Given the session did not complete (cancelled, or never started), when I open it, then
  no rating entry point is offered.

### US-2 — Rate a parker after a session (Owner)

As an **Owner**, I can **rate the parker after a completed session** so that **other owners know
who they're letting onto their property**.

- **AC1:** Given a session on my space has completed, when I open it, then I am offered a 1–5 star
  rating for the parker plus optional tags ("On time", "Careful", "Followed instructions").
- **AC2:** Given I skip, when I navigate away, then the session closes normally and nothing is
  recorded.
- **AC3:** Given I submit, when the parker views their own profile, then their aggregate reflects
  it — but they are not told which owner gave which score.
- **AC4:** Given the parker has not rated me, when I rate them, then my rating is saved
  independently — neither side gates the other.

### US-3 — Edit or remove a rating within the window

As a **rater**, I can **change or delete my rating for a short period after submitting** so that
**a mistap or a rating written in anger isn't permanent**.

- **AC1:** Given I submitted a rating within the edit window, when I open that booking, then I can
  change the stars, the text, and the tags.
- **AC2:** Given I submitted a rating within the edit window, when I choose to remove it, then it
  is deleted and the aggregate recomputes without it.
- **AC3:** Given the edit window has passed, when I open that booking, then the rating is shown
  read-only with an explanation that it is locked.
- **AC4:** Given I edit a rating, when it is saved, then the aggregate on the rated entity updates
  to match.

### US-4 — See a space's rating and reviews before booking

As a **Parker**, I can **see a space's aggregate rating and its written reviews on Space Detail**
so that **I can judge a listing nobody at SpotKey has vetted**.

- **AC1:** Given a space has at least the minimum number of ratings, when I open Space Detail,
  then its aggregate shows to one decimal (e.g. 4.7) with the rating count.
- **AC2:** Given a space has fewer than the minimum, when I open Space Detail, then **no rating
  badge is shown** — it reads as new/unrated rather than as a low or perfect score.
- **AC3:** Given written reviews exist, when I open the Reviews section, then they list most
  recent first.
- **AC4:** Given a review is held in admin moderation, when I view the space, then it is not shown
  and it is not counted in the aggregate.

### US-5 — See a person's rating badge

As a **user**, I can **see the other party's aggregate rating badge** so that **I can decide
whether to book with or approve them**.

- **AC1:** Given I view a profile through "Hosted by" or a booking's parker info, when it renders,
  then I see the aggregate number and count only — **no written review list**, for privacy.
- **AC2:** Given that user is below the minimum rating count, when I view them, then no badge is
  shown.
- **AC3:** Given I view my own profile, when it renders, then I see my own aggregate and count.

### US-6 — Route flagged reviews to admin moderation

As an **admin**, I can **review written content that trips the content filter before it publishes**
so that **abusive text never reaches a public listing page**.

- **AC1:** Given a submitted review contains flagged content, when it is saved, then it is held in
  a moderation queue and is not publicly visible.
- **AC2:** Given a review is held, when the admin approves it, then it publishes and its rating
  counts toward the aggregate.
- **AC3:** Given a review is held, when the admin rejects it, then the text is removed; whether
  the numeric star rating survives is an open question below.
- **AC4:** Given an admin removes an already-published review, when the removal commits, then the
  aggregate recomputes and the affected user's app reflects it over Socket.IO.

## Business rules

- **BR-1:** Rating is **two-way and optional**. Skipping never blocks closing a session — a rating
  gate would strand users mid-flow at the exact moment they most want to leave.
- **BR-2:** Ratings are **only possible on a completed session**. Cancelled and never-started
  bookings are not ratable in either direction — otherwise cancellation becomes a revenge-rating
  vector.
- **BR-3:** One rating per rater per booking per direction. A booking cannot be rated twice to
  stack the aggregate.
- **BR-4:** A rating is editable for a short window after submission, then **locked permanently**.
  The lock prevents retaliatory edit wars once each side sees what the other gave.
- **BR-5:** The aggregate is a simple average of received ratings, shown to one decimal.
- **BR-6:** A **minimum number of ratings is required before a public badge shows.** Below it, no
  badge — not a provisional one. One rating displayed as "5.0" is misinformation.
- **BR-7:** Reviews are attributable to the reviewer on a space page but **never listed on a
  personal profile** — a profile shows the number and count only.
- **BR-8:** Flagged review text goes to admin moderation **before** publishing, not after.
- **BR-9:** Ratings and reports are **the entire trust layer**. With no listing approval gate
  (ADR-0002) and no payment protection, an unratable or gameable rating system leaves nothing
  between a bad actor and a user.
- **BR-10:** Ratings carry no money. Nothing here triggers a refund, a discount, or a fee change —
  SpotKey holds no Parker→Owner money to adjust.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `rating` | new | Booking FK, rater user, subject type FK (space / owner / parker), subject id, stars 1–5, optional text, `locked_at`, `deleted_at` |
| `rating_subject_type` | new (seed) | Lookup — `space`, `owner`, `parker`. Not a `text` enum |
| `rating_tag` | new (seed) | Lookup of the selectable tags, scoped by subject type |
| `rating_tag_link` | new | Join of rating → tag |
| `rating_moderation_status` | new (seed) | Lookup — pending / published / rejected |
| `space` | changed | Denormalised aggregate + count, recomputed on write |
| `user` | changed | Denormalised aggregate + count per direction (as owner, as parker) |

**Invariants this introduces:** at most one non-deleted rating per (`booking_id`, `rater_user_id`,
`subject_type_id`); a rating may only exist for a booking whose status is completed; a denormalised
aggregate must always equal the average of published, non-deleted ratings for that subject. Record
in [`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Rate This Session | `/(app)/bookings/[id]/rate` | `pages/rate-session.md` |
| Space Reviews | `/(app)/spaces/[id]/reviews` | `pages/space-reviews.md` |
| Booking Detail (rating shown / edit) | `/(app)/bookings/[id]` | `pages/booking-detail.md` |
| Admin — review moderation queue | `/moderation/reviews` | `pages/admin-review-moderation.md` |

## Out of scope

- **Owner replies to reviews.** There is no reply thread; a disputed review goes through
  `25-issue-dispute-report-flow.md`.
- **Photo attachments on reviews.** Session photos belong to Condition Check / Exit Verification.
- **Weighted, decayed, or recency-biased aggregates.** Simple average only.
- **Automatic penalties from low ratings** — whether repeated low parker ratings restrict booking
  privileges is an unconfirmed product decision, raised below.
- **Rating a cancelled booking**, in either direction.
- **Whether a large location edit should reset a space's reviews** — the bait-and-switch hole left
  by ADR-0002 (Known Gotcha 9). Reactive suspension is the current answer.
- **Public reviewer identity beyond what Space Detail already shows.**

## Open questions

- [ ] **The edit window length is unconfirmed** — "e.g. 48 hours" is illustrative, not a decision.
- [ ] **The minimum rating count before a badge shows is unconfirmed** — "e.g. 3 sessions" is
      illustrative.
- [ ] Do repeated low parker ratings actually restrict booking privileges, and at what threshold?
      Flagged as "a product decision to confirm later" in the Key Behavior table.
- [ ] When admin rejects a review's text, does its numeric star rating still count toward the
      aggregate, or is the whole rating discarded?
- [ ] What is the content filter? "Flagged content" is asserted with no rule, vendor, or word list
      behind it.
- [ ] Are ratings visible to each side immediately, or held until both have rated (or the window
      closes)? Immediate visibility invites tit-for-tat within the edit window.
- [ ] Should a space's reviews survive a change of owner, or an owner deleting and relisting the
      same driveway?

---

## Key Behavior

| Element | Behavior |
|---|---|
| Not mandatory | Skipping rating never blocks navigating away from Session Complete |
| Aggregate calculation | Simple average across all ratings received, displayed to one decimal (e.g. 4.7); a minimum count (e.g. 3 sessions) is required before a rating badge shows publicly — prevents one bad/good rating from being misleading |
| Editable window | A submitted rating can be edited or removed within a short window; after that it's locked (prevents retaliatory edit wars) |
| Abuse handling | Reviews containing flagged content route to admin moderation (`MODERATION.md` in the admin panel) before publishing |
| Two-way | Both sides rate — Owner's rating of the Parker affects that Parker's visibility to other Owners (e.g., repeated low ratings could restrict booking privileges — a product decision to confirm later) |

---

## API Touchpoints (indicative)
- `POST /bookings/:id/rate`
- `GET /spaces/:id/reviews`
- `GET /users/:id/rating-summary`

---

## Related Docs
- `06-booking-flow.md` — Where rating is triggered from (Session Complete)
- `05-space-detail-flow.md` — Where a space's aggregate rating + reviews are shown
- `15-profile-flow.md` — Where a user's own rating badge appears
