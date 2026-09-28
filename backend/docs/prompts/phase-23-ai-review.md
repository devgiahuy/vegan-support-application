# Prompt — Phase 23: AI Sharing & Contributor Verification

Implement Phase 23 from the current repository root and current repository state.

Read root `AGENTS.md`, `docs/SRS.md`, BL-14/15, current AI/nutrition/recognition/receipt/Contributor code, phase map, OpenAPI, and frontend integration guide. Verify Phases 11, 13, 14, 21, and 22.

## Goal

Create privacy-safe, versioned AI artifacts that users can share/submit and any approved Contributor can verify with audit history.

## Required scope

- Generalize eligible chatbot, recipe-nutrition, fridge, and receipt output references into immutable/versioned AI artifacts without copying private context into public DTOs.
- Let an authenticated owner save/share/unshare or submit eligible artifacts. Guest cannot share.
- Contributor verification permissions depend only on approved Contributor status; approval basis is irrelevant. Admin may review/override with reason.
- Verification records conclusion, scoped correction/evidence note, artifact version, reviewer, timestamp, and supersession. Original AI output remains immutable.
- Prohibit self-verification where the reviewer owns/submitted the artifact; handle concurrent active verification with conflict semantics.
- Unsharing removes public visibility without deleting verification audit. Public DTOs use strict allowlists and optional author anonymity.
- Verification does not automatically promote nutrient facts or interaction rules into the canonical food database.

## Acceptance and handoff

- Validate privacy leakage, Guest share, unified Contributor access across all approval bases, self-review, concurrent review, correction immutability, unshare, Admin override, and stale artifact versions.
- Update migration, OpenAPI, integration errors/status/changelog, and phase record.
- Run lint, typecheck, build, OpenAPI validation, privacy DTO review, and `git diff --check`.
- Commit exactly:

```text
feat(ai-review): add sharing and contributor verification
```

Final report: hash, eligible artifact types, privacy decisions, READY endpoints, and unrun checks.
