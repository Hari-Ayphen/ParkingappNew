# Earnings Flow (Owner)

## Overview
Where an Owner sees how much they've made — per space, per billing cycle, and historically. Important: this tracks the Owner's **gross earnings from Parkers** (which SpotKey never touches, since payment is external) separately from the **platform fee SpotKey auto-debits** from the Owner (see `14-billing-logic.md`).

---

## Flow Diagram

```
MY SPACE DASHBOARD → "Earnings" tapped
              ↓
┌─────────────────────────────────────┐
│              EARNINGS                   │
├─────────────────────────────────────┤
│  Summary cards (top):                     │
│    - This week's gross earnings estimate     │
│    - Total sessions completed                    │
│    - Platform fee due (current 7-day cycle)          │
│                                                           │
│  Per-space breakdown:                                       │
│    - Space name                                                │
│    - Sessions this cycle                                          │
│    - Estimated gross earnings                                        │
│                                                                           │
│  Billing history (links to invoices):                                       │
│    - Cycle date range                                                          │
│    - Active days that cycle                                                       │
│    - Platform fee charged + auto-debit status                                        │
│    - Tap → Invoice detail / download                                                    │
└─────────────────────────────────────┘
```

---

## Key Behavior

| Element | Detail |
|---|---|
| "Gross earnings" is an estimate | Since payment is external (QR/app navigation), SpotKey can only estimate what the Owner *should* have received based on completed sessions — it cannot confirm actual receipt |
| Platform fee ≠ gross earnings | The platform fee (auto-debited every 7 days) is a small usage-based charge for the days the space was live — **not** a cut of the Owner's parking income. These are two separate money flows, shown separately |
| Billing history | Pulls directly from the invoice records generated in `14-billing-logic.md`'s 7-day cycle |

---

## API Touchpoints (indicative)
- `GET /owner/earnings/summary`
- `GET /owner/earnings/by-space`
- `GET /owner/invoices` (billing history)

---

## Related Docs
- `08-my-space-flow.md` — Dashboard entry point
- `14-billing-logic.md` — Full detail on the platform fee shown here
- `12-exit-verification-flow.md` — Where each session's amount is finalized
