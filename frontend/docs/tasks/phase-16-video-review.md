# Task: Phase 16 — Video Review Parity & Content Submission Lifecycle

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-16-video-review.md`](../../../../backend/docs/prompts/phase-16-video-review.md)
> **Trạng thái Backend**: `COMPLETED` (READY v4.1, PR #19)
> **Trạng thái Frontend**: `READY` (Hoàn thành tích hợp 100%)
> **Mức độ ưu tiên**: 🚨 **CẤP BÁCH — BREAKING CHANGE**

---

## 1. Bối cảnh & Lý do thay đổi

Backend Phase 16 đã chuẩn hóa quy trình xuất bản nội dung (Bài viết Blog, Công thức Recipe, Video Nấu ăn) theo một vòng đời thống nhất:
1. **Không còn cơ chế tự động publish theo role**: Mọi nội dung khi mới tạo/sửa đều ở trạng thái `DRAFT` (bản nháp).
2. **Nộp duyệt rõ ràng (Explicit Submit)**: Tác giả phải bấm nút "Gửi duyệt" (`POST /api/v1/posts/:id/submit`) để chuyển revision sang `PENDING_REVIEW`.
3. **Lịch sử duyệt minh bạch**: Tác giả có thể theo dõi tiến trình và lý do từ chối (nếu có) qua `GET /api/v1/posts/:id/review-history`.
4. **Hệ thống duyệt bài mới cho Admin**:
   - Thay thế các endpoint cũ `/review-queue/posts*` (đã `DEPRECATED`) bằng bộ API `/api/v1/admin/content-review*`.
   - Admin duyệt bài phải cung cấp lý do rõ ràng khi từ chối (`REJECTED`) hoặc yêu cầu chỉnh sửa.

---

## 2. Danh sách Endpoints Backend liên quan

Chi tiết xem tại [`frontend/docs/api/content-review.md`](../api/content-review.md) và [`frontend/docs/api/content-review-admin.md`](../api/content-review-admin.md):

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `POST` | `/api/v1/posts/:id/submit` | Tác giả | Nộp một bản nháp immutable để Admin kiểm duyệt |
| `GET` | `/api/v1/posts/:id/review-history` | Tác giả/Admin | Xem lịch sử các lần nộp duyệt, lý do phản hồi |
| `GET` | `/api/v1/admin/content-review` | Admin | Danh sách hàng chờ duyệt (hỗ trợ lọc: RECIPE, POST, VIDEO) |
| `GET` | `/api/v1/admin/content-review/:id` | Admin | Xem chi tiết bản nháp nộp duyệt, bằng chứng, diff |
| `PATCH` | `/api/v1/admin/content-review/:id` | Admin | Phê duyệt (`APPROVED`) hoặc từ chối (`REJECTED`) kèm lý do |

---

## 3. Checklist Chuẩn Bị (Pre-flight Checklist)

- [x] Đọc tài liệu:
  - [`backend/docs/prompts/phase-16-video-review.md`](../../../../backend/docs/prompts/phase-16-video-review.md)
  - [`frontend/docs/api/content-review.md`](../api/content-review.md) & [`frontend/docs/api/content-review-admin.md`](../api/content-review-admin.md)
  - `docs/SRS.md` mục FR-02 (Content Publication) và FR-11 (Moderation Workflow)
- [x] Kiểm tra hằng số endpoint trong `src/common/constants/api-endpoints.ts`:
  - Khai báo nhánh `CONTENT_REVIEW`: `SUBMIT: (id) => ...`, `HISTORY: (id) => ...`
  - Cập nhật nhánh `ADMIN_CONTENT_REVIEW`: `LIST`, `DETAIL: (id) => ...`, `DECISION: (id) => ...`
  - Đánh dấu deprecated các hằng số cũ `API_ENDPOINTS.REVIEW_QUEUE.*`.
- [x] Xác định mã lỗi nghiệp vụ:
  - `CONTENT_NOT_SUBMITTABLE`: Bài viết chưa hoàn thành thông tin bắt buộc hoặc đang ở trạng thái không thể nộp.
  - `CONTENT_ALREADY_SUBMITTED`: Revision đang chờ duyệt, không được nộp trùng.
  - `REVIEW_DECISION_INVALID`: Quyết định của Admin thiếu lý do bắt buộc.

---

## 4. Checklist Triển Khai (7 Tầng Scaffold)

### Tầng 1 & 2: Types DTO & Model
- [x] Tạo `src/features/review/types/content-review.dto.ts`:
  - `SubmitPostRequestDto`, `ContentReviewHistoryResponseDto`, `ReviewQueueListResponseDto`
  - `AdminContentReviewDetailResponseDto`, `AdminContentReviewDecisionRequestDto`
- [x] Tạo `src/features/review/types/content-review.model.ts`:
  - `ContentReviewItem`, `ContentReviewHistory`, `ContentReviewDetail`, `ReviewDecisionEnum`

### Tầng 3 & 4: Mapper & Unit Test
- [x] Cập nhật/Tạo `src/features/review/mappers/content-review.mapper.ts`:
  - Map dữ liệu hàng chờ duyệt, chi tiết bài viết, lịch sử phản hồi.
- [x] Tạo `src/features/review/mappers/content-review.mapper.test.ts`:
  - Unit test cho mapper chuyển đổi trạng thái (`PENDING_REVIEW`, `APPROVED`, `REJECTED`).
  - Đạt tối thiểu 10 test cases.

### Tầng 5 & 6: API Client & TanStack Queries
- [x] Cập nhật `src/features/review/api/review.api.ts`:
  - `submitPost(id, note)`: `POST /posts/:id/submit`
  - `getReviewHistory(id)`: `GET /posts/:id/review-history`
  - `getAdminQueue(params)`: `GET /admin/content-review`
  - `getAdminDetail(id)`: `GET /admin/content-review/:id`
  - `makeDecision(id, decision, reason)`: `PATCH /admin/content-review/:id`
- [x] Cập nhật `src/features/review/queries/review.queries.ts`:
  - `useSubmitPostMutation()`: nộp duyệt và toast thành công
  - `useContentReviewHistoryQuery(id)`: lấy lịch sử duyệt của bài
  - `useAdminContentReviewQueueQuery()`: danh sách hàng chờ cho Admin
  - `useAdminContentReviewDecisionMutation()`: phê duyệt/từ chối kèm invalidate queries

### Tầng 7: UI Components & Migration
- [x] **Thêm nút "Gửi kiểm duyệt"**:
  - Tại trang chỉnh sửa bài viết `/articles/[id]/edit` và công thức `/recipes/[id]/edit`.
  - Hiển thị hộp thoại xác nhận nộp duyệt kèm ghi chú tùy chọn cho kiểm duyệt viên.
- [x] **Component hiển thị trạng thái duyệt của tác giả**:
  - `ReviewStatusBanner`: hiển thị trên đầu bài viết nháp/đang chờ duyệt/bị từ chối.
  - Hiển thị lý do từ chối từ Admin nếu trạng thái là `REJECTED`.
- [x] **Nâng cấp trang Admin Review (`/admin/dashboard` tab Review)**:
  - Thay thế bảng cũ bằng component kết nối với `useAdminContentReviewQueueQuery`.
  - Hỗ trợ xem trước nội dung, ảnh bìa, nguyên liệu, video trước khi duyệt.
  - Dialog phê duyệt / từ chối với ô nhập lý do bắt buộc (tối thiểu 10 ký tự).

---

## 5. Verification & Testing

- [x] `node node_modules/typescript/bin/tsc --noEmit` (0 lỗi).
- [x] `npm test` (toàn bộ tests pass, mapper review pass).
- [x] `npm run build` (build thành công không lỗi).
- [x] Test tay luồng tác giả: Tạo công thức nháp -> Bấm "Gửi kiểm duyệt" -> Trạng thái đổi thành `Chờ duyệt`.
- [x] Test tay luồng Admin: Đăng nhập Admin -> Vào Dashboard tab duyệt -> Thấy công thức vừa nộp -> Bấm "Phê duyệt" -> Công thức chuyển sang `Công khai`.

---

## 6. Cập nhật Tài liệu Bàn giao

- [x] Cập nhật `frontend/docs/BACKEND_INTEGRATION.md`: cập nhật trạng thái `FE integrated = Yes` cho các endpoint content-review.
- [x] Cập nhật `frontend/docs/PROGRESS.md`: ghi nhận Task #10 và các task content liên quan.
- [x] Cập nhật `frontend/docs/WORK-LOG.md`: ghi lại chi tiết migration Phase 16.
