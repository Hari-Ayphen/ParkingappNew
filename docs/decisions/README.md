# Architecture Decision Records (ADRs)

ADRs capture *why* — the context and trade-offs behind a technical decision.
They're written for the developer who, two years from now, asks "why did we do it
this way?"

> **Template.** Keep this index up to date as you add ADRs. Copy
> [`0000-template.md`](./0000-template.md) for each new decision.

## Index

| ADR | Title | Status |
|---|---|---|
| [0000](./0000-template.md) | Template (do not accept) | — |
| [0001](./0000-template.md) | {{Short decision title}} | {{Accepted}} |

## Conventions

- ADRs are **immutable** once accepted. To change a decision, write a new ADR that
  supersedes the old one (set the old one's `Status: Superseded by ADR-NNNN`).
- File naming: `NNNN-<kebab-case-title>.md` where `NNNN` is the next zero-padded
  sequence number.
- Every ADR includes: Status, Context, Decision, Consequences, Alternatives
  Considered, and Evidence in code.
- ADRs captured retroactively (after the fact) should say so — they lack the
  original deciders' commentary, and that's fine; better than no record.

## Template

See [`0000-template.md`](./0000-template.md).

---

*Last verified {{YYYY-MM}} against `{{BRANCH_OR_SHA}}`.*
