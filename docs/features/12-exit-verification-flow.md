# Exit Verification Flow (Owner)

- **Status:** agreed
- **Milestone:** `v0.3` (work items `v0.3-I` and `v0.3-J`)
- **Owner:** unassigned

## Overview
The final step of a session from the Owner's side — confirming the Parker has left, the space condition is fine, and finalizing the amount before payment.

---

## Flow Diagram

```
ACTIVE BOOKINGS → Session reaches "Exit Verification Pending"
  (or push notification when Parker marks themselves as leaving)
              ↓
┌─────────────────────────────────────┐
│          EXIT VERIFICATION              │
├─────────────────────────────────────┤
│  - Session summary (start time, duration)   │
│  - Final amount (auto-calculated from          │
│    duration × hourly rate)                        │
│  - Space condition photo (owner takes one)            │
│  - "Confirm Exit" button                                  │
└─────────────────────────────────────┘
              ↓
        Owner taps Confirm Exit
              ↓
┌─────────────────────────────────────┐
│      PAYMENT (Owner's side)             │
├─────────────────────────────────────┤
│  - QR code shown (generated from Owner's   │
│    UPI ID, captured at profile completion)     │
│  - Parker scans this QR to pay directly           │
│  - No in-app payment confirmation — this is        │
│    purely a display, not a tracked transaction        │
└─────────────────────────────────────┘
              ↓
        Session marked COMPLETE
              ↓
        Moves to Booking History (both sides)
        Space becomes available again
        (still live if toggle remains ON)
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Owner | Review the calculated summary, take a condition photo, confirm exit, and show their UPI QR. **Cannot set or change the amount** |
| Parker | Sees the mirrored Session Complete screen and the same QR (`06-booking-flow.md`); may dispute the amount |
| Admin | Not present in the flow. Handles disputes after the fact, with corrections attributed via `admin_action` |

## User stories

### US-1 — Review the session summary and the calculated amount

As an **owner**, I can **see the session's start time, duration, and system-calculated final
amount** so that **I know what to expect before I confirm the exit**.

- **AC1:** Given a session in `exit_verification_pending`, when I open Exit Verification, then I see
  the start time, the elapsed duration, and the final amount.
- **AC2:** Given the amount is displayed, when it is computed, then it equals duration ×
  `booking.locked_hourly_rate_paise` — the rate locked at approval, not the space's current rate.
- **AC3:** Given the amount is shown, when I inspect the screen, then **there is no editable amount
  field and no override control anywhere on it** (Invariant 2).
- **AC4:** Given the amount is stored, when it is written, then it is integer paise in
  `final_amount_paise`, never a float.
- **AC5:** Given the owner edited the space's hourly rate during the session, when the amount is
  calculated, then the figure is unaffected (Invariant 1).

### US-2 — Record the space's condition at exit

As an **owner**, I can **take a photo of the space as the parker leaves** so that **there is
evidence if damage is claimed later**.

- **AC1:** Given I am on Exit Verification, when I tap the photo control, then the camera permission
  is requested just-in-time if not already granted.
- **AC2:** Given I take a photo, when it uploads, then it is stored as a `session_photo` tagged as
  an exit-verification photo, distinguishable from condition-check photos.
- **AC3:** Given I deny the camera permission, when I continue, then I am told what I lose and am
  not hard-blocked from confirming exit.
- **AC4:** Given the upload fails, when I retry, then no duplicate photo row is created for the
  successful attempt.

### US-3 — Confirm the exit and complete the session

As an **owner**, I can **confirm the parker has left** so that **the session closes and my space is
free again**.

- **AC1:** Given I tap Confirm Exit, when the call succeeds, then `POST /bookings/:id/verify-exit`
  is sent with **no amount field in the request body** (Invariant 2).
- **AC2:** Given the exit is confirmed, when it is processed, then `booking_session.ended_at` is set
  and the booking status becomes `completed`.
- **AC3:** Given `ended_at` is set, when a new booking is requested for that space, then it may be
  approved — the one-active-session constraint no longer blocks it (Invariant 4).
- **AC4:** Given the session completes, when the transition is recorded, then a
  `session_state_event` row captures it.
- **AC5:** Given the session completes, when both sides look, then it appears in Booking History for
  owner and parker alike.
- **AC6:** Given the space's toggle is still ON, when the session completes, then the space returns
  to search; if the toggle was turned OFF mid-session, it does not.
- **AC7:** Given the confirm call is retried after a network failure, when it lands twice, then the
  session is completed once — the endpoint is idempotent.

### US-4 — Show my UPI QR so the parker can pay me directly

As an **owner**, I can **display my UPI QR code after confirming exit** so that **the parker can pay
me without SpotKey touching the money**.

- **AC1:** Given I have confirmed exit, when the payment screen appears, then a QR code generated
  from the UPI ID I gave at Profile Completion is displayed.
- **AC2:** Given the QR is generated, when it is produced, then it is generated **once per owner**,
  not per session — the same QR appears for every session.
- **AC3:** Given the QR is shown, when the parker views their Session Complete screen, then they see
  the identical QR.
- **AC4:** Given the QR is displayed, when I look at the screen, then there is **no "mark as paid",
  no payment status, and no amount confirmation** — it is a display only.
- **AC5:** Given the parker pays in cash instead, when I move on, then the session is already
  complete and nothing in the app needed to change. Cash is an equally valid path.
- **AC6:** Given I have not set a UPI ID, when I reach this screen, then I am told how to add one
  and the session still completes.

### US-5 — Route a disputed amount to admin

As an **owner or parker**, I can **raise a dispute about the amount** so that **a human can
adjudicate, since neither of us can change the number ourselves**.

- **AC1:** Given a completed session, when either side disputes the amount, then an `issue_report`
  or support ticket is created against that booking and routed to admin.
- **AC2:** Given a dispute is raised, when I look for a way to fix it myself, then no in-app
  amount-editing control exists for either party.
- **AC3:** Given an admin corrects an amount, when the correction is applied, then an `admin_action`
  row records the admin, the target booking, the reason, and the time.
- **AC4:** Given an admin correction is applied, when it propagates, then both sides see the updated
  figure without re-login, over Socket.IO.

## Business rules

- **BR-1:** **The final amount is system-calculated and cannot be overridden.** It is duration ×
  `locked_hourly_rate_paise`. This is deliberate — an editable amount at the point of handover turns
  every session into a negotiation and every disagreement into a dispute (Invariant 2).
- **BR-2:** **No API field accepts an amount.** The exit DTO has no amount property. This is the
  enforcement mechanism for BR-1, not a UI convention.
- **BR-3:** The rate used is the one **locked at approval**, never the space's current rate
  (Invariant 1).
- **BR-4:** The QR is generated from the owner's UPI ID captured at Profile Completion, **once per
  owner**, not per session. It encodes no amount and no session reference.
- **BR-5:** **SpotKey never learns whether payment happened.** There is no confirmation step, no
  status, and no transaction record. The app has no opinion and no visibility.
- **BR-6:** **Cash is an equally valid payment path.** The QR is a convenience, not the mechanism.
  Nothing in the flow assumes UPI was used.
- **BR-7:** Completing a session sets `ended_at`, which is what releases the space under Invariant
  4. Until then the space cannot take another booking.
- **BR-8:** Disputes route to **admin mediation**. Any admin correction must be attributable through
  `admin_action` — an unattributed change to a money column is indistinguishable from tampering.
- **BR-9:** A space toggled OFF mid-session still completes its session normally; the toggle only
  governs whether it returns to search afterwards.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `booking` | changed | `final_amount_paise` written by the **server**; status → `completed` |
| `booking_session` | changed | `session_state_id` → exit verification, then `ended_at` set |
| `session_state_event` | new rows | Append-only transitions into exit verification and completion |
| `session_photo` | new row | Exit-verification photo, tagged distinctly from condition-check |
| `user` | read | `upi_id` — the source of the QR |
| `issue_report` / `support_ticket` | new row (dispute path only) | Scoped to the booking |
| `admin_action` | new row (correction path only) | Attribution for any admin amount change |

**Invariants this flow depends on:** Invariant 2 (amount calculated, never entered) and Invariant 4
(one active session per **slot**, released by `ended_at` — which frees that slot for rebooking, not
the whole space). Both in
[`../architecture/data.md`](../architecture/data.md).

> There is **no transaction, payment, or receipt table.** Adding one would imply SpotKey knows
> whether money moved. It does not, and must not claim to.

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Exit Verification | `/(owner)/session/[id]/exit` | `pages/exit-verification.md` |
| Payment (owner QR display) | `/(owner)/session/[id]/payment` | `pages/owner-payment-qr.md` |

## Out of scope

- **Any in-app payment.** No gateway, no checkout, no wallet, no "Pay" button, no payment status.
  Razorpay is for the owner's platform-fee mandate only (`23-upi-autopay-mandate-flow.md`).
- **Confirming or recording that payment happened.** Deliberately absent.
- **Refunds, chargebacks, or partial payments.** SpotKey holds no money and can reverse nothing.
- **Manual amount entry or owner discounts.** Explicitly forbidden by Invariant 2.
- **The parker's Session Complete screen** — `06-booking-flow.md`.
- **Ratings** — `24-rating-review-flow.md`, after this flow.
- **The admin dispute console.** Referenced as `BOOKINGS.md` but unwritten (Known Gotcha 4).
- **The owner's 7-day platform-fee invoice** — `14-billing-logic.md`. Unrelated money.

## Open questions

- [ ] **How is duration rounded into the final amount?** Per minute, per 15 minutes, or a full-hour
      minimum? Undefined, and it changes every figure the app prints.
- [ ] Is there a minimum billable duration for a session that ends within minutes of starting?
- [ ] Is the exit photo mandatory or optional? The flow shows it, but no rule says confirm is
      blocked without it.
- [ ] What happens if the owner never confirms exit — does the session auto-complete after a
      timeout, and at what amount?
- [ ] Can the parker trigger exit verification alone if the owner is unreachable?
- [ ] Where exactly does the dispute entry point live — this screen, booking history, or only
      `25-issue-dispute-report-flow.md`?
- [ ] Does the UPI QR encode the amount, or is it a bare payee QR? Encoding the amount would
      contradict "generated once per owner, not per session".
- [ ] What is the owner shown when their `upi_id` is missing at this point?

---

## Key Behavior

| Element | Behavior |
|---|---|
| Amount is calculated, not entered | Final amount is system-calculated from duration × rate — the owner cannot manually override it (prevents disputes) |
| QR code | Same QR shown here and on the Parker's Session Complete screen — generated once from the Owner's UPI ID, not per-session |
| No payment tracking | SpotKey never confirms whether the payment actually happened — see `../overview/product.md` for why |
| Dispute path | If either side disputes the amount, it routes to admin (`BOOKINGS.md` in the admin panel) |

---

## API Touchpoints (indicative)
- `POST /bookings/:id/verify-exit`
- `GET /users/:id/qr-code` (Owner's UPI QR)

---

## Related Docs
- `11-active-bookings-owner-flow.md` — Where this is reached from
- `06-booking-flow.md` — The Parker's matching Session Complete screen
- `../overview/product.md` — Why there's no in-app payment tracking
