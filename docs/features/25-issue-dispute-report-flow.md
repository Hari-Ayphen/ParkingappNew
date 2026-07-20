# In-Session Issue / Dispute Reporting Flow

- **Status:** agreed
- **Milestone:** `v0.4` (work item `v0.4-E`)
- **Owner:** unassigned

## Overview
`17-support-flow.md` covers general help tickets. This covers the more urgent, session-specific case: reporting a problem **while a booking is active or immediately after** — wrong vehicle at the space, safety concern, space not matching its listing, damage dispute, etc.

---

## Flow Diagram

```
ACTIVE SESSION or SESSION COMPLETE / EXIT VERIFICATION
  → "Report an Issue" (always visible, not buried in a menu)
              ↓
┌─────────────────────────────────────┐
│           REPORT AN ISSUE               │
├─────────────────────────────────────┤
│  Category (required):                     │
│    - Safety concern (urgent)                  │
│    - Space not as described                       │
│    - Damage / condition dispute                        │
│    - Wrong vehicle / unauthorized parking                   │
│    - Amount dispute                                             │
│    - Other                                                          │
│  Description                                                            │
│  Photo attachment (pulls from Condition                                     │
│    Check / Exit Verification photos already                                    │
│    taken, or new upload)                                                          │
│  Submit                                                                              │
└─────────────────────────────────────┘
              ↓
┌───────────────────────────────────────┐
│   IS THIS FLAGGED "SAFETY CONCERN"?      │
└───────────────────────────────────────┘
      YES                         NO
       ↓                           ↓
Routed to admin            Routed to admin
MODERATION queue,           MODERATION/BOOKINGS
priority/urgent lane          queue, standard lane
(see admin MODERATION.md)     (see admin BOOKINGS.md)
       ↓                           ↓
┌─────────────────────────────────────┐
│           TICKET STATUS                 │
│  Same thread view as 17-support-flow.md,   │
│  but linked directly to the booking id        │
└─────────────────────────────────────┘
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Parker | Reports an issue during or right after a session on a booking they are party to; follows the ticket thread |
| Owner | The same, from their side of the same booking — including wrong-vehicle and damage reports |
| Admin | Works the queues, mediates, adjusts a disputed amount on the record, suspends a space or restricts an account, and replies on the thread |

## User stories

### US-1 — Report an issue during or right after a session

As a **user in a session**, I can **report a problem from a button that's always on screen** so
that **I'm not hunting through a support menu while something is going wrong in front of me**.

- **AC1:** Given I am on the Active Session, Session Complete, or Exit Verification screen, when
  it renders, then "Report an Issue" is directly visible, not behind a menu.
- **AC2:** Given I open the form, when it renders, then a category is required and I can add a
  description.
- **AC3:** Given I submit without a category, when I tap Submit, then it is blocked with an inline
  error and nothing is sent.
- **AC4:** Given I submit successfully, when it commits, then a ticket exists linked to that
  booking id and I land on its thread.
- **AC5:** Given I am not a party to the booking, when a report is submitted against it, then it
  is refused.

### US-2 — Attach evidence without re-uploading it

As a **reporter**, I can **attach photos already taken during Condition Check or Exit Verification**
so that **I don't have to re-photograph a car that has already left**.

- **AC1:** Given photos exist on the booking, when I open the attachment picker, then they are
  listed for selection.
- **AC2:** Given I want to add something new, when I choose to upload, then the camera permission
  is requested just-in-time and a new photo can be attached.
- **AC3:** Given I submit, when the ticket is created, then it automatically carries the booking
  id, both parties' info, and the session timestamps — I never re-explain which session this is.

### US-3 — Get safety reports into a faster lane

As a **user with a safety concern**, I can **have my report reach an admin faster than a routine
dispute** so that **an unsafe space or person is dealt with while it still matters**.

- **AC1:** Given I select "Safety concern", when I submit, then the ticket enters the urgent
  moderation lane, visibly distinct from the standard queue.
- **AC2:** Given I select any other category, when I submit, then it enters the standard
  moderation/bookings lane.
- **AC3:** Given a safety report is created, when it lands, then admin is alerted immediately
  rather than on next queue refresh.
- **AC4:** Given a safety report exists against a space, when an admin suspends that space, then
  it leaves the map over Socket.IO at once and the owner receives the always-on suspension notice.

### US-4 — Dispute an amount with no transaction to check

As a **user**, I can **dispute the final amount on a session** so that **the record is corrected
even though SpotKey never handled the money**.

- **AC1:** Given a completed session, when I raise an "Amount dispute", then it references the
  system-calculated final amount from `12-exit-verification-flow.md`.
- **AC2:** Given an amount dispute is open, when the admin resolves it by adjusting the amount,
  then both sides' records update in place over Socket.IO and the change is attributed to that
  admin.
- **AC3:** Given the resolution completes, when I look at my booking, then it still shows an
  amount **due** — no refund is issued, because SpotKey charged nothing to refund.
- **AC4:** Given the dispute is "he never paid me", when the admin opens it, then there is **no
  transaction record to check** and the ticket is worked as human mediation between the two
  parties' accounts of events.

### US-5 — Follow the ticket to resolution

As a **reporter**, I can **see my ticket's status and the admin's replies in a thread** so that
**I know something is happening**.

- **AC1:** Given I have an open ticket, when I open it, then I see its current status, my original
  report, and every reply in order.
- **AC2:** Given the admin replies, when the reply is posted, then I receive a push and in-app
  notification that deep-links to that thread.
- **AC3:** Given a ticket is resolved, when I open it, then the resolution and any amount
  adjustment are stated on the thread, not just a status change.
- **AC4:** Given I open the linked booking, when it renders, then the ticket is reachable from it.

### US-6 — Keep reporting from blocking the session

As a **user**, I can **finish my session normally after reporting** so that **filing a report never
traps me or my car**.

- **AC1:** Given I have an open report, when the session proceeds, then Exit Verification and
  Session Complete work exactly as they would without it.
- **AC2:** Given I have an open report, when the session completes, then rating is still offered
  and still optional.
- **AC3:** Given the session completes, when I check my ticket, then it remains open — completion
  does not close it.

## Business rules

- **BR-1:** Reporting **never blocks session completion**. It opens a parallel resolution track.
  A report that could hold a session hostage would be weaponised immediately.
- **BR-2:** **Safety reports get a faster admin lane** than routine disputes. With no listing
  approval gate (ADR-0002), admin takedown after the fact is the only safety mechanism this
  product has — its latency is the whole margin.
- **BR-3:** **An amount dispute cannot produce a refund.** SpotKey holds no Parker→Owner money.
  Admin mediation corrects the **record**, nothing else.
- **BR-4:** **A "he never paid me" ticket has no transaction record to check** and must route to
  human admin mediation. There is no automated verification, ever — the app never learns whether
  money moved.
- **BR-5:** Session context (booking id, both parties, existing photos, timestamps) is attached
  automatically. Making the user restate it costs time in exactly the cases where time matters.
- **BR-6:** Only a party to the booking may report on it.
- **BR-7:** Admin's resolution levers are: adjust the recorded amount, suspend a space, restrict an
  account, and reply. Suspension and restriction notices are **always sent** and cannot be muted.
- **BR-8:** Any admin mutation resulting from a ticket reaches mobile **instantly over Socket.IO**,
  not on next app open.
- **BR-9:** This flow is for session-linked problems. Non-session issues go to `17-support-flow.md`.
- **BR-10:** An adjusted amount keeps an audit trail — the original figure, the new one, the admin,
  and the ticket. Silent rewriting of a financial record is not acceptable even when no money moved.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `ticket` | changed | Gains a nullable `booking_id`, a lane/priority FK, and a category FK. Shares the thread model with `17-support-flow.md` |
| `ticket_category` | new (seed) | Lookup — safety concern, not-as-described, damage, wrong vehicle, amount dispute, other |
| `ticket_lane` | new (seed) | Lookup — urgent / standard. Drives queue routing |
| `ticket_status` | existing (seed) | Lookup, shared with general support |
| `ticket_message` | existing | Thread replies, author user or admin |
| `ticket_attachment` | new | Links a ticket to an existing session photo or a newly uploaded one |
| `session` | changed | Amount adjustment needs `adjusted_amount_paise`, `adjusted_by_admin_id`, `adjustment_ticket_id` — original amount preserved |

**Invariants this introduces:** a ticket with `booking_id` set must have a reporter who is a party
to that booking; the safety category always maps to the urgent lane; an adjusted amount never
overwrites the original — both are retained. Record in
[`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Report an Issue | `/(app)/bookings/[id]/report` | `pages/report-issue.md` |
| Ticket Thread | `/(app)/support/tickets/[id]` | `pages/ticket-thread.md` |
| Admin — moderation queue (urgent + standard) | `/moderation/tickets` | `pages/admin-moderation-queue.md` |
| Admin — booking detail / amount adjustment | `/bookings/[id]` | `pages/admin-booking-detail.md` |

