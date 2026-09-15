# Prompt — Phase 07: Contributor Applications

Triển khai Phase 07 trong repository `/Users/thienel/hhnthienn/fptu/sem8/wdp/vegan-support-application`; không dựa vào session trước.

Đọc `AGENTS.md`, BL-01 và RBAC trong implementation plan, phase map, Auth code/OpenAPI và integration guide. Xác minh Phase 01. Preserve unrelated work.

## Mục tiêu

Hoàn thiện Contributor application từ register hoặc Member upgrade, Admin review và subtype permissions.

## Scope bắt buộc

- Hoàn thiện/migrate `contributor_applications` và `contributor_profiles` từ skeleton Auth nếu có, không mất pending data.
- User chọn `EXPERIENCED_PRACTITIONER` hoặc `NUTRITION_EXPERT`; không có certificate upload/verification trong MVP.
- Application từ register và upgrade dùng chung service/state machine.
- Một pending application/user; reject có reason và reapply sau 30 ngày.
- Admin approve chọn final contributor type và bắt buộc `approvalBasis`.
- Approve đổi role sang `CONTRIBUTOR`, tạo profile, revoke/rotate sessions phù hợp để token cũ không mang quyền sai.
- Permission helper phân biệt Experienced Contributor và Admin-approved Nutrition Expert.
- Endpoint submit/list own status, Admin list/filter/review.
- UI-facing labels không tuyên bố credential verified.

## Acceptance

- Xử lý đầy đủ register request vẫn MEMBER/PENDING, duplicate pending, approve/reject, cooldown, type change requiring review, stale JWT và Admin authorization.
- Experienced Contributor bị từ chối nutrition-verification permission helper; Nutrition Expert approved được phép qua helper.
- OpenAPI/integration guide/changelog/phase record cập nhật.
- Lint/typecheck/build pass.

Không triển khai content review queue hoặc AI verification record; chỉ cung cấp permission primitives.

Commit duy nhất:

```text
feat(contributors): implement application and approval flow
```

Final báo hash, migration, endpoints, permission behavior và gate.
