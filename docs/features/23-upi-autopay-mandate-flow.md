# UPI Autopay Mandate Setup Flow (Owner)

## Overview
`02-after-login-flow.md` treats "UPI ID" as a single text field captured at Profile Completion. In reality, enabling **auto-debit** (the Day-8 platform fee charge described in `14-billing-logic.md`) requires the Owner to explicitly **authorize a recurring UPI mandate** — a real approval step inside their UPI app (Razorpay UPI Autopay or equivalent), not just typing an ID string. This doc separates the two.

---

## Two Separate Things (Important Distinction)

| Captured at Profile Completion | Set up here, separately |
|---|---|
| **UPI ID** (a VPA like `name@bank`) — used to *generate the exit QR code* Parkers scan | **UPI Autopay Mandate** — an authorized recurring-debit permission the Owner grants SpotKey's payment processor (Razorpay), used for the Day-8 platform fee auto-debit |

A user can have a UPI ID on file (enough to receive Parker payments via QR) **without** having an active Autopay mandate. The mandate is required specifically to let the toggle-based billing in `14-billing-logic.md` actually auto-debit.

---

## Flow Diagram

```
FIRST TIME OWNER TOGGLES A SPACE ON
  (before the first-activation toast in 14-billing-logic.md
   can be confirmed, the mandate must exist)
              ↓
┌───────────────────────────────────────┐
│   DOES THIS OWNER HAVE AN ACTIVE          │
│   AUTOPAY MANDATE ALREADY?                   │
└───────────────────────────────────────┘
        NO                        YES
         ↓                          ↓
┌─────────────────────┐    Skip straight to the
│  SET UP AUTOPAY         │    toggle-ON confirmation
│  MANDATE SCREEN            │    toast (14-billing-logic.md)
├─────────────────────┤
│  - Explains what this is:      │
│    "Authorize SpotKey to           │
│    auto-collect your weekly           │
│    platform fee via UPI"                 │
│  - Max mandate amount (a cap,               │
│    e.g. ₹2,000/cycle, for safety)              │
│  - "Set Up Autopay" button                        │
└─────────────────────┘
         ↓
   Redirects to Razorpay UPI Autopay flow
   (opens the Owner's UPI app to approve
    the mandate — happens outside SpotKey's UI,
    same navigation pattern as Parker payment
    in 06-booking-flow.md, but for mandate
    authorization, not a one-time payment)
         ↓
┌───────────────────────────────────────┐
│   MANDATE APPROVED IN UPI APP?           │
└───────────────────────────────────────┘
     YES                        NO / CANCELLED
      ↓                              ↓
Mandate active,              Toggle stays OFF,
return to app,               owner sees "Autopay
proceed to toggle-ON          setup required" state,
confirmation toast             can retry anytime
(14-billing-logic.md)
```

---

## Key Behavior

| Element | Behavior |
|---|---|
| Gate, not a suggestion | A space **cannot** be toggled live for the first time until an active mandate exists — this is what actually makes Day-8 auto-debit possible |
| Mandate cap | A maximum per-cycle debit amount is set during authorization (standard UPI Autopay behavior) — protects the Owner from an unexpectedly large charge |
| Mandate failure at Day 8 | If the mandate itself has lapsed/been revoked by the Owner in their bank app since setup, the Day-8 auto-debit fails — handled the same as any auto-debit failure in `14-billing-logic.md` (admin retry flow, owner notified) |
| Revoking | An Owner can revoke the mandate from their own UPI app at any time — SpotKey detects this on the next failed debit attempt and prompts re-authorization before allowing further toggle-ON activations |

---

## API Touchpoints (indicative)
- `POST /owner/autopay/mandate` — initiates mandate creation with Razorpay
- `GET /owner/autopay/mandate/status`
- Webhook: Razorpay mandate status callback

---

## Related Docs
- `14-billing-logic.md` — What the mandate is ultimately used for (Day-8 auto-debit)
- `02-after-login-flow.md` — Where the (separate) UPI ID for QR generation is captured
- `08-my-space-flow.md` — Where the toggle lives that this gates
