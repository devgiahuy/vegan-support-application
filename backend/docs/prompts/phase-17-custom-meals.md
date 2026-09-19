# Prompt — Phase 17: Custom Meals, Photos & User Tags

Implement Phase 17 from the current repository root independently.

Read root `AGENTS.md`, `docs/SRS.md`, BL-09, current content/food-data/storage/meal-plan schemas, phase map, OpenAPI, and frontend integration guide. Verify Phases 04, 12, and 15.

## Goal

Allow a user to record a private meal outside the public recipe catalog and use it in meal planning.

## Required scope

- Model owner-scoped custom meals with name, notes, servings, structured ingredients, optional user nutrition values/estimate reference, multiple ordered photos, source note, and normalized user-created tags.
- Tags such as `shopee` are plain metadata. Do not call or imply any external marketplace API.
- Provide owner CRUD, photo attach/remove/reorder within storage quota, tag filtering, and plan-item compatibility through explicit `RECIPE`/`CUSTOM_MEAL` source typing.
- Normalize ingredients against Phase 12 when possible; preserve unmatched user text and expose incomplete nutrition coverage.
- Custom meals remain private; no public feed, voting, or Contributor review in this phase.
- Deleting an in-use custom meal must use a documented safe policy (block or retain snapshot), never silently corrupt an existing plan.

## Acceptance and handoff

- Validate ownership, multiple photos, duplicate/invalid tags, unmatched ingredients, storage rollback, plan reference, and delete-in-use behavior.
- Update migration/seed, OpenAPI, frontend integration/errors/changelog, and phase record.
- Run lint, typecheck, build, OpenAPI validation, and `git diff --check`.
- Commit exactly:

```text
feat(custom-meals): add private meals photos and tags
```

Final report: hash, privacy/reference decisions, READY endpoints, and unrun checks.
