# Terms Acceptance Flow

- **Status:** agreed
- **Milestone:** `v0.1` (work item `v0.1-E`)
- **Owner:** unassigned

## Overview
The explicit "I agree to the Terms & Privacy Policy" step, required once per account before the user can proceed past OTP verification. This is a compliance step, not a UX nicety — it must be logged with a timestamp for legal purposes.

---

## Flow Diagram

```
VERIFY OTP → OTP verified successfully
              ↓
┌───────────────────────────────────────┐
│   IS THIS A NEW ACCOUNT?                 │
│   (no prior accepted-terms record)          │
└───────────────────────────────────────┘
        YES                      NO
         ↓                        ↓
┌─────────────────────┐   Skip straight to
│   ACCEPT TERMS         │   Profile Completion /
│   SCREEN                  │   Home (see 02-after-login-flow.md)
├─────────────────────┤
│  - Summary text            │
│  - "Terms of Service"         │
│    link (opens in-app browser)  │
│  - "Privacy Policy" link            │
│  - Checkbox: "I agree to the           │
│    Terms & Privacy Policy"                │
│  - "Continue" (disabled until               │
│    checkbox is checked)                        │
└─────────────────────┘
         ↓
   POST /auth/accept-terms
   { userId, termsVersion, timestamp }
         ↓
   Continue to Profile Completion
   (see 02-after-login-flow.md)
```

---

## Users & roles

| Role | What they can do here |
|---|---|
| Newly verified user (no acceptance record) | Read the terms, tick the checkbox, continue — or decline and be logged out |
| Returning user on the current terms version | Nothing — this screen is skipped entirely |
| Returning user on a superseded version | Re-accept the new version before reaching Home |
| Admin | Nothing here. Admin reads the stored acceptance records; it does not accept on anyone's behalf |

## User stories

### US-1 — Accept the terms on a new account

As a **newly verified user**, I can **read and explicitly agree to the Terms and Privacy Policy**
so that **my consent is on record before I use the app**.

- **AC1:** Given I have no acceptance record, when OTP verification succeeds, then I land on the
  Accept Terms screen.
- **AC2:** Given the screen is open and the checkbox is unticked, when I look at "Continue", then
  it is disabled.
- **AC3:** Given I tick the checkbox, when the state updates, then "Continue" becomes enabled.
- **AC4:** Given the checkbox is ticked, when I tap "Continue", then `POST /auth/accept-terms`
  records my acceptance and I proceed to the next step of the post-login sequence.
- **AC5:** Given the accept request fails, when the error returns, then I stay on the screen with
  the checkbox still ticked and can retry; I am not advanced.

### US-2 — Read what I'm agreeing to

As a **user on the Accept Terms screen**, I can **open the full Terms of Service and Privacy
Policy** so that **agreeing is informed rather than a blind tap**.

- **AC1:** Given I tap "Terms of Service", when it opens, then the full document renders in the
  in-app browser.
- **AC2:** Given I tap "Privacy Policy", when it opens, then the full document renders in the
  in-app browser.
- **AC3:** Given I close the in-app browser, when I return, then the Accept Terms screen is
  intact and my checkbox state is preserved.

### US-3 — Skip the screen once I've already agreed

As a **returning user**, I can **log in without seeing the terms again** so that **a compliance
gate doesn't become a per-login speed bump**.

- **AC1:** Given my stored acceptance matches the current published version, when I verify OTP,
  then the Accept Terms screen is not shown.
- **AC2:** Given the app checks `GET /legal/terms-version`, when my stored version is older than
  the current one, then the Accept Terms screen is shown before Home.
- **AC3:** Given I re-accept a newer version, when the acceptance is recorded, then a record for
  the new version exists and my earlier acceptance is not overwritten or deleted.

### US-4 — Decline and be logged out

As a **user who does not agree**, I can **leave without accepting** so that **consent is genuinely
optional rather than coerced by a dead end**.

