# Prompt — Phase 13: Cooking-aware Recipe Nutrition

Implement Phase 13 from the current repository root without previous-session assumptions.

Read root `AGENTS.md`, `docs/SRS.md`, BL-05 in `docs/IMPLEMENTATION_PLAN.md`, the phase map, current content/AI/food-data modules, OpenAPI, and frontend integration guide. Verify Phases 04, 11, and 12 from code/migrations.

## Goal

Estimate recipe nutrition from both ingredient inputs and the actual cooking process, while clearly separating canonical calculations from AI fallback.

## Required scope

- Add ordered structured recipe steps with instruction, cooking method, optional duration/temperature, and affected ingredient references.
- Version recipe nutrition estimates and line-level coverage. Store servings, normalized raw amounts, yield/retention factors, source versions, assumptions, confidence, uncertainty range, and origins: `CANONICAL_CALCULATED`, `AI_ESTIMATED`, `USER_PROVIDED`, `VERIFIED_OVERRIDE`.
- Deterministic engine: unit conversion → edible amount → nutrient baseline → yield/retention adjustment → recipe total/per-serving result.
- Use AI only through the existing provider abstraction to suggest unknown ingredient matches, parse free-text steps, or estimate missing cooking factors. Validate structured output and label it; never overwrite canonical food data.
- Support calculate/preview, save/recalculate, retrieve current/history, and status for any asynchronous AI work.
- Invalidate/recalculate when ingredients, servings, steps, or applicable source/factor versions change.
- Return uncovered ingredients and partial results instead of treating unknown values as zero.
- Add educational disclaimers and safe provider-down fallback to deterministic/partial output.

## Not in scope

Meal-level compatibility, Contributor verification, pantry/receipt input, or canonical promotion of AI suggestions.

## Acceptance and handoff

- Cover raw-only, known cooking factors, AI-assisted missing factors, provider failure, stale calculation, zero/invalid servings, and partial ingredient coverage.
- Update migration/seed, OpenAPI, frontend integration contract/errors/changelog, and phase record.
- Run lint, typecheck, build, OpenAPI validation, and `git diff --check`.
- Commit exactly:

```text
feat(recipe-nutrition): estimate cooking-aware nutrition
```

Final report: hash, calculation formula/version, AI boundary, READY endpoints, and unrun checks.
