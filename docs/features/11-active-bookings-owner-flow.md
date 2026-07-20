# Active Bookings Flow (Owner)

- **Status:** agreed
- **Milestone:** `v0.3` (work item `v0.3-L`)
- **Owner:** unassigned

## Overview
Lets an Owner track all currently in-progress sessions across all of their spaces, from a single screen.

---

## Flow Diagram

```
MY SPACE DASHBOARD → "Active Bookings" tapped
              ↓
┌─────────────────────────────────────┐
│           ACTIVE BOOKINGS               │
├─────────────────────────────────────┤
│  List of live sessions (across all spaces):│
│    - Space name                             │
│    - Parker name + vehicle                     │
│    - Session state badge:                         │
│        Arriving / Condition Check /                  │
│        OTP Acknowledgement / OTP Display /               │
│        Active / Exit Verification Pending                   │
│    - Live running timer + running amount                        │
│    - Tap → SESSION DETAIL (owner view)                             │
└─────────────────────────────────────┘
              ↓
        Session reaches "Exit Verification Pending"
              ↓
        Navigate to EXIT_VERIFICATION
        (see 12-exit-verification-flow.md)
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Owner | Observe every in-progress session across all their spaces; open one for detail; act only when it reaches Exit Verification |
| Parker | Nothing here — they see the mirrored view of their own session (`06-booking-flow.md`) |
| Admin | Nothing on this screen. Admin sees sessions through the admin panel, not this list |

## User stories

### US-1 — See every live session across all my spaces in one list

As an **owner**, I can **see all my in-progress sessions on a single screen** so that **I don't
have to open each space separately to know what's happening**.

- **AC1:** Given I own several spaces with live sessions, when I open Active Bookings, then all of
  them appear in one list, each row labelled with its space name.
- **AC2:** Given a row is shown, when I read it, then it displays the space name, the parker's name,
  and the vehicle.
- **AC3:** Given I have no live sessions, when I open the screen, then I see an empty state.
- **AC4:** Given a session belongs to a space I do not own, when the list loads, then it is never
  returned to me.

### US-2 — Know which sub-state each session is in

As an **owner**, I can **see a state badge on each session** so that **I know whether a parker is
still arriving or already parked**.

- **AC1:** Given a session is in progress, when I view its row, then a badge shows exactly one of
  the six sub-states: Arriving, Condition Check, OTP Acknowledgement, OTP Display, Active, Exit
  Verification.
- **AC2:** Given a session changes sub-state, when the change occurs, then the badge updates without
  a manual refresh.
- **AC3:** Given a session moves to a new sub-state, when the transition is recorded, then a
  `session_state_event` row captures `from`, `to`, and `at`.

### US-3 — Watch the timer and the running amount update live

As an **owner**, I can **see the elapsed time and the amount accruing in real time** so that **I
know what the session is worth before it ends**.

- **AC1:** Given a session is `active`, when I watch its row, then the timer advances and the
  running amount updates over `owner:{id}:active-sessions`.
- **AC2:** Given the running amount is shown, when it is computed, then it is derived from elapsed
  duration × the booking's `locked_hourly_rate_paise` — never from the space's current rate.
- **AC3:** Given the running amount is displayed, when it renders, then it comes from integer paise
  formatted for display, never a float.
- **AC4:** Given the running amount is shown to me, when the parker views their own screen, then
  they see the same figure.
- **AC5:** Given the running figure is displayed, when I read it, then it is clearly a running
  total, not a final amount — the final amount is fixed only at Exit Verification.

### US-4 — Open a session for detail

As an **owner**, I can **tap a session to see its detail** so that **I can check the specifics of
one booking without losing the overview**.

- **AC1:** Given a session row, when I tap it, then I land on the owner Session Detail view for that
  booking.
- **AC2:** Given I am on Session Detail, when the session changes state, then the detail view
  reflects it live, same as the list.
- **AC3:** Given a session is not yet at Exit Verification, when I view its detail, then no
  end-session or amount-editing control is offered.

### US-5 — Be taken to Exit Verification when a session ends

As an **owner**, I can **be notified and routed when a session reaches Exit Verification Pending**
so that **the parker isn't left waiting to leave**.

- **AC1:** Given a parker marks themselves as leaving, when the session enters
  `exit_verification_pending`, then I receive a push notification.
- **AC2:** Given I tap that notification, when the app opens, then I land on Exit Verification for
  that session, not on Home.
- **AC3:** Given a session is in `exit_verification_pending`, when I view the list, then its row is
  visually distinguished as the one needing action.

### US-6 — Keep a session running when I toggle its space off

As an **owner**, I can **toggle a space OFF without disturbing anyone currently parked** so that
**closing for new bookings never strands an existing parker**.

- **AC1:** Given a space has an in-progress session, when I toggle that space OFF, then the session
  stays in this list and continues normally.
- **AC2:** Given the space is OFF, when the session reaches Exit Verification, then it completes as
  usual.
- **AC3:** Given the session completes, when it ends, then the space does not return to search
  while the toggle remains OFF.

## Business rules

- **BR-1:** This list is **cross-space, not per-space**. An owner's mental model is "what is
  happening right now", not "what is happening at space #3".
- **BR-2:** A session has exactly **six sub-states** — Arriving, Condition Check, OTP
  Acknowledgement, OTP Display, Active, Exit Verification — and is in exactly one at a time. They
  live in the `session_state` lookup table, never a `text` enum.
- **BR-3:** Every sub-state transition is appended to `session_state_event`. This log is the
  evidence behind any later dispute, so it is append-only.
- **BR-4:** The running amount is always computed from the booking's **locked** rate (Invariant 1).
  A mid-session rate edit on the space must not move the number.
- **BR-5:** The owner takes **no action mid-session**. The only required action in this flow is at
  Exit Verification. Nothing here ends a session early on the owner's behalf.
- **BR-6:** Toggling a space OFF **never** interrupts an in-progress session. It only stops new
  requests.
- **BR-7:** Owner and parker must see the **same** timer and running amount. A divergence between
  the two screens is a defect, not a display nuance.
- **BR-8:** At most **one active session per space** (Invariant 4) — so a space appears at most once
  in this list.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `booking_session` | read; `session_state_id` changes | 1:1 with an approved booking; `ended_at IS NULL` is what makes it "active" |
| `session_state` | existing lookup | The six sub-states |
| `session_state_event` | new rows | Append-only transition log driving the badge history |
| `booking` | read | `locked_hourly_rate_paise` feeds the running amount |
| `space` | read | Space name for the row label |
| `notification` | new row | Exit-verification-pending push, deep-linked to the session |

**Invariants this flow relies on:** Invariant 4 (one active session per space) and Invariant 1
(locked rate). Recorded in [`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Active Bookings | `/(owner)/active-bookings` | `pages/active-bookings.md` |
| Session Detail (owner view) | `/(owner)/session/[id]` | `pages/session-detail-owner.md` |