- **AC1:** Given I am on the Accept Terms screen, when I decline or leave without accepting, then
  I am returned to the Login screen and my session tokens are cleared.
- **AC2:** Given I declined, when I log in again, then I see the Accept Terms screen again and no
  acceptance record was written.
- **AC3:** Given I have not accepted, when I attempt to reach any screen past this gate, then I am
  routed back to Accept Terms.

## Business rules

- **BR-1:** Acceptance is a **compliance record**, not a UI flag. Every acceptance stores the user,
  the terms version, and the timestamp, permanently — a UI-only gate leaves nothing to produce if
  the consent is ever challenged.
- **BR-2:** Acceptance is recorded per **terms version**. A new published version re-gates every
  user whose latest acceptance is older.
- **BR-3:** Prior acceptance records are append-only — never updated in place and never deleted.
  The audit trail is the history, not the latest row.
- **BR-4:** "Continue" is disabled until the checkbox is ticked. Consent is never pre-ticked or
  implied by proceeding.
- **BR-5:** There is no path past this screen without accepting. Declining logs the user out; it
  does not degrade into a limited mode.
- **BR-6:** The gate sits after OTP verification — an unauthenticated visitor is never asked to
  accept, because there is no identity to attach the record to.

## Data touched

| Table | New / changed | Notes |
|---|---|---|
| `terms_version` | new | Published version id, effective date, document URLs. Seeded and appended to, never edited in place |
| `terms_acceptance` | new | One row per (user, terms version): user FK, version FK, accepted-at timestamptz |
| `user` | read-only | Identity only; acceptance state is not a boolean column on `user` |

**Invariants this introduces:** a `terms_acceptance` row is immutable once written, and
(`user_id`, `terms_version_id`) is unique — re-tapping Continue must not create duplicate consent
records. Exactly one `terms_version` row is the current published version at any time. Record in
[`../architecture/data.md`](../architecture/data.md).

## Screens

| Screen | Route | Page doc (after build) |
|---|---|---|
| Accept Terms | `/(auth)/accept-terms` | `pages/accept-terms.md` |

## Out of scope

- **Login and OTP** — `01-login-flow.md`.
- **Profile Completion and Home** — `02-after-login-flow.md`.
- **Authoring or publishing the legal documents themselves** — an admin/content concern, not this
  flow.
- **Per-feature consents** (location, push, camera) — `00-splash-onboarding-flow.md`.
- **Re-consent for a change of law in a new market.** English-only, India-first for v0.1.

## Open questions

- [ ] **Does Accept Terms sit between OTP verify and Profile Completion?** This doc says yes;
      `01-login-flow.md` and `02-after-login-flow.md` route OTP → profile check with no terms
      step. *(Known Gotcha 2 — must be resolved before this milestone closes.)*
- [ ] Is there a visible "Decline" control, or is declining only "leave the screen"? The Key
      Behavior table describes the outcome but not the affordance.
- [ ] When a returning user is re-gated by a new version, does the block apply immediately on next
      launch, or from a stated effective date? Unspecified, and it decides whether publishing
      terms instantly interrupts every mid-session user.
- [ ] Do existing accounts created before this flow ships get backfilled acceptance records, or
      are they re-gated at next login? Unspecified.

---

## Key Behavior

| Element | Behavior |
|---|---|
| Shown once per account | Not shown again on subsequent logins, unless the terms version changes (see below) |
| Terms versioning | Each published Terms/Privacy update has a version id; if a returning user's accepted version is older than current, they see this screen again before Home |
| Compliance record | The accepted timestamp + terms version is stored permanently against the user — this is the audit trail, not just a UI gate |
| Cannot be skipped | There is no "decline" path that lets the user continue — declining logs the user out back to Login |

---

## API Touchpoints (indicative)
- `GET /legal/terms-version` — current published version
- `POST /auth/accept-terms` — records acceptance

---

## Related Docs
- `01-login-flow.md` — Where this sits, right after OTP verification
- `02-after-login-flow.md` — What comes after acceptance
