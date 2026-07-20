# What is SpotKey?

## App Overview

SpotKey is a **peer-to-peer parking marketplace mobile app**. It connects two kinds of needs inside **one single app**, using **one single user account**:

- People who need a place to park their vehicle for a few hours ("Parker" activity)
- People who own an empty space (driveway, private lot, plot, etc.) and want to earn money by renting it out by the hour/day ("Owner" activity)

There is **no separate app for owners**. Every registered user can do both — search & book a space, AND list & manage their own space — from the same account, same login.

---

## Core Principles (Confirmed)

### 1. One User, Two Roles — Same Account
- A single login (phone + OTP) gives access to both:
  - **Book a Space** (Parker mode)
  - **Manage My Space** (Owner mode)
- No separate signup, no separate role selection at registration. The user simply uses whichever mode they need, whenever they need it, from the Home screen.

### 2. No In-App Payment Processing
- SpotKey does **not** process any payment inside the app. There is no payment gateway, no card entry, no wallet, no checkout flow built into the app.
- The app's job is only to **facilitate and point** the user to make the payment themselves, outside the app, using their own UPI apps.

### 3. UPI ID Collected Once — At Profile Completion
- During Profile Completion (right after first login), the user provides their **UPI ID**.
- This UPI ID is used for two purposes only:
  1. **Owner side:** Generate a **QR code** at the exit/checkout point of a session, which the Parker scans to pay the Owner directly.
  2. **Owner side (billing):** Used as the **auto-debit mandate** for the 7-day platform billing cycle (see `../features/14-billing-logic.md`).
- There is no in-app wallet balance, no stored card, no payment history ledger inside the app itself beyond invoice records.

### 4. Parker Payment = External App Navigation Only
- When a Parker's session ends, the app shows **payment app buttons** (Google Pay, PhonePe, etc.) or the QR code.
- Tapping a button simply **opens/navigates to that external app** — it does not process anything inside SpotKey.
- The actual money transfer happens completely outside the app, directly between Parker and Owner (or Parker scans Owner's QR).

### 5. No Subscription for Space Owners
- There is **no monthly/yearly subscription plan** for owners.
- Instead, billing is **usage-based and toggle-driven**: the owner only pays the platform based on the days their space was actually switched ON (live). Full logic in `../features/14-billing-logic.md`.

---

## What SpotKey Is NOT

- ❌ Not a payment processor / PSP
- ❌ Not a subscription-based SaaS for owners
- ❌ Not a two-app system (one app only, both roles)
- ❌ Not storing card/bank details in-app

## What SpotKey IS

- ✅ A discovery + booking + coordination layer between Parkers and Owners
- ✅ A single mobile app for both roles
- ✅ A platform that charges Owners a small usage-based platform fee via 7-day auto-debit cycles (based on UPI mandate)
- ✅ A facilitator that hands off actual money movement to external UPI apps

---

## Tech Notes (confirmed decisions)

> These are implementation-level decisions, not product logic — recorded here so they don't get
> re-litigated per feature. Full stack in `TECH_STACK.md` of the starter kit.

- **Realtime:** Socket.IO — drives live map availability, booking status, and session state
  updates (see `features/06-booking-flow.md`, `features/08-my-space-flow.md`).
- **Payments adapter:** Razorpay — used **only** for the Owner's UPI auto-debit mandate on the
  7-day platform billing cycle (see `features/14-billing-logic.md`). It is **not** used for
  Parker-to-Owner payment, which stays fully external (QR scan / GPay / PhonePe navigation).

---

## Related Docs
- `features/01-login-flow.md` — Login & OTP flow
- `features/02-after-login-flow.md` — What happens right after login (profile completion, home screen)
- `features/06-booking-flow.md` — Search, book, session, exit (external payment navigation)
- `features/08-my-space-flow.md` — Add space, toggle live, manage bookings
- `features/14-billing-logic.md` — Toggle-based daily billing, 7-day invoice cycle, auto-debit
