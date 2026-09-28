# Task: Phase 14 — Unified Contributor Trust & Verification Parity

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-14-unified-contributors.md`](../../../../backend/docs/prompts/phase-14-unified-contributors.md)
> **Trạng thái Backend**: `IN_PROGRESS` / `CHANGING` (Đã xong mã nguồn & migration, chờ build gate)
> **Trạng thái Frontend**: `PLANNED` (Cần chuẩn bị migration)
> **Mức độ ưu tiên**: ⚠️ **BREAKING MIGRATION**

---

## 1. Bối cảnh & Lý do thay đổi

Trong thiết kế ban đầu (Phase 07), Contributor được phân tách thành các subtype (vd: Chef, Chuyên gia dinh dưỡng, Bác sĩ...).
Tuy nhiên, quy chuẩn kiến trúc canonical tại `docs/SRS.md` (§3.3) và `docs/IMPLEMENTATION_PLAN.md` (BL-03) đã khẳng định:
1. **Một vai trò Contributor duy nhất**: Mọi người đóng góp đã được phê duyệt đều có quyền hạn ngang nhau (tạo công thức, bài viết, video, kiểm duyệt AI artifacts ở Phase 23).
2. **Loại bỏ Subtype RBAC**: Không được dùng subtype để phân quyền hay giới hạn tính năng.
3. **Cơ sở phê duyệt (`approvalBasis`)**: Chỉ là căn cứ xét duyệt hồ sơ:
   - `ORGANIZATION_AFFILIATION`: Tổ chức/Hội đoàn ẩm thực chay.
   - `PLATFORM_TRACK_RECORD`: Đã có lịch sử đóng góp uy tín trên nền tảng.
   - `ADMIN_INVITED`: Được Admin gửi lời mời trực tiếp.
4. **Bổ sung API mời và thu hồi**:
   - Admin có thể tạo lời mời Contributor (`POST /api/v1/admin/contributor-invitations`).
   - Admin có thể thu hồi quyền khi phát hiện vi phạm (`PATCH /api/v1/admin/contributors/:userId/revoke`).

---

## 2. Danh sách Endpoints Backend liên quan

Chi tiết xem tại [`frontend/docs/api/contributors.md`](../api/contributors.md) và [`frontend/docs/api/contributor-admin.md`](../api/contributor-admin.md):

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `POST` | `/api/v1/contributor-applications` | Member | Nộp đơn Contributor kèm `claimedApprovalBasis` |
| `GET` | `/api/v1/contributor-applications/me` | Member | Xem lịch sử đơn xét duyệt của bản thân |
| `GET` | `/api/v1/admin/contributor-applications` | Admin | Hàng chờ xét duyệt đơn Contributor |
| `PATCH` | `/api/v1/admin/contributor-applications/:id/review` | Admin | Phê duyệt/Từ chối đơn kèm lý do và căn cứ phê duyệt cuối cùng |
| `POST` | `/api/v1/admin/contributor-invitations` | Admin | Gửi lời mời trở thành Contributor cho Member |
| `PATCH` | `/api/v1/admin/contributors/:userId/revoke` | Admin | Thu hồi tư cách Contributor kèm lý do kiểm toán |

---

## 3. Checklist Chuẩn Bị (Pre-flight Checklist)

- [ ] Đọc tài liệu:
  - [`backend/docs/prompts/phase-14-unified-contributors.md`](../../../../backend/docs/prompts/phase-14-unified-contributors.md)
  - `docs/SRS.md` mục §3.3 và FR-04
  - `docs/IMPLEMENTATION_PLAN.md` mục BL-03
- [ ] Rà soát mã nguồn frontend hiện tại:
  - Tìm toàn bộ các tham chiếu đến `requestedType`, `contributorType`, `approvedContributorType`.
  - Thay thế bằng `claimedApprovalBasis`, `finalApprovalBasis`.
- [ ] Cập nhật enum trong `src/common/enums/index.ts`:
  - Thêm `ContributorApprovalBasis`: `ORGANIZATION_AFFILIATION`, `PLATFORM_TRACK_RECORD`, `ADMIN_INVITED`.

---

## 4. Checklist Triển Khai (7 Tầng Scaffold)

### Tầng 1 & 2: Types DTO & Model
- [ ] Cập nhật `src/features/contributor/types/contributor.dto.ts`:
  - Xóa bỏ các trường subtype cũ.
  - Thêm `claimedApprovalBasis`, `organizationEvidence`, `platformEvidence`.
  - Thêm DTO cho invitation và revocation.
- [ ] Cập nhật `src/features/contributor/types/contributor.model.ts`:
  - Unified Contributor profile model.

### Tầng 3 & 4: Mapper & Unit Test
- [ ] Cập nhật `src/features/contributor/mappers/contributor.mapper.ts`:
  - Map `claimedApprovalBasis` sang nhãn hiển thị tiếng Việt thân thiện:
    - `Tổ chức đối tác / Viện ẩm thực`
    - `Thành viên uy tín trên nền tảng`
    - `Được Quản trị viên mời`
- [ ] Cập nhật `contributor.mapper.test.ts` (đảm bảo tất cả 12 tests cũ được cập nhật và pass).

### Tầng 5 & 6: API Client & TanStack Queries
- [ ] Cập nhật `src/features/contributor/api/contributor.api.ts`:
  - Nối 2 endpoint mới: `createInvitation`, `revokeContributor`.
- [ ] Cập nhật `src/features/contributor/queries/contributor.queries.ts`:
  - Thêm mutation mời và thu hồi quyền.

### Tầng 7: UI Components & Migration
- [ ] **Form nộp đơn tại `/profile` (tab Contributor)**:
  - Cập nhật các ô nhập liệu bằng chứng tương ứng với căn cứ xét duyệt được chọn (đường dẫn portfolio, chứng chỉ số nếu có).
- [ ] **Màn hình xét duyệt Admin tại `/admin/dashboard?tab=contrib-apps`**:
  - Xem bằng chứng xét duyệt, xác nhận căn cứ duyệt cuối cùng.
- [ ] **Quản lý Contributor**:
  - Nút "Thu hồi quyền" trong danh sách quản lý người dùng `/admin/dashboard?tab=mod-users`.
