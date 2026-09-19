# Prompt — Phase 19: Multi-week Meal Programs

Implement Phase 19 from the current repository root as a standalone session.

Read root `AGENTS.md`, `docs/SRS.md`, BL-11, current weekly planner/custom-meal/analysis modules, phase map, OpenAPI, and frontend integration guide. Verify Phases 10, 17, and 18.

## Goal

Extend weekly planning to user-confirmed multi-week programs with cross-week analysis and stable snapshots.

## Required scope

- Model a program with owner, title/goal, start date, timezone, ordered weeks, lifecycle, generation parameters, and version.
- Reuse weekly-plan items rather than duplicate incompatible planning logic; keep explicit snapshots so later recipe edits do not silently rewrite confirmed history.
- Generate a bounded number of weeks using existing hard constraints and offer draft alternatives before confirmation.
- Analyze repeated patterns and cumulative/average nutrition across the configured horizon using Phase 18.
- Support retrieve/list, confirm, edit/regenerate one week, and reanalyze affected later projections.
- Define idempotency, concurrency/version conflict, and maximum horizon/configuration limits.
- Return partial/failure status for long generation without leaving an invalid confirmed program.

## Acceptance and handoff

- Validate ordering/date boundaries/timezone, version conflicts, one-week edit invalidation, repeated-meal warning, mixed recipe/custom meals, generation retry, and ownership.
- Update migration/seed, OpenAPI, frontend integration/errors/changelog, and phase record.
- Run lint, typecheck, build, OpenAPI validation, and `git diff --check`.
- Commit exactly:

```text
feat(meal-programs): support multi-week planning
```

Final report: hash, horizon limits, snapshot/invalidation decisions, READY endpoints, and unrun checks.