## Out of scope

- **Refunds, chargebacks, escrow, or any money movement.** There is none to move.
- **Automated verification that a payment happened.** Impossible by design.
- **General, non-session support.** `17-support-flow.md`.
- **Ratings as a complaint channel.** A bad rating is not a report; `24-rating-review-flow.md`.
- **Emergency services integration.** "Safety concern" routes to SpotKey admin, not to police.
- **The admin panel's own screens and workflows** — those need `MODERATION.md` and `BOOKINGS.md`,
  which do not exist yet (Known Gotcha 4).
- **Insurance, liability adjudication, or damage compensation.** Admin mediates a record; it does
  not award damages.
- **Reporting a user outside the context of a booking.**

## Open questions

- [ ] **What is the SLA on the urgent lane?** "Faster" is stated with no target. Without a number,
      the only safety mechanism the product has is unmeasurable *(compounds Known Gotcha 4)*.
- [ ] Who staffs the urgent lane out of hours? A safety report at 2am has no defined path.
- [ ] Can an amount be adjusted upward as well as downward, and does either side get to contest
      the adjustment?
- [ ] How long after a session completes can a report still be filed? "Immediately after" is not a
      window.
- [ ] Does an open safety report against a space automatically hide it from the map pending review,
      or does it stay bookable until an admin acts? This is the difference between reactive and
      precautionary moderation.
- [ ] Is the reported party told a report exists against them, and when?
- [ ] Does a resolved amount adjustment regenerate the Parker's downloaded receipt
      (`07-booking-history-flow.md`)?

---

## Key Behavior

| Element | Behavior |
|---|---|
| Always accessible | Unlike general support (menu-driven), this is a visible button during and right after an active session — urgency matters here |
| Safety priority lane | "Safety concern" reports get routed to a faster admin queue than a routine amount dispute |
| Session context auto-attached | The report automatically carries the booking id, both parties' info, and any Condition Check / Exit Verification photos already on file — the user doesn't have to re-explain what session this is about |
| Amount disputes | These specifically reference the system-calculated final amount from `12-exit-verification-flow.md` — since SpotKey doesn't process the actual payment, admin mediation here is about correcting the record/amount shown, not issuing an in-app refund |
| Does not block session completion | Reporting an issue does not prevent the session from completing normally — it opens a parallel resolution track |

---

## API Touchpoints (indicative)
- `POST /bookings/:id/report-issue`
- `GET /bookings/:id/issue-status`

---

## Related Docs
- `17-support-flow.md` — General (non-session-specific) support
- `06-booking-flow.md`, `12-exit-verification-flow.md` — Where the "Report an Issue" entry point lives
