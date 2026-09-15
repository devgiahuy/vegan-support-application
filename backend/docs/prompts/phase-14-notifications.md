# Prompt — Phase 14: In-app Notifications

Triển khai Phase 14 trong repository `/Users/thienel/hhnthienn/fptu/sem8/wdp/vegan-support-application`. Không dựa vào context chat cũ.

Đọc `AGENTS.md`, BL-14 trong implementation plan, phase map, domain events từ Contributor/Moderation/Restaurant, OpenAPI và integration guide. Xác minh phases 01, 07, 08, 13.

## Mục tiêu

Triển khai notification trong ứng dụng có dedupe, recipient privacy, read state và retention.

## Scope bắt buộc

- Model/migration notifications với eventKey unique/dedupe, target references, readAt, expiresAt.
- Tạo notification từ application approve/reject, content approve/reject, report resolved, warn/demote/ban và restaurant approve/reject.
- Không notify chính actor thực hiện action.
- Reporter và target nhận kết quả report nhưng không lộ reporter identity.
- List pagination, unread count nếu UI cần, mark one/read-all owner-only.
- Retention 90 ngày bằng scheduled cleanup/DB strategy deterministic; không phụ thuộc cron chạy trong request path.
- Retry event không tạo bản ghi trùng.
- Notification chỉ chứa summary; detail endpoint đích vẫn authorization riêng.

## Acceptance

- Xử lý đầy đủ event recipient matrix, privacy, dedupe/retry, ownership, read/read-all, unread count và expiry cleanup.
- OpenAPI/integration guide/changelog/phase record cập nhật.
- Lint/typecheck/build pass.

Không làm push/email/WebSocket notification.

Commit duy nhất:

```text
feat(notifications): add in-app event notifications
```

Final báo hash, event mapping, endpoint READY và gate.
