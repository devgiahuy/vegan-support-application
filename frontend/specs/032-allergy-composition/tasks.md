# Implementation tasks

- [x] T001 Update approved scope in `docs/SRS.md` and `docs/IMPLEMENTATION_PLAN.md` and mark contract transition in `frontend/docs/BACKEND_INTEGRATION.md`.
- [x] T002 Add schema, components/audit/lock and safe defaults in `backend/prisma/schema.prisma` and native validators (literal defaults use the existing schema provisioner).
- [x] T003 [US2] Implement shared bounded recursive evaluation in `backend/src/modules/catalog/ingredient-safety.ts`.
- [x] T004 [US3] Implement admin reviewed composition and public allergen contracts in `backend/src/modules/catalog/`.
- [x] T005 [US1] Validate active allergy selections and canonical labels in `backend/src/modules/profile/`.
- [x] T006 [US2] Integrate transitive search and manual insertion in `backend/src/modules/content/` and `backend/src/modules/meal-plans/`.
- [x] T007 [US4] Fingerprint/recheck safety in `backend/src/modules/meal-analysis/` and `backend/src/modules/meal-programs/`.
- [x] T008 [US3] Add targeted idempotent normalized demo seed/migration in `backend/prisma/` and wire both seed entry points.
- [x] T009 Complete backend gates, runtime checks and OpenAPI; update READY status in `frontend/docs/BACKEND_INTEGRATION.md`.
- [x] T010 [US1] Sync Swagger and implement named catalog layers/editor/wizard validation in `frontend/src/features/diet-preferences/` and endpoint constants.
- [x] T011 [US3] Integrate composition maintenance into existing frontend admin navigation with DTO/Model/Mapper/API/query and regression tests.
- [x] T012 Verify frontend/browser, update `frontend/docs/PROGRESS.md`, `frontend/docs/WORK-LOG.md`, phase record and spec completion.
