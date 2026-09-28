# Prompt — Phase 21: Multi-image Fridge Recognition

Implement Phase 21 from the current repository root without chat memory.

Read root `AGENTS.md`, `docs/SRS.md`, BL-12, current AI/storage/pantry code, phase map, OpenAPI, and frontend integration guide. Verify Phases 11, 15, and 20.

## Goal

Accept multiple fridge/ingredient images, produce editable ingredient/quantity/freshness candidates, and update pantry only after user confirmation.

## Required scope

- Model asynchronous recognition job, ordered input images, provider/model/template version, status, deduplicated candidates, canonical match suggestions, amount/unit estimates, freshness observations, confidence, and errors.
- Reserve/commit storage for all images; enforce configurable image count/type/size limits and ownership.
- Use an `IngredientVisionProvider` abstraction with fake/local development adapter; validate AI structured output.
- Deduplicate the same ingredient across images while preserving evidence/image references and uncertainty.
- Provide create/upload-or-attach, status/detail, edit candidate, confirm/reject, cancel, and retry endpoints.
- Confirmation applies an explicit diff to pantry transactionally and idempotently. Processing results alone never change inventory.
- Use cautious language: no definitive freshness or food-safety decision.

## Not in scope

Barcode specialization, model training, automatic plan generation, or clinical safety decisions.

## Acceptance and handoff

- Validate multi-image dedupe, low confidence, unknown ingredient, quantity correction, partial provider failure, retry/idempotency, cancel, storage rollback, confirmation diff, and ownership.
- Update migration/config/seed fake fixture, OpenAPI, integration errors/status/changelog, and phase record.
- Run lint, typecheck, build, fake-provider flow, OpenAPI validation, and `git diff --check`.
- Commit exactly:

```text
feat(vision): recognize fridge ingredients
```

Final report: hash, provider/confirmation boundary, limits, READY endpoints, and unrun live checks.
