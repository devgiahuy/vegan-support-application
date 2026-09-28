# Prompt — Phase 14: Unified Contributor Trust

Implement Phase 14 from the current repository root as an independent session.

Read root `AGENTS.md`, `docs/SRS.md`, BL-01/BL-15 and RBAC in `docs/IMPLEMENTATION_PLAN.md`, current auth/community/contributor/moderation code and migrations, OpenAPI, and frontend integration guide. Verify Phases 01, 06, 07, and 08. This is an intentional breaking contract migration.

## Goal

Remove Contributor subtype permissions. Every approved Contributor has identical rights; retain only how approval was granted.

## Required scope

- Replace legacy requested/approved/profile Contributor type with one `ContributorApprovalBasis`: `ORGANIZATION_AFFILIATION`, `PLATFORM_TRACK_RECORD`, `ADMIN_INVITED`.
- Provide a safe data migration mapping existing records to a documented basis without fabricating certificate verification. If mapping is ambiguous, choose a conservative auditable default and document it.
- Registration/profile application records intent and may claim organization affiliation or platform track record but never grants role. `ADMIN_INVITED` can only originate from an Admin invitation/approval path.
- Admin approval/rejection is manual, requires reason, records final basis, and updates authoritative role/profile transactionally.
- Preserve basis-specific audit evidence: organization claim/reference links; immutable review-time platform post/interaction quality snapshot; or Admin inviter/reason. This evidence must not drive authorization.
- Remove every authorization branch based on `NUTRITION_EXPERT` or `EXPERIENCED_PRACTITIONER`; search the whole repository.
- Preserve stale-token safety and prohibit self-approval. Add audited revocation if missing.
- Mark impacted Contributor/auth endpoints `CHANGING`, document frontend field migration, update OpenAPI, then return only fully migrated endpoints to `READY`.

## Not in scope

Certificate upload/verification, organization directory, or different Contributor permission tiers.

## Acceptance and handoff

- Demonstrate applicant remains Member, approve/reject/revoke behavior, identical permission checks for all approval bases, migration of old rows, and absence of subtype authorization.
- Update migration/seed, OpenAPI, frontend migration notes/errors/changelog, historical phase note, and Phase 14 record. Do not rewrite completed Phase 07 history.
- Run lint, typecheck, build, OpenAPI validation, repository-wide legacy-field search, and `git diff --check`.
- Commit exactly:

```text
refactor(contributors): unify contributor permissions
```

Final report: hash, migration mapping, breaking fields, consumer action, READY status, and unrun checks.
