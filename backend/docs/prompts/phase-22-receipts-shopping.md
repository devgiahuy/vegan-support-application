# Prompt — Phase 22: Receipt Analysis & Shopping Gaps

Implement Phase 22 from the current repository root independently.

Read root `AGENTS.md`, `docs/SRS.md`, BL-12, current meal-plan/food-data/storage/pantry code, phase map, OpenAPI, and frontend integration guide. Verify Phases 10, 12, 15, and 20.

## Goal

Extract editable purchase candidates from receipt images, confirm them into pantry, and calculate explainable shopping gaps for selected meals.

## Required scope

- Model receipt jobs/images, provider/model/template version, merchant/date/currency metadata, candidate lines, canonical matches, quantity/unit/price estimates, confidence, edits, status, and pantry-application audit.
- Use a provider abstraction with fake/local adapter; validate structured output. Reserve/commit image storage.
- Provide create, status/detail, edit/reject/confirm candidates, cancel/retry endpoints. Pantry mutation occurs only on explicit confirmation and is idempotent.
- Extend shopping-list calculation using selected recipe/custom-meal ingredients, servings, reviewed unit conversions, and confirmed pantry quantities.
- Each shopping item returns required, available, missing, unit, conversion assumptions, source meals, confidence, and unresolved items.
- Do not infer that a receipt purchase remains available after the user has consumed it; pantry is authoritative after confirmation.

## Acceptance and handoff

- Validate duplicate receipt retry, unknown line, correction, partial extraction, pantry confirmation, multiple meal aggregation, unit mismatch, insufficient/extra inventory, and ownership.
- Update migration/config/fake fixtures, OpenAPI, integration errors/status/changelog, and phase record.
- Run lint, typecheck, build, fake-provider flow, OpenAPI validation, and `git diff --check`.
- Commit exactly:

```text
feat(receipts): analyze purchases and shopping gaps
```

Final report: hash, confirmation/accounting behavior, READY endpoints, and unrun live checks.
