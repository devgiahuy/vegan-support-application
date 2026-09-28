# Prompt — Phase 18: Meal Portion & Compatibility Analysis

Implement Phase 18 from the current repository root without earlier-session context.

Read root `AGENTS.md`, `docs/SRS.md`, BL-04/05/10, current profile/planner/food-data/nutrition/custom-meal code, phase map, OpenAPI, and frontend integration guide. Verify Phases 02, 10, 12, 13, and 17.

## Goal

Analyze portions, nutrient limits, and ingredient combinations within a dish and across selected meals/day, returning explainable UI-ready warnings.

## Required scope

- Analyze both published recipes and private custom meals using servings, normalized ingredients, cooking-aware nutrition, active diet rules, applicable nutrient reference intakes, ingredient amount/frequency guidelines, and interaction rules.
- Cover scopes `SAME_DISH`, `SAME_MEAL`, and `SAME_DAY`; prevent duplicate warnings and identify every affected item/ingredient.
- Return warning code, severity, evidence grade/source/version, applicability, measured/limit values where relevant, explanation, suggested adjustment, confidence, and incomplete-data notes.
- Integrate analysis into plan generate/swap/manual-add flows without changing hard dietary/allergy enforcement.
- Hard rejection is allowed only for approved hard constraints. Evidence-graded compatibility generally warns and asks the user to adjust/confirm.
- Version analysis results and invalidate them when plan items, portions, recipes, nutrition estimates, user profile, or rules change.
- Use safe educational language and never create medication/clinical claims.

## Acceptance and handoff

- Validate intra-dish and cross-dish rules, daily limit, serving adjustment, duplicate suppression, unknown nutrition, stale invalidation, custom meal, and hard-filter precedence.
- Update migration/seed, OpenAPI with tooltip/dialog fields, integration errors/status/changelog, and phase record.
- Run lint, typecheck, build, OpenAPI validation, and `git diff --check`.
- Commit exactly:

```text
feat(meal-analysis): add portion and compatibility rules
```

Final report: hash, warning policy, hard-vs-advisory behavior, READY endpoints, and limitations.
