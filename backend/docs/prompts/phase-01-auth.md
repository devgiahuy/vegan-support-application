# Prompt — Phase 01: Authentication & Sessions

> Historical completed-phase prompt. Its Contributor subtype fields describe the current legacy contract only and are scheduled for removal by Phase 14. Do not use this prompt to override `docs/SRS.md`.

Bạn đang triển khai Phase 01 từ thư mục gốc của repository hiện tại. Session này không có context từ phase trước; repository là nguồn trạng thái duy nhất.

Đọc `AGENTS.md`, business rules trong `docs/IMPLEMENTATION_PLAN.md`, phase map trong `backend/docs/IMPLEMENTATION_PHASES.md` và registry `frontend/docs/BACKEND_INTEGRATION.md`. Xác minh Phase 00 đã hoàn tất bằng source/OpenAPI. Kiểm tra git status và bảo toàn thay đổi không liên quan.

## Mục tiêu

Triển khai đăng ký, đăng nhập, refresh-token rotation, logout, session revocation và RBAC primitives.

## Scope bắt buộc

- Prisma models/migration cho `users`, `refresh_sessions`; enums role/status.
- Password hashing, normalized unique email, register/login validation và generic invalid-credential response.
- Register nhận optional `contributorRequest`; account vẫn là `MEMBER`. Nếu request có dữ liệu, lưu application tối thiểu `PENDING` tương thích Phase 07 nhưng không cấp quyền.
- Access token ngắn hạn; refresh token random/strong, chỉ lưu hash, gửi HttpOnly Secure SameSite cookie theo environment.
- Refresh rotation, reuse detection/revocation family và logout hiện tại/toàn thiết bị nếu contract chọn hỗ trợ.
- Middleware authenticate, optional-auth, require-role và ownership helper foundation.
- Lock tạm sau số lần login fail đã cấu hình; không làm đổi content visibility.
- Endpoints: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/users/me` GET.
- Seed account Member/Admin phục vụ local demo; không commit password production.
- OpenAPI đầy đủ success/error/examples/cookie behavior.

## Acceptance

- Xử lý đầy đủ duplicate email, invalid credentials, locked account, expired token, refresh rotation, reuse, logout và role denial.
- `requestedContributorType` không xuất hiện như role/permission trong JWT hoặc `/users/me`.
- Refresh cookie hoạt động với frontend proxy contract.
- Cập nhật các endpoint hoàn chỉnh sang `READY`; endpoint chưa đủ giữ `PLANNED`.
- Cập nhật Phase 01 completion record.
- Toàn bộ lint/typecheck/build pass; không tạo automated test suite.

Không triển khai approval Contributor, Google OAuth, forgot-password hoặc profile/diet của Phase 02/07.

Tạo đúng một commit, chỉ stage file thuộc phase:

```text
feat(auth): implement authentication and sessions
```

Báo commit hash, migrations, endpoint READY, gate và phần chưa chạy trong final.
