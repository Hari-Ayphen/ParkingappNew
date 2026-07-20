# Parker Flow (Book a Space)

## Overview
This is the flow a user follows when they choose **"Book a Space"** from Home. It covers searching, booking, the active session, and exit — with **zero in-app payment processing**. All money movement happens outside the app via UPI apps.

---

## Flow Diagram

```
HOME → "Book a Space" tapped
              ↓
┌─────────────────────────────┐
│      SEARCH PARKING          │
│  (Map view / List view)      │
├─────────────────────────────┤
│  - Nearby live spaces shown  │
│  - Filters: price, distance, │
│    amenities                 │
│  - Search bar                │
└─────────────────────────────┘
              ↓
        Tap a space
              ↓
┌─────────────────────────────┐
│        SPACE DETAIL          │
├─────────────────────────────┤
│  - Photos                    │
│  - Hourly rate                │
│  - Amenities                  │
│  - Owner rating/reviews       │
│  - Availability                │
│  - "Book Now" button          │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│       BOOKING CONFIRM         │
├─────────────────────────────┤
│  - Select vehicle              │
│  - Choose duration              │
│  - Estimated price shown        │
│    (informational only —        │
│     NOT charged in-app)         │
│  - Confirm booking               │
└─────────────────────────────┘
              ↓
        Request sent to Owner
        (see OWNER_FLOW.md — Booking Requests)
              ↓
        Owner Approves
              ↓
┌───────────────────────────────────┐
│         ACTIVE SESSION             │
│        (6 sub-states)               │
├───────────────────────────────────┤
│  1. Arriving                        │
│  2. Condition Check (photos)         │
│  3. OTP Acknowledgement               │
│  4. OTP Display (shown to Owner)       │
│  5. Active Session (live timer,         │
│     real-time price counting up)         │
│  6. Exit Verification (Owner confirms)    │
└───────────────────────────────────┘
              ↓
┌───────────────────────────────────┐
│         SESSION COMPLETE            │
├───────────────────────────────────┤
│  - Final amount calculated           │
│  - Invoice/receipt shown              │
│  - PAYMENT SECTION:                    │
│      • Owner's QR code (from UPI ID)    │
│      • "Pay with Google Pay" button      │
│      • "Pay with PhonePe" button          │
│      • Tapping ONLY opens/navigates        │
│        to that external app —               │
│        NO payment processed inside            │
│        SpotKey                                │
│  - Rate the space + owner                        │
└───────────────────────────────────┘
              ↓
        Back to HOME
        (can switch to Owner mode anytime)
```

---

## Payment Section — Exact Behavior (Important)

At **Session Complete**, the screen shows:

1. **Owner's QR code** — generated from the Owner's UPI ID (captured at their profile completion). Parker scans it with any UPI app to pay directly.
2. **App shortcut buttons** — "Google Pay", "PhonePe" (and similar). These are **navigation-only buttons**:
   - Tapping a button deep-links / opens the corresponding installed app.
   - SpotKey does **not** pass amount, does **not** track payment status, does **not** confirm payment success/failure.
   - Whether or how much the Parker actually pays happens entirely outside SpotKey's control, directly between Parker and Owner.
3. **Cash is equally valid.** The Parker can simply hand the Owner cash. The app neither offers
   nor forbids this — it has no opinion, because it has no visibility either way. The QR and the
   app buttons are conveniences, not required rails.
4. There is **no "Pay" button that processes payment inside the app** — no payment gateway integration, no in-app transaction record beyond showing the invoice/amount due.

> Cash makes the app's blindness explicit rather than accidental: there is no path by which
> SpotKey could learn that a session was paid. This is why `07-booking-history-flow.md:48` shows
> amount **due** and never amount **paid**, and why a "he never paid me" ticket goes to human
> mediation (`17-support-flow.md:55`) — there is no record to check, by design.

---

## Key Points

| Point | Detail |
|---|---|
| Search & Book | Fully in-app, real-time via Socket.IO for availability |
| Pricing shown | Informational / estimate + final calculated amount |
| Payment | 100% external — QR scan or app navigation only |
| No wallet | Parker has no in-app balance or saved payment method |
| Rating | Happens in-app after session, independent of payment |

---

## Related Docs
- `02-after-login-flow.md` — How the user reaches Home/Book a Space
- `08-my-space-flow.md` — Owner side of booking approval and exit verification
- `../overview/product.md` — Why there's no in-app payment
