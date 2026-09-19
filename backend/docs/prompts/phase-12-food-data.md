# Prompt — Phase 12: Food & Nutrient Knowledge Base

Implement Phase 12 from the current repository root in a fresh session. Do not rely on previous chat history.

Read root `AGENTS.md`, `docs/SRS.md`, BL-04 and section 9 of `docs/IMPLEMENTATION_PLAN.md`, `docs/FOOD_DATA_SOURCES.md`, `backend/docs/IMPLEMENTATION_PHASES.md`, this prompt, current Prisma/catalog code, OpenAPI, and `frontend/docs/BACKEND_INTEGRATION.md`. Verify Phase 03 from code and migrations. Preserve unrelated changes.

## Goal

Create the provider-neutral canonical database that later nutrition, compatibility, pantry, and AI phases depend on. AI is not the authoritative data source.

## Required scope

- Model food-data sources/import versions, canonical ingredients and aliases, edible portion, household-unit conversions, nutrient definitions, nutrient values per 100 g, and data-quality/review status.
- Model population-specific nutrient reference intakes/upper limits, evidence-graded ingredient amount/frequency guidelines per day or period, cooking methods, nutrient-retention factors, cooking-yield factors, and ingredient interaction rules with scopes `SAME_DISH`, `SAME_MEAL`, `SAME_DAY`.
- Retain source, license/attribution, source record ID, source version/date, locale/applicability, reviewer state, and timestamps. Use decimal-safe units; never assume missing nutrient means zero.
- Provide Admin CRUD/import-preview/import-commit endpoints and authenticated/public read endpoints needed by recipe entry. Imports must be idempotent and go through a provider adapter.
- Seed a small demo dataset with explicit provenance. Do not bulk-copy a dataset whose digital license has not been confirmed.
- Design adapters so USDA FoodData Central can bootstrap broad data, Vietnamese data can be curated/imported later, and packaged-food/commercial providers can be added without domain changes.
- AI may create a staged suggestion only; it cannot publish a nutrient value, limit, conversion, retention factor, or compatibility rule.
- Add indexes for normalized names, aliases, source identity, and effective/version queries.

## Not in scope

Recipe calculations, meal warnings, fridge/receipt recognition, paid provider integration, and clinical medication interactions.

## Acceptance and handoff

- Validate duplicate aliases, unit dimensions, conflicting effective versions, invalid nutrient ranges, unsupported hard rules, idempotent imports, and Admin authorization.
- Update migration/seed, OpenAPI, integration statuses/errors/changelog, and phase record.
- Run backend lint, typecheck, build, OpenAPI validation, and `git diff --check`.
- Create exactly one scoped commit:

```text
feat(food-data): add nutrient knowledge base
```

Final report: commit hash, schema/import decisions, seeded sources/licenses, READY endpoints, and unrun checks.