## Out of scope

- **Exit verification and the final amount** — `12-exit-verification-flow.md`.
- **The parker's mirrored session view** — `06-booking-flow.md`.
- **Approving or rejecting requests** — `10-booking-requests-flow.md`.
- **Completed sessions and history** — this screen shows live sessions only.
- **Any payment or QR display.** Nothing financial happens here.
- **Ending a session from the owner's side without the exit flow.** There is no such control.
- **Ratings** — `24-rating-review-flow.md`, after completion.

## Open questions

- [ ] Can an owner cancel or force-end a session mid-flow (parker never showed, vehicle wrong)? No
      spec covers it, and the escape hatch today is an issue report.
- [ ] What does the owner see if the parker's device goes offline mid-session — does the timer keep
      running on the server regardless?
- [ ] Does the running amount round up to a billing increment, or accrue continuously? This changes
      what the owner sees versus the eventual final amount.
- [ ] Is there a per-row action to report an issue from this screen, or must the owner go via
      `25-issue-dispute-report-flow.md`?
- [ ] Should sessions be ordered by state urgency (exit-pending first) or by start time?

---

## Key Behavior

| Element | Behavior |
|---|---|
| Multi-space view | A single owner with several live spaces sees every active session in one list, not per-space |
| Live sync | Timer and running amount update in real time via Socket.IO — mirrors what the Parker sees on their side |
| No action needed mid-session | Owner mostly observes here; the only required action is at Exit Verification |

---

## API Touchpoints (indicative)
- `GET /bookings/owner/active`
- Socket.IO channel: `owner:{id}:active-sessions`

---

## Related Docs
- `10-booking-requests-flow.md` — How a booking becomes "active"
- `12-exit-verification-flow.md` — What happens when the session ends
- `06-booking-flow.md` — The Parker's mirrored view of the same session
