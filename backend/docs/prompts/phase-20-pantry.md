# Prompt — Phase 20: Pantry Inventory

Implement Phase 20 from the current repository root using repository state only.

Read root `AGENTS.md`, `docs/SRS.md`, BL-12, current catalog/food-data/storage modules, phase map, OpenAPI, and frontend integration guide. Verify Phases 03, 12, and 15.

## Goal

Create the confirmed user ingredient inventory that fridge recognition, receipts, meal suggestions, and shopping gaps will use.

## Required scope

- Model owner-scoped pantry items with canonical ingredient or unmatched text, quantity/unit, normalized mass when supported, source, confidence, confirmation state, optional purchased/opened/expiry dates, freshness note, and version.
- Sources must include manual entry and future fridge/receipt jobs without granting those jobs direct mutation rights.
- Provide owner CRUD, list/filter, consume/restore or adjustment ledger, merge-duplicate preview/action, and expiring-soon query.
- Use reviewed unit conversions; retain original amount and flag unknown conversions.
- Ensure idempotent adjustments and optimistic concurrency so simultaneous plan/receipt updates do not lose data.
- Treat expiry/freshness as user-provided observations, not proof that food is safe.

## Acceptance and handoff

- Validate ownership, unmatched item, unit conversion, duplicate merge, negative prevention, retry, concurrent update, soft delete/history, and expiry boundaries.
- Update migration/seed, OpenAPI, integration errors/status/changelog, and phase record.
- Run lint, typecheck, build, OpenAPI validation, and `git diff --check`.
- Commit exactly:

```text
feat(pantry): add user ingredient inventory
```

Final report: hash, inventory invariants, READY endpoints, and unrun checks.
