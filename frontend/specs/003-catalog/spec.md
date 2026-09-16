# Feature Specification: Catalog (danh mục + nguyên liệu)

**Feature Branch**: `003-catalog`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "tạo plan làm chức năng catalog-admin, categories, diet-rules, foundation, ingredients (các endpoint D:\Project\vegan-support-application\frontend\docs\api\)"

**Backend contract**: `frontend/docs/api/categories.md` + `frontend/docs/api/ingredients.md` + `frontend/docs/api/catalog-admin.md` (sync từ OpenAPI) + `frontend/docs/BACKEND_INTEGRATION.md` §6.4 (tất cả endpoint dưới đây đều `READY` từ 2026-09-15, contract `/api/v1`).

**SRS**: BL-12 (category proposal giữ chỗ, endpoint submit/review còn `PLANNED` tới Phase 07 — ngoài scope). PROGRESS chưa có task catalog riêng (liên quan task #4 tìm kiếm và #6 thực đơn dùng dữ liệu catalog).

**Phạm vi đã trừ**: `diet-rules` (`POST /diet-rules/preview`) đã tích hợp xong trong spec `002-user-profile` — không làm lại. `foundation` (`GET /health`) không cần consumer UI theo changelog 1.1 — ngoài scope.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Duyệt cây danh mục (Priority: P1)

Mọi người dùng (kể cả khách) xem được cây danh mục đang hoạt động tối đa hai tầng, lọc theo loại, để điều hướng món ăn/công thức/bài viết.

**Why this priority**: Danh mục là xương sống điều hướng nội dung; mọi màn list/filter sau này đều dùng.

**Independent Test**: Mở trang danh mục (hoặc khối filter dùng nó), thấy cây cha–con đúng tối đa hai tầng; đổi bộ lọc loại thì cây đổi theo.

**Acceptance Scenarios**:

1. **Given** chưa đăng nhập, **When** mở danh mục, **Then** vẫn thấy cây danh mục đang hoạt động (public, không cần quyền).
2. **Given** đang xem tất cả, **When** lọc theo một loại, **Then** chỉ hiện danh mục thuộc loại đó, giữ đúng tối đa hai tầng cha–con.
3. **Given** backend trả cây rỗng, **When** mở danh mục, **Then** hiện trạng thái trống tiếng Việt, không lỗi.

---

### User Story 2 - Tra cứu nguyên liệu và phân biệt trùng tên (Priority: P1)

Người dùng gõ tên nguyên liệu (có hoặc không dấu) để tìm trong danh sách chuẩn; khi tên mơ hồ, hệ thống trả các ứng viên để chọn thay vì đoán bừa.

**Why this priority**: Tra cứu đúng nguyên liệu là đầu vào của kiêng cữ, công thức và dị ứng; đoán sai tên gây hậu quả dây chuyền.

**Independent Test**: Gõ "đậu phộng" thấy kết quả chuẩn; gõ tên mơ hồ thì thấy danh sách ứng viên để chọn; gõ tên không có thì thấy trạng thái không trùng khớp.

**Acceptance Scenarios**:

1. **Given** nhập từ khóa, **When** tìm kiếm, **Then** thấy danh sách phân trang kèm nhóm thực phẩm, tìm không dấu vẫn ra.
2. **Given** nhập tên trùng khớp duy nhất, **When** phân giải, **Then** nhận đúng một nguyên liệu chuẩn.
3. **Given** nhập tên mơ hồ, **When** phân giải, **Then** luôn nhận danh sách ứng viên để tự chọn, không tự quyết thay người dùng.
4. **Given** nhập tên không tồn tại, **When** phân giải, **Then** nhận trạng thái không trùng khớp và gợi ý thử từ khác.

---

### User Story 3 - Admin quản lý danh mục (Priority: P2)

Admin xem cả danh mục đã lưu trữ, tạo mới, sửa, và lưu trữ (không xóa cứng); khi lưu trữ danh mục đang được dùng phải chọn danh mục thay thế cùng loại/cùng tầng.

**Why this priority**: Vận hành catalog là việc của admin; sai sót ở đây lan ra toàn bộ nội dung dùng danh mục đó.

**Independent Test**: Đăng nhập admin, tạo danh mục con đúng loại, sửa tên, rồi lưu trữ nó với danh mục thay thế — danh mục biến mất khỏi cây public nhưng còn trong list admin.

**Acceptance Scenarios**:

1. **Given** là admin, **When** mở quản trị danh mục, **Then** thấy cả danh mục đang hoạt động và đã lưu trữ, có phân trang và lọc.
2. **Given** tạo danh mục con khác loại với cha, **When** lưu, **Then** form chặn hoặc backend báo lỗi loại không khớp, không tạo.
3. **Given** tạo/chuyển danh mục vượt quá hai tầng, **When** lưu, **Then** bị chặn với thông báo vượt độ sâu.
4. **Given** lưu trữ danh mục đang được nội dung dùng, **When** xác nhận, **Then** bắt buộc chọn danh mục thay thế cùng loại/cùng tầng trước; xong thì cây public không còn nó.
5. **Given** không phải admin, **When** gọi/ghé trang quản trị, **Then** bị chặn quyền, không thấy dữ liệu admin.

---

### User Story 4 - Admin quản lý nguyên liệu và tên gọi khác (Priority: P2)

Admin tạo/sửa/lưu trữ nguyên liệu chuẩn kèm metadata (dị ứng, tương thích diet, cảnh báo truyền thống) và quản lý các tên gọi khác (thêm/xóa) để tra cứu không dấu hoạt động.

**Why this priority**: Metadata nguyên liệu nuôi trực tiếp ràng buộc dị ứng/diet/truyền thống ở các feature khác; sai metadata là sai cả hệ thống.

**Independent Test**: Đăng nhập admin, tạo nguyên liệu mới kèm metadata, thêm 1 tên gọi khác, tìm không dấu ra nó, rồi xóa tên gọi khác.

**Acceptance Scenarios**:

1. **Given** là admin, **When** tạo nguyên liệu với tên chuẩn + nhóm thực phẩm + metadata, **Then** nguyên liệu xuất hiện trong danh sách public (nếu đang hoạt động).
2. **Given** tạo nguyên liệu trùng tên chuẩn đã có (kể cả khác dấu), **When** lưu, **Then** báo trùng tên, không tạo trùng.
3. **Given** sửa metadata, **When** lưu, **Then** toàn bộ mảng metadata gửi đi được coi là ảnh chụp đầy đủ mới (trường nào không gửi được hiểu là đã xóa).
4. **Given** thêm tên gọi khác đã tồn tại, **When** lưu, **Then** báo trùng tên gọi, không tạo trùng.
5. **Given** xóa tên gọi khác thành công, **When** tra cứu bằng tên đó, **Then** không còn ra nguyên liệu này.
6. **Given** không phải admin, **When** vào trang quản trị, **Then** bị chặn quyền.

### Edge Cases

- Mất mạng khi lưu (admin): giữ lại nội dung đã nhập, báo lỗi kết nối tiếng Việt, cho thử lại.
- Backend trả lỗi validation theo từng trường: map đúng vào input tương ứng.
- Danh mục/ingredient trùng slug/tên sau chuẩn hóa không dấu: báo đúng trường, không tạo trùng.
- Metadata mảng gửi đi là ảnh chụp đầy đủ: UI phải tải sẵn toàn bộ mảng hiện tại vào form trước khi sửa, tránh vô tình xóa.
- Xóa tên gọi khác trả 204 không body: UI cập nhật lạc quan và đồng bộ lại, không crash vì parse rỗng.
- Người dùng thường không bao giờ thấy item đã lưu trữ ở endpoint public.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI hiển thị cây danh mục public tối đa hai tầng cha–con, lọc được theo loại, không cần đăng nhập.
- **FR-002**: Hệ thống PHẢI cho phép tìm nguyên liệu chuẩn theo từ khóa (có/không dấu), lọc theo nhóm thực phẩm, có phân trang.
- **FR-003**: Hệ thống PHẢI phân giải tên nguyên liệu thành ba trạng thái rõ ràng: không trùng khớp, trùng khớp duy nhất, mơ hồ (luôn trả ứng viên để người dùng tự chọn).
- **FR-004**: Hệ thống PHẢI cho admin xem danh sách danh mục gồm cả đã lưu trữ, có phân trang và lọc theo loại/trạng thái.
- **FR-005**: Hệ thống PHẢI cho admin tạo/sửa danh mục với ràng buộc: con cùng loại với cha, tối đa hai tầng, slug duy nhất trong cùng cha/loại.
- **FR-006**: Hệ thống PHẢI lưu trữ mềm (không xóa cứng) danh mục; khi danh mục đang được dùng, bắt buộc chọn thay thế cùng loại/cùng tầng trong cùng một thao tác.
- **FR-007**: Hệ thống PHẢI cho admin tạo/sửa/lưu trữ nguyên liệu chuẩn kèm metadata đầy đủ (mã dị ứng, tương thích diet, cảnh báo truyền thống); mảng metadata gửi đi là ảnh chụp đầy đủ.
- **FR-008**: Hệ thống PHẢI cho admin thêm/xóa tên gọi khác của nguyên liệu; tên trùng (kể cả khác dấu) bị từ chối; xóa thành công trả 204 và UI cập nhật ngay.
- **FR-009**: Mọi màn admin PHẢI chặn người không có quyền admin ở cả route và query (chỉ vai trò đã duyệt từ backend có hiệu lực).
- **FR-010**: Hệ thống PHẢI xử lý lỗi nghiệp vụ bằng mã lỗi (`INVALID_CATALOG_NAME`, `INVALID_CATEGORY_PARENT`, `CATEGORY_TYPE_MISMATCH`, `CATEGORY_DEPTH_EXCEEDED`, `CATEGORY_SLUG_CONFLICT`, `CATEGORY_REPLACEMENT_REQUIRED`, `INVALID_CATEGORY_REPLACEMENT`, `CATEGORY_REPLACEMENT_CONFLICT`, `INVALID_INGREDIENT_METADATA`, `INGREDIENT_NAME_CONFLICT`, `INGREDIENT_ALIAS_CONFLICT`, `CATALOG_REFERENCE_CONFLICT`, `VALIDATION_ERROR`, `NOT_FOUND`), không suy đoán theo nội dung thông báo.
- **FR-011**: Mọi form PHẢI kiểm tra phía client bằng tiếng Việt, map lỗi từng trường từ backend vào đúng input, và xử lý đủ 4 trạng thái tải/lỗi/trống/thành công.

### Key Entities *(include if feature involves data)*

- **Category (Danh mục)**: định danh, tên, slug, loại, trạng thái, cha, thứ tự sắp xếp, danh sách con (tối đa một tầng con).
- **CategoryType (Loại)**: loại thực phẩm, nhóm công thức, chủ đề nội dung — cha/con phải cùng loại.
- **Ingredient (Nguyên liệu)**: định danh, tên chuẩn, tên chuẩn hóa, nhóm thực phẩm, trạng thái, tên gọi khác, mã dị ứng, tương thích diet, cảnh báo truyền thống.
- **FoodGroup (Nhóm thực phẩm)**: ngũ cốc, đậu, rau, trái cây, hạt, nấm, trứng sữa, thảo mộc/gia vị, khác.
- **Alias (Tên gọi khác)**: định danh, tên — chuẩn hóa có/không dấu khi so trùng.
- **Resolution (Kết quả phân giải)**: từ gốc, từ chuẩn hóa, trạng thái (không trùng/trùng duy nhất/mơ hồ), danh sách ứng viên.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng mở danh mục và thấy cây đúng hai tầng trong dưới 3 giây (mạng ổn định).
- **SC-002**: 95% lượt tìm nguyên liệu có kết quả trả về trong dưới 2 giây sau khi gõ xong.
- **SC-003**: 100% tên mơ hồ được thử trả về danh sách ứng viên thay vì tự quyết (kiểm chứng qua dữ liệu trả về).
- **SC-004**: 100% thao tác tạo/sửa vi phạm ràng buộc (khác loại, quá sâu, trùng slug/tên) bị chặn kèm thông báo đúng trường.
- **SC-005**: 100% lần lưu trữ danh mục đang được dùng yêu cầu chọn thay thế hợp lệ trước khi thực hiện.
- **SC-006**: 0 nguyên liệu đã lưu trữ còn xuất hiện ở endpoint public sau khi archive.

## Assumptions

- Các endpoint trong phạm vi (cây public, admin CRUD danh mục/nguyên liệu, alias, resolve) đã `READY` theo BACKEND_INTEGRATION v1.6 và giữ nguyên envelope `{success, data, meta}` / `{success:false, error:{code,message,fields,requestId}}`, phân trang `meta {page, limit, total, totalPages}`.
- ID là UUID string; timestamp ISO 8601 UTC; frontend chỉ dùng mã lỗi, không suy đoán nội dung thông báo.
- Xóa danh mục/nguyên liệu là lưu trữ mềm; xóa tên gọi khác trả 204 không body.
- Tên chuẩn và tên gọi khác so trùng sau chuẩn hóa có/không dấu (backend thực hiện, frontend chỉ hiển thị lỗi đúng trường).
- Đề xuất danh mục của contributor (submit/review) còn `PLANNED` tới Phase 07 → ngoài phạm vi; persistence `category_proposals` đã có nhưng chưa có endpoint để gọi.
- `GET /health` không cần UI tiêu thụ (theo changelog 1.1) → ngoài phạm vi.
- Chỉ vai trò admin đã duyệt mới vào được màn quản trị (middleware + guard đã có từ `001-user-auth`).
