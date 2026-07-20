# Support Flow

- **Status:** agreed
- **Milestone:** `v1.0` (work item `v1.0-C`)
- **Owner:** unassigned

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

## Users & roles

| Role | What they can do here |
|---|---|
| Authenticated user (Parker mode) | Search FAQ, raise a ticket, optionally link a booking, track and reply on their own tickets |
| Authenticated user (Owner mode) | The same, and can link a space or an invoice instead of a booking |
| Unauthenticated visitor | Nothing — support is behind auth, because a ticket is tied to an account |
| Admin | Reads, replies to, and resolves tickets from the desktop panel; mediates payment disputes there |

## User stories

### US-1 — Browse and search help articles

As an **authenticated user**, I can **search help articles and browse them by category** so that
**I can resolve a common problem without waiting for a human**.

- **AC1:** Given Support is open, when it renders, then the four categories are listed: Booking &
  Payments, My Space & Billing, Account & Profile, Safety & Trust.
- **AC2:** Given I type a query, when results return, then matching articles are listed and I can
  open one.
- **AC3:** Given a query with no matches, when results return, then an empty state is shown along
  with the "Still need help?" path to a ticket.
- **AC4:** Given the FAQ request fails, when the error surfaces, then I can still reach "Raise a
  Ticket" — a broken FAQ must never block support.

### US-2 — Raise a support ticket

As an **authenticated user**, I can **submit a ticket with a category, a description and a
photo** so that **a human can pick up what the FAQ couldn't answer**.

- **AC1:** Given I tap "Raise a Ticket", when the form opens, then category and description are
  required and the photo attachment is optional.
- **AC2:** Given a complete form, when I tap Submit, then `POST /support/tickets` creates a
  ticket in `Open` status and I see a confirmation.
- **AC3:** Given a missing required field, when I tap Submit, then an inline error appears and no
  request is sent.
- **AC4:** Given submission fails, when the error surfaces, then my description and attachment
  are preserved so I can retry.
- **AC5:** Given camera or library access has never been granted, when I first tap the photo
  attachment, then the permission is requested at that moment.

### US-3 — Link a ticket to a booking, space or invoice

As an **authenticated user**, I can **attach the relevant booking, space or invoice to my
ticket** so that **support doesn't have to ask me which one I mean**.

- **AC1:** Given the ticket form, when I open the "Related" picker, then I can select from my own
  bookings, spaces and invoices only.
- **AC2:** Given I submit with a linked record, when admin opens the ticket, then the link is
  attached to it.
- **AC3:** Given I submit without linking anything, when the ticket is created, then it is still
  accepted — the link is optional.

### US-4 — Track my tickets and reply

As an **authenticated user**, I can **see my tickets with their status and continue the
conversation** so that **I know whether anyone is working on my problem**.

- **AC1:** Given I open the ticket list, when it loads, then each ticket shows its status: Open,
  In Progress or Resolved.
- **AC2:** Given I open a ticket, when the thread renders, then messages from me and from admin
  appear in chronological order.
- **AC3:** Given a ticket that is not Resolved, when I send a reply, then it is appended to the
  thread.
- **AC4:** Given I have never raised a ticket, when I open the list, then an empty state is shown
  with the path to raise one.

### US-5 — Be notified of a support reply

As an **authenticated user**, I can **be notified when support replies** so that **I don't have
to keep reopening the app to check**.

- **AC1:** Given admin replies to my ticket, when the reply is posted, then I receive a push
  notification.
- **AC2:** Given I tap that notification, when the app opens, then I land on that ticket's
  thread — not on Home.
- **AC3:** Given push is disabled in Settings, when admin replies, then no push is sent and the
  reply is still visible in the thread.

### US-6 — Raise a payment dispute that has no transaction to check

As a **user who believes a payment didn't happen**, I can **raise it as a ticket that reaches a
human** so that **someone can mediate even though SpotKey holds no record of the payment**.

- **AC1:** Given I pick a payment-dispute category, when the form renders, then it states that
  SpotKey does not process the parking payment and the case will be mediated manually.
- **AC2:** Given I submit a payment dispute, when the ticket is created, then it is routed to
  admin mediation rather than to any automated check.
- **AC3:** Given a payment dispute ticket, when it is created, then the app does not display or
  claim any payment status — there is none to display.
- **AC4:** Given a **billing** dispute (auto-debit amount or a failed mandate), when I raise it,
  then the relevant invoice is linked to the ticket.

## Business rules

- **BR-1:** Support is behind authentication. A ticket belongs to an account, and a user can see
  only their own tickets.
- **BR-2:** A ticket is created in `Open` and moves through `In Progress` to `Resolved`. Status
  is a lookup table plus FK, not a text enum.
- **BR-3:** **Payment disputes have no transaction record to check.** Parker→Owner money moves
  entirely outside SpotKey, so these route to human admin mediation. The app must never imply it
  can verify whether a payment occurred.
- **BR-4:** **Billing disputes are different** — the platform fee is SpotKey's own invoice, so
  these link to the relevant invoice and are checkable.
- **BR-5:** Category, description and account identity are required on every ticket. The related
  record and the photo are optional.
- **BR-6:** A user may only link records they own — their own bookings, spaces and invoices.
- **BR-7:** Ticket reply notifications respect the user's notification preferences
  (`16-settings-flow.md`). They are not in the always-on set.
- **BR-8:** Every support notification deep-links to the ticket thread, never to Home.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `support_ticket` | new | Owner user, category FK, status FK, description, optional related record |
| `support_ticket_message` | new | Thread messages, author (user or admin), timestamp |
| `support_ticket_attachment` | new | Photo attachments on a ticket or message |
| `support_ticket_status` | new (seed) | Open / In Progress / Resolved |
| `support_ticket_category` | new (seed) | The ticket categories, including payment vs billing dispute |

**Invariants this introduces:** a ticket always has exactly one owning user and one status; a
linked booking, space or invoice must belong to that same user. Recorded in
[`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Support / FAQ | `/(tabs)/settings/support` | `pages/support.md` |
| Raise a ticket | `/(tabs)/settings/support/new` | `pages/support-new-ticket.md` |
| My tickets | `/(tabs)/settings/support/tickets` | `pages/support-tickets.md` |
| Ticket thread | `/(tabs)/settings/support/tickets/[id]` | `pages/support-ticket-thread.md` |

## Out of scope

- **Live chat, phone support, or any real-time support channel.** Tickets only.
- **Any automated verification of a Parker→Owner payment.** There is no transaction record.
- **Refunds or in-app compensation.** SpotKey never held the money.
- **The admin side of ticket handling** — belongs in the unwritten `MODERATION.md`.
- **Authoring or managing FAQ content** — the app reads it; where it is authored is unspecified.
- **Ratings and in-session issue reports** — separate flows.
- **Support for unauthenticated visitors.**

## Open questions

- [ ] Where does FAQ content live and who edits it? There is no CMS in the stack and no admin
      screen specified for it.
- [ ] Can a user reopen a Resolved ticket, or must they raise a new one?
- [ ] Are attachments allowed on replies, or only on the initial ticket?
- [ ] Is there any response-time commitment shown to the user? None is specified anywhere — do
      not display one until it is.
- [ ] **The admin panel that handles these tickets is unspecified.** *(Known Gotcha 4 — admin is
      the sole safety net and `MODERATION.md` does not exist.)*
- [ ] How is a payment dispute closed when neither side can be verified? The mediation outcome
      has no defined states.

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
