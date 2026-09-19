# Prompt — Phase 15: Storage Quota & Upload Accounting

Implement Phase 15 from the current repository root with no dependency on previous conversation.

Read root `AGENTS.md`, `docs/SRS.md`, BL-08 in the implementation plan, the phase map, current auth/content/upload/Cloudinary code, OpenAPI, and frontend integration guide. Verify Phases 01 and 04.

## Goal

Enforce safe per-account storage before any payment or storage-selling feature.

## Required scope

- Model configurable storage policies, per-user account usage, upload reservations, committed assets, expiration, and audited Admin adjustments.
- Atomically reserve bytes before upload; commit actual provider bytes on success; release on failure/cancel/expiry; decrement only after valid durable deletion.
- Prevent concurrent reservations from exceeding limits and make retryable mutations idempotent.
- Retain current per-file type/size validation and verify provider result against declared metadata.
- Add user usage/limit endpoint and Admin policy/usage inspection endpoints with pagination.
- Return typed errors such as quota exceeded, reservation expired, invalid upload, and provider mismatch, including safe values needed by UI.
- Provide cleanup/reconciliation flow for expired reservations and provider/database drift.
- Existing media must be backfilled into usage without double counting.

## Not in scope

Payments, subscription tiers, invoices, transcoding billing, or immediate deletion for over-quota legacy accounts.

## Acceptance and handoff

- Validate concurrent reservations, retries, failed upload release, actual-size adjustment, deletion, expiry cleanup, backfill, Admin override audit, and ownership.
- Update migration/seed/config example, OpenAPI, integration errors/status/changelog, and phase record.
- Run lint, typecheck, build, OpenAPI validation, reconciliation dry run where supported, and `git diff --check`.
- Commit exactly:

```text
feat(storage): enforce user media quotas
```

Final report: hash, quota defaults, accounting invariants, cleanup command/job, READY endpoints, and unrun checks.
