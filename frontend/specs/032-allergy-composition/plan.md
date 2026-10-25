# Implementation plan

Branch: `codex/allergy-catalog-composition`. Date: 2026-10-25. Spec: [spec.md](spec.md).

## Technical context and constitution check

Node/Express/TypeScript, Prisma/MongoDB replica set; Next.js/React/TanStack Query. Root SRS/implementation plan and AGENTS override the unfilled Spec Kit constitution template. No extension hooks exist. PowerShell scripts are unavailable on this macOS host; equivalent artifacts are authored directly. Backend acceptance uses temporary scripts/existing commands, with no new test framework. Frontend uses DTO/Model/Mapper/API/query separation and existing shadcn primitives.

## Design and sequencing

1. Add ingredient composition status/kind/evidence/version, component edges, versioned audit and a graph mutation lock. Provision via Prisma generation and the repository Mongo schema command.
2. Central recursive catalog evaluation computes descendant metadata, completeness and fingerprints. Search excludes forbidden root IDs before pagination; manual-add and analysis use the same checks. No persistent safety cache can become stale.
3. Public named allergen catalog; active membership validation in profile writes; admin-only composition endpoint with source evidence and cycle-safe transactions.
4. Normalize the demo catalog using explicit local source/version/license and aliases; add clearly synthetic multi-level composition fixtures. Unknown non-curated records remain unknown.
5. Complete backend gates and mark contracts READY before Swagger sync and frontend integration. Add named allergy selection and admin composition UI to existing profile/admin navigation, plus mapper/search regression tests.
6. Recheck current analysis/confirmation, exercise real Mongo/API and browser flows; update canonical/living docs.

## Files and structure

Backend: `prisma/schema.prisma`, Mongo backfills, catalog composition service/resolver, catalog/profile/content/meal-plan/meal-analysis/meal-program modules, targeted migration/seed command and OpenAPI.

Frontend: `features/diet-preferences` named catalog types/mappers/API/queries/editor; `features/ingredient` composition maintenance layers or existing admin catalog; endpoint constants, integration registry and progress/work log.

## Validation

See [quickstart.md](quickstart.md). No unresolved design questions; user explicitly requests direct normalization without legacy compatibility.
