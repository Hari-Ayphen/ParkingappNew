# Owner Flow (Manage My Space)

## Overview
This is the flow a user follows when they choose **"My Space"** from Home. It covers creating a space, the ON/OFF live toggle (which drives billing — see `14-billing-logic.md`), managing booking requests, active sessions, and exit verification.

**No subscription exists for owners.** Billing is entirely usage-based via the toggle, detailed in `14-billing-logic.md`.

---

## Flow Diagram

```
HOME → "My Space" tapped
              ↓
┌───────────────────────────────────┐
│   Has the user added a space yet?  │
└───────────────────────────────────┘
        NO                YES
         ↓                  ↓
┌────────────────┐   ┌───────────────────────────┐
│   ADD SPACE     │   │   MY SPACES DASHBOARD      │
│  (first time)   │   ├───────────────────────────┤
└────────────────┘   │  - List of owned spaces      │
         ↓            │  - Each with ON/OFF toggle    │
   (7-step form)      │  - Pending requests count      │
         ↓            │  - Earnings summary               │
   POST /spaces/create │  - "+ Add another space" option    │
         ↓            └───────────────────────────┘
   Space created                    ↓
   (status: Active —         Tap a specific space
    NO approval gate)                ↓
         ↓                ┌───────────────────────────┐
   Appears in dashboard   │      SPACE DETAIL (Owner)   │
   immediately, toggle     ├───────────────────────────┤
   available (still OFF)   │  - Edit price/photos/amenities│
         ↓                 │  - ON/OFF LIVE TOGGLE          │
         │                 │  - Pending requests for this    │
         │                 │    space                          │
         └─────────────────┴───────────────────────────┘
                              ↓
              ┌───────────────────────────────────┐
              │      OWNER TAPS TOGGLE → ON         │
              │   (see 14-billing-logic.md for      │
              │    full first-time confirmation +     │
              │    daily billing rules)                │
              └───────────────────────────────────┘
                              ↓
              Space is LIVE → visible on map to Parkers
                              ↓
              ┌───────────────────────────────────┐
              │        BOOKING REQUESTS             │
              ├───────────────────────────────────┤
              │  - Incoming request from a Parker    │
              │  - Shows: vehicle, duration, parker    │
              │    profile                              │
              │  - Approve / Reject buttons              │
              └───────────────────────────────────┘
                              ↓
                        Owner Approves
                              ↓
              ┌───────────────────────────────────┐
              │         ACTIVE BOOKINGS             │
              ├───────────────────────────────────┤
              │  - Track all ongoing sessions         │
              │    across this owner's spaces          │
              │  - Live status per session               │
              └───────────────────────────────────┘
                              ↓
              ┌───────────────────────────────────┐
              │       EXIT VERIFICATION             │
              ├───────────────────────────────────┤
              │  - Owner confirms parker has left     │
              │  - Confirms space condition             │
              │  - Finalizes session amount               │
              │  - QR code (from Owner's UPI ID)            │
              │    displayed for Parker to scan & pay        │
              │    (external payment — see PARKER_FLOW.md)    │
              └───────────────────────────────────┘
                              ↓
                    Session marked complete
                    Owner can toggle space
                    ON/OFF anytime, freely
                              ↓
                        Back to HOME
              (can switch to Parker mode anytime)
```

---

## Add Space (First-Time Setup)

7-step form to list a new parking spot:
1. Location (address/map pin)
2. Photos of the space
3. Space type/size details
4. Amenities (covered, CCTV, security, EV charging, etc.)
5. Hourly/daily rate
6. Availability rules
7. Review & submit

After submission the space is **created directly in `Active` status** — there is no admin approval
gate. It appears in the My Spaces Dashboard immediately with its toggle available (OFF by default).

See `09-add-space-flow.md` for why the gate was removed and what covers the risk instead.

---

## Admin Sync — admin changes reach mobile instantly

The admin panel is a **desktop web application connected to the same backend as the mobile app**.
Any admin action on a space, booking, or account **propagates to the mobile app in real time over
Socket.IO** — no refresh, no re-login, no waiting for a poll.

| Admin action | What the owner/parker sees on mobile |
|---|---|
| Suspend a space | Space drops off the map immediately; owner's toggle disables with an inline reason |
| Un-suspend a space | Space returns to the dashboard, toggle re-enabled |
| Edit a space's details | Updated fields appear on Space Detail without a refresh |
| Resolve a dispute / adjust an amount | Booking detail and invoice update live on both sides |
| Flag or restrict an account | Restriction takes effect on the next action, not the next login |

> **Why instant and not eventual.** Admin's main lever is now takedown *after* a space is already
> live and bookable (the approval gate is gone). A suspension that takes minutes to reach devices
> is a suspension that lets someone book an unsafe space in the meantime. The whole point of
> reactive moderation is that the reaction is fast.

Channels follow the existing pattern: `spaces:live-updates` for map-level add/remove,
`space:{id}:availability` for a single space, plus an `admin:{userId}:account-status` channel for
account-level actions.

---

## The Toggle — Core of the Owner Experience

- Every space has a single **ON/OFF toggle**.
- **Toggle ON** → space becomes visible on the map to Parkers, can receive bookings, and billing starts counting for that day.
- **Toggle OFF** → space disappears from map, no new bookings accepted, billing does not count for that day.
- Full billing math (7-day cycle, per-day counting, first-time confirmation toast) is documented separately in `14-billing-logic.md` — this doc only covers the toggle's effect on visibility/bookings.

---

## No Subscription

- There is no monthly plan, no tier, no recurring subscription fee independent of usage.
- The owner only ever pays based on days the toggle was ON, billed every 7 days automatically (see `14-billing-logic.md`).

---

## Related Docs
- `02-after-login-flow.md` — How the user reaches Home/My Space
- `06-booking-flow.md` — Parker side of booking + exit payment
- `14-billing-logic.md` — Full toggle billing logic, 7-day invoice, auto-debit
