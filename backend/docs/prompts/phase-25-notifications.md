# Prompt — Phase 25: In-app Notifications

Implement Phase 25 from the current repository root without previous conversation.

Read root `AGENTS.md`, `docs/SRS.md`, BL-17, event-producing modules, phase map, OpenAPI, and frontend integration guide. Verify Phases 01, 08, 14, 16, 23, and 24.

## Goal

Add reliable in-app notifications for important review and account events.

## Required scope

- Model owner, event type, safe payload/version, dedupe key, created/read timestamps, expiration/retention, and optional navigation target.
- Produce idempotent notifications for content/video review outcomes, Contributor approval/rejection/revocation, moderation/report outcomes where permitted, storage quota warnings, AI verification changes, and restaurant-submission decisions.
- Provide paginated list, unread count, mark-one-read, mark-all-read, and optional delete/dismiss according to policy.
- Use an internal event/dispatcher boundary so domain transactions and retries do not duplicate notifications.
- Strictly allowlist payload fields; do not expose another user’s private data, raw AI prompt, health profile, receipt, or recognition image.
- Add cleanup/retention operation and indexes for owner/read/created queries.

## Not in scope

Email, push, WebSocket/realtime delivery, or native-device tokens.

## Acceptance and handoff

- Validate dedupe/retry, unread count, pagination, read-all race, payload privacy, retention cleanup, and ownership.
- Update migration/seed, OpenAPI, integration errors/status/changelog, and phase record.
- Run lint, typecheck, build, OpenAPI validation, and `git diff --check`.
- Commit exactly:

```text
feat(notifications): add in-app event notifications
```

Final report: hash, event catalog/dedupe policy, READY endpoints, and unrun checks.
