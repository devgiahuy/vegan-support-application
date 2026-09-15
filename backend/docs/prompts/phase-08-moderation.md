# Prompt — Phase 08: Moderation & Reports

Triển khai Phase 08 trong repository `/Users/thienel/hhnthienn/fptu/sem8/wdp/vegan-support-application`. Không phụ thuộc lịch sử chat.

Đọc `AGENTS.md`, BL-05/06/13 và state machines trong implementation plan, phase map, current OpenAPI/integration guide. Xác minh phases 04, 06, 07 từ code/OpenAPI.

## Mục tiêu

Triển khai post review queue, AI/rule flags, user reports, Admin decisions, ban/unban visibility và audit trail.

## Scope bắt buộc

- Models/migrations: reports, ai_flags, moderation_actions và state fields/indexes cần thiết.
- Member pending review; approved Contributor auto-publish nếu moderation không flag; self-approve bị cấm.
- Rule moderation MVP tạo reason codes/risk score/version. Không hard-delete.
- Low/medium flag giữ visibility theo BL-06; high-risk spam/harmful-health được `QUARANTINED` và bắt buộc Admin review.
- Một active report/user/target; escalation chỉ tính distinct reporters; 5 reporters → HIGH priority, không auto violation.
- Contributor review quality theo subtype; Admin quyết định cuối `NO_VIOLATION/WARN/HIDE/RESTORE/DEMOTE/BAN`.
- Ban ẩn post/comment bởi reason `USER_BANNED`; unban chỉ restore item chỉ bị ẩn bởi reason đó.
- Admin user/comment/report/review endpoints; mọi decision reason + audit.
- Transaction/locking cho concurrent review.

## Acceptance

- Xử lý đầy đủ self-approve, duplicate report, five distinct reporters, quarantine vs delete, concurrent reviewer, ban/unban selective restore, audit completeness và role boundaries.
- Public queries không leak quarantined/hidden revision.
- OpenAPI/errors/examples, integration guide và phase record cập nhật.
- Lint/typecheck/build pass.

Không triển khai provider AI moderation nâng cao hoặc notification delivery; có thể phát domain events/outbox hook cho Phase 14.

Commit duy nhất:

```text
feat(moderation): add review reports and audit workflow
```

Final báo hash, state transitions, endpoints READY và gate.
