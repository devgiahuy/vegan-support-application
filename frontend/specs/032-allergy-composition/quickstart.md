# Validation guide

1. From backend, generate Prisma, apply the repository Mongo schema and run targeted allergy/composition normalization. Inspect its status output; repeat to check idempotency.
2. Run backend lint/typecheck/build/OpenAPI generation; existing meal-plan/analysis acceptance commands remain supported.
3. Exercise public catalog, member/admin authorization, invalid preference code rejection, admin composition/source validation, self/duplicate/cycle/concurrent-edge rejection.
4. With temporary users and synthetic compositions, check direct and two-level allergy/exclusion matches in search/related/recommendations/generation/manual-add; UNKNOWN/PARTIAL/missing/inactive/cyclic data must not pass.
5. Change a descendant after generating a plan: analysis must become stale and confirmation must reject unsafe selected weeks.
6. Sync Swagger from backend, run frontend typecheck, mapper/search tests, scoped lint and build. Browser-check named/alias/typo selection, pending/no-match/error states, profile save and admin composition maintenance.
7. Delete temporary verification records; retain seed fixtures and the source/license/version audit.

Completed 2026-10-25: backend gates and existing acceptance, 700 frontend tests/typecheck/scoped lint/build, temporary live API safety scenarios and browser member/admin saves passed. Mongo provisioning/targeted demo normalization applied; idempotent repeat checked. Evidence and limitations are recorded in frontend WORK-LOG and integration 4.53. No backend test infrastructure added.
