# ADR 0001: Single-tenant, despite the "marketplace" framing

- **Status**: Accepted
- **Date**: 2026-07-20
- **Deciders**: Product owner, with Claude during `INITIALISE.md`

## Context

SpotKey is described as a peer-to-peer parking *marketplace*. During the App Profile interview,
"marketplace" was initially read as implying **multi-tenant** — the assumption being that operator
companies would each own an isolated slice of data, as in a B2B SaaS.

Reading `docs/overview/product.md:5-10` contradicted this. SpotKey is one app, one account, both
roles: the same user books a space *and* lists their own driveway. There is no operator company,
no organisation, no team. Data belongs to an individual.

`INITIALISE.md:79` flags multi-tenancy as a one-way door — retrofitting an org boundary later
touches every table and every query, and removing one that was never needed is nearly as
expensive.

## Decision

SpotKey is **single-tenant**. No table carries `org_id`. Ownership is a plain `user_id` FK, and
queries use `db` directly with no `forOrg(orgId)` scoping helper.

## Consequences

**Positive**: Every query is simpler. No org-scoping wall to enforce at the API tier, and no class
of bug where a missing `forOrg()` leaks one tenant's data to another — the most expensive category
of failure in multi-tenant systems simply cannot occur here.

**Negative**: If SpotKey later sells to commercial operators who need staff accounts with
role-based access to a shared pool of spaces, that is a genuine migration touching every table.
The trigger to watch for: a customer asking "can my two employees both manage our lots?"

**Neutral**: "Marketplace" remains the right product word. It describes the two-sided
*transaction*, not the data model — the two are independent, and conflating them is exactly the
error this ADR corrects.

## Alternatives considered

- **Multi-tenant with `org` as the tenant unit** — rejected. It would add an org boundary,
  `CurrentUserPayload.orgId`, and composite indexes to serve a concept the product does not have.
  Every owner would be a single-member org, which is overhead with no isolation benefit.
- **Hybrid: single-tenant now, org tables stubbed for later** — rejected. Unused columns get
  populated inconsistently and become a migration hazard rather than a head start.

## Evidence in code

- *No code yet.* Verify at implementation: no `org_id` column in `apps/api/src/db/schema/`, and no
  `forOrg` helper anywhere.
- Spec basis: `docs/overview/product.md:5-10`, `docs/features/15-profile-flow.md:37`.

---

*Captured pre-implementation on 2026-07-20.*
