# Prompt — Phase 16: Video Review Parity

Implement Phase 16 from the current repository root, using repository state rather than prior chat.

Read root `AGENTS.md`, `docs/SRS.md`, BL-06/BL-08, current content/moderation/upload modules, phase map, OpenAPI, and frontend integration guide. Verify Phases 04, 08, and 15.

## Goal

Make video submission, moderation signals, and manual publication review consistent with recipe and handbook content.

## Required scope

- Reuse one review state machine: draft revision, submit, Admin approve/reject with reason, edit approved content as a new draft while prior approved revision remains public.
- Ensure uploaded video and permitted external-video metadata both carry ownership, source, status, size/reference, moderation signals, and review history.
- Apply supported text/metadata moderation before review; signal only, never auto-delete or auto-reject.
- Enforce storage reservation/commit for uploaded assets and avoid charging quota for external URLs.
- Provide author status/history and Admin review-queue/detail/actions with correct type filters and pagination.
- Retain audit evidence when hidden/removed; do not claim DMCA processing or copyright verification.

## Not in scope

Formal DMCA notice/counter-notice, fingerprinting, frame/audio moderation, transcription, summarization, or payments.

## Acceptance and handoff

- Validate draft/submission/approval/rejection/resubmission/edit, old-approved visibility, storage failure, AI flag without auto-decision, external URL validation, and ownership/RBAC.
- Update schema/migration if needed, OpenAPI, frontend integration/errors/changelog, and phase record.
- Run lint, typecheck, build, OpenAPI validation, and `git diff --check`.
- Commit exactly:

```text
feat(video): align review and moderation lifecycle
```

Final report: hash, state behavior, upload-vs-URL handling, READY endpoints, and remaining roadmap limitations.
