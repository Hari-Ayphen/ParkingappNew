# Support Flow

## Overview
Where a user gets help — FAQ, help articles, and raising a support ticket if self-serve isn't enough.

---

## Flow Diagram

```
HOME → Bottom nav / Settings → "Support" tapped
              ↓
┌─────────────────────────────────────┐
│               SUPPORT                   │
├─────────────────────────────────────┤
│  Search bar ("Search help articles")      │
│                                                │
│  FAQ categories:                                  │
│    - Booking & Payments                              │
│    - My Space & Billing                                  │
│    - Account & Profile                                        │
│    - Safety & Trust                                                │
│                                                                          │
│  "Still need help?" → Raise a Ticket                                        │
└─────────────────────────────────────┘
              ↓
        Tap "Raise a Ticket"
              ↓
┌─────────────────────────────────────┐
│            RAISE A TICKET               │
├─────────────────────────────────────┤
│  - Category selector                       │
│  - Related booking/space (optional link)       │
│  - Description + photo attachment                 │
│  - Submit                                              │
└─────────────────────────────────────┘
              ↓
        POST /support/tickets
              ↓
┌─────────────────────────────────────┐
│            TICKET STATUS                │
├─────────────────────────────────────┤
│  - Ticket list with status                 │
│    (Open / In Progress / Resolved)             │
│  - Thread view for replies                        │
└─────────────────────────────────────┘
```

---

## Key Behavior

| Element | Behavior |
|---|---|
| Payment disputes | Since payment is external, a "didn't receive payment" ticket routes to admin for manual mediation (`MODERATION.md` in the admin panel) — SpotKey has no transaction record to check against |
| Billing disputes | Auto-debit issues (wrong amount, failed mandate) link directly to the relevant invoice from `14-billing-logic.md` / `13-earnings-flow.md` |
| Response channel | Ticket replies notify via push + optionally email |

---

## API Touchpoints (indicative)
- `GET /support/faq`
- `POST /support/tickets`
- `GET /support/tickets/me`

---

## Related Docs
- `13-earnings-flow.md` — Where billing history lives for billing-related tickets
- `18-notifications-flow.md` — How ticket replies are delivered
