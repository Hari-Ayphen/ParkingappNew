# Page-Wise Flow — Master Index

## Overview
One-line summary of every screen in the SpotKey app, in the order a user typically encounters them, with a link to its full flow doc. Use this as the map of the whole documentation set.

---

## Authentication

| # | Screen | Summary | Doc |
|---|---|---|---|
| 1 | Login | Country + phone entry, requests OTP | `01-login-flow.md` |
| 2 | Verify OTP | 6-digit OTP entry, issues tokens | `01-login-flow.md` |
| 3 | Profile Completion | First login only — name, email, UPI ID | `02-after-login-flow.md` |

## Home

| # | Screen | Summary | Doc |
|---|---|---|---|
| 4 | Home | Dual-mode hub — "Book a Space" / "My Space" | `02-after-login-flow.md` |

## Parker Mode

| # | Screen | Summary | Doc |
|---|---|---|---|
| 5 | Map / Search | Live spaces on map or list, filters | `04-map-search-flow.md` |
| 6 | Space Detail | Full space info before booking | `05-space-detail-flow.md` |
| 7 | Booking Confirm | Vehicle, duration, price estimate | `06-booking-flow.md` |
| 8 | Active Session (6 states) | Arriving → Condition Check → OTP Ack → OTP Display → Active → Exit Verification | `06-booking-flow.md` |
| 9 | Session Complete | Invoice, QR/app-nav payment, rating | `06-booking-flow.md` |
| 10 | Booking History | Past + active + cancelled bookings | `07-booking-history-flow.md` |

## Owner Mode

| # | Screen | Summary | Doc |
|---|---|---|---|
| 11 | My Space Dashboard | List of owned spaces, toggles, earnings summary | `08-my-space-flow.md` |
| 12 | Add Space (7 steps) | Location → Photos → Type → Amenities → Pricing → Availability → Review | `09-add-space-flow.md` |
| 13 | Booking Requests | Approve/reject incoming requests | `10-booking-requests-flow.md` |
| 14 | Active Bookings (Owner) | Track live sessions across all spaces | `11-active-bookings-owner-flow.md` |
| 15 | Exit Verification | Confirm parker left, finalize amount, show QR | `12-exit-verification-flow.md` |
| 16 | Earnings | Gross earnings estimate + platform fee + invoice history | `13-earnings-flow.md` |

## Billing (Cross-Cutting)

| # | Topic | Summary | Doc |
|---|---|---|---|
| 17 | Toggle Billing Logic | First-time toast, daily ON/OFF charging, 7-day cycle, auto-debit | `14-billing-logic.md` |

## Account & Support

| # | Screen | Summary | Doc |
|---|---|---|---|
| 18 | Profile | View/edit name, email, UPI ID | `15-profile-flow.md` |
| 19 | Settings | Theme, notifications, language, logout | `16-settings-flow.md` |
| 20 | Support | FAQ + raise/track tickets | `17-support-flow.md` |
| 21 | Notifications | In-app center + full notification-type table | `18-notifications-flow.md` |

---

## Reading Order (Suggested)

For a new team member or reviewer, read in this order:

1. `../overview/product.md` — what the app is, core principles
2. `01-login-flow.md` → `02-after-login-flow.md` — how a user gets in
3. `04-map-search-flow.md` → `05-space-detail-flow.md` → `06-booking-flow.md` → `07-booking-history-flow.md` — full Parker journey
4. `08-my-space-flow.md` → `09-add-space-flow.md` → `10-booking-requests-flow.md` → `11-active-bookings-owner-flow.md` → `12-exit-verification-flow.md` → `13-earnings-flow.md` — full Owner journey
5. `14-billing-logic.md` — the platform-fee mechanics underneath the Owner journey
6. `15-profile-flow.md` → `16-settings-flow.md` → `17-support-flow.md` → `18-notifications-flow.md` — account & support layer

---

## Related Docs
- `../overview/product.md` — App overview, core principles, tech notes
