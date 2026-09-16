# Quickstart Validation: Catalog

**Feature**: `003-catalog` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Hướng dẫn xác thực end-to-end sau khi implement. Chi tiết ở `data-model.md` và `contracts/`.

## 1. Prerequisites

- Backend `:4000` chạy + đã seed (cây danh mục 2 tầng, dị ứng, food-group qua nguyên liệu demo).
- Frontend `.env` trỏ `:4000`; `npm run dev` ở `frontend/`.
- Tài khoản admin seed (cho US3/US4) + trình duyệt thường (cho US1/US2 public, có thể không đăng nhập).

## 2. Đường dẫn test nhanh (mở là test, không cần đi tìm)

Base URL: frontend `http://localhost:3000` (`npm run dev` trong `frontend/`), backend `http://localhost:4000`.

| VC             | URL (ghép sau base)                                                                       | Tài khoản              | Mở ra test gì                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------- |
| VC-1           | `/danh-muc`                                                                               | Guest (cửa sổ ẩn danh) | Cây cha–con 2 tầng + dropdown lọc loại ngay trên trang                                               |
| VC-1           | `/danh-muc?type=RECIPE_GROUP` (đổi thành `FOOD_TYPE` / `CONTENT_TOPIC` để test loại khác) | Guest                  | Mở đúng loại lọc sẵn                                                                                 |
| VC-2 tìm       | `/danh-muc#tra-cuu`                                                                       | Guest                  | Ô tìm `dau phong` + lọc nhóm thực phẩm + phân trang                                                  |
| VC-2 phân giải | `/danh-muc#phan-giai`                                                                     | Guest                  | Ô phân giải: tên duy nhất → `EXACT`, `đậu` → `AMBIGUOUS`, `xyzabc` → `NONE`, 1 ký tự → không gọi API |
| VC-3           | `/admin?tab=categories`                                                                   | Admin seed             | List (kèm archived) + tạo/sửa/archive danh mục + replacement picker                                  |
| VC-4           | `/admin?tab=ingredients`                                                                  | Admin seed             | Tạo/sửa/archive nguyên liệu + thêm/xóa alias                                                         |
| VC-5           | Các URL trên                                                                              | Guest + Member + Admin | Tắt backend khi lưu, sai field, 403 ở màn admin                                                      |
| VC-6           | — (soi code, không cần mở trang)                                                          | —                      | Không có màn submit/review proposal, không UI gọi `GET /health`, không nút xóa cứng                  |

Lưu ý:

- `/admin` bọc `AuthGuard ADMIN`: guest/member mở vào bị chặn → đó chính là case VC-3.6 / VC-4.7 / VC-5.3, không phải bug.
- Không thấy mục "Quản trị catalog" trong dropdown avatar = đang login sai tài khoản (không phải admin seed) hoặc chưa đăng nhập.
- **Admin đăng nhập sẽ tự vào `/admin?tab=categories`** (nếu không có `?from=` tường minh). Login xong không thấy vào admin = kiểm tra role token có `ADMIN` không (mở DevTools → Application → Cookies → `accessToken` → decode JWT payload).

### Xử lý khi gặp `REFRESH_TOKEN_REUSED` (đã fix từ 2026-09-16)

Backend rotation + revoke family nếu 2 refresh song song với cùng token cũ. Trước fix, `AuthProvider` + `axios` race đã gây revoke.

**Nếu bạn vừa gặp lỗi này trước khi update code** (family đã bị revoke):

1. Đăng xuất (nếu còn vào được) hoặc xóa site data: DevTools → Application → Cookies → xóa `accessToken`/`refreshToken` (cả `localhost:3000` và `localhost:4000`), và `localStorage` key `auth-storage`.
2. Hard reload (Ctrl+Shift+R) → đăng nhập lại bằng admin seed (`admin@example.com` + password trong `backend/.env` `SEED_ADMIN_PASSWORD`). Lần đăng nhập mới tạo family mới, không còn lỗi.
3. Sau khi update code, lỗi này không tái diễn (đã dedup bằng `sharedRefresh` + Web Locks + forwarded Set-Cookie).

## 3. Static gates (bắt buộc, chạy trong `frontend/`)

| Lệnh                                            | Kỳ vọng                                                      |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `node node_modules/typescript/bin/tsc --noEmit` | 0 lỗi mới, không `any` mới                                   |
| `npm test`                                      | mapper test category/ingredient/admin pass, không regress cũ |
| `npm run build`                                 | thành công                                                   |
| `npm run lint`                                  | không lỗi mới                                                |
| `git diff --check`                              | sạch                                                         |

## 4. Kịch bản xác thực thủ công (chi tiết từng bước)

> Quy ước chung cho mọi VC:
>
> - Mở DevTools → tab Network, filter `Fetch/XHR` để kiểm tra endpoint + status + `error.code`.
> - Backend envelope thành công: `{success:true, data, meta}`. Thất bại: `{success:false, error:{code,message,fields,requestId}}` — luôn check `code`, không đoán theo `message`.
> - Ghi PASS khi **cả UI + Network + dữ liệu sau reload** đều đúng. Reload trang sau mỗi case ghi/đổi để chắc không phải optimistic UI giả.

### VC-1 — Cây danh mục public (P1, FR-001, SC-001)

**Ý tưởng dễ hiểu lầm:** "Cây tối đa 2 tầng" nghĩa là `cha (tầng 1) → con (tầng 2) → hết`. Backend không bao giờ trả cháu (tầng 3). UI không tự ghép tầng 3. `status` ở public luôn `ACTIVE` (ARCHIVED chỉ thấy ở màn admin).

**Chuẩn bị:**

- Backend `:4000` đã seed: ít nhất 1 cha có 2 con, thuộc 2 `type` khác nhau (vd `FOOD_TYPE` và `RECIPE_GROUP`).
- Frontend `.env` trỏ `:4000`. Mở trình duyệt ẩn danh (đảm bảo trạng thái guest).

| #   | Thao tác                                                                   | Kiểm tra Network                                                           | Kỳ vọng UI (PASS khi đủ cả 3)                                                                                            |
| --- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1.1 | Không đăng nhập, mở trang/khối danh mục                                    | `GET /api/v1/categories` → `200`, `data` là mảng, mỗi node có `children[]` | Thấy cha → con đúng quan hệ; không thấy item ARCHIVED; thời gian hiện < 3s (SC-001)                                      |
| 1.2 | Đổi lọc loại (vd từ `FOOD_TYPE` sang `RECIPE_GROUP`)                       | `GET /api/v1/categories?type=RECIPE_GROUP` → `200`                         | Cây đổi theo loại; lọc rỗng → hiện empty tiếng Việt ("Chưa có danh mục"), không spinner treo, không crash                |
| 1.3 | Tắt backend tạm thời (stop `:4000`), reload trang danh mục, sau đó bật lại | Request failed / không response                                            | Hiện state lỗi/không kết nối tiếng Việt + nút "Thử lại"; bật backend lại + bấm thử lại → cây hiện lại. Không trắng trang |
| 1.4 | (Nếu có) nhập `type` sai trên URL/query thủ công (vd `?type=SAI`)          | `400` + `code=VALIDATION_ERROR`                                            | UI hiện empty + thông báo, không crash                                                                                   |

**Lỗi hay gặp:** thấy ARCHIVED ở public = query admin nhầm endpoint; thấy tầng 3 = frontend tự render đệ quy vô hạn thay vì tối đa 2 tầng.

### VC-2 — Tìm + phân giải nguyên liệu (P1, FR-002/FR-003, SC-002/SC-003)

**Ý tưởng dễ hiểu lầm:** Có 2 API khác nhau, query param khác nhau:

- `GET /ingredients?q=...` — **tìm kiếm** (list phân trang, `q` + `foodGroup` + `page/limit`).
- `GET /ingredients/resolve?query=...` — **phân giải 1 tên** (chú ý param tên `query`, không phải `q`), trả đúng 1 trong 3 trạng thái `NONE | EXACT | AMBIGUOUS`. `AMBIGUOUS` bắt buộc hiện picker cho user tự chọn, cấm tự lấy candidate đầu tiên.

**Chuẩn bị:** seed có `Đậu phộng` (foodGroup `LEGUMES`/`NUTS_SEEDS`), vài nguyên liệu chứa chữ "đậu" (vd Đậu nành, Đậu đen) để test mơ hồ.

| #   | Thao tác                                                                                       | Kiểm tra Network                                                                                     | Kỳ vọng UI                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Ô tìm kiếm gõ `dau phong` (không dấu), chờ ~500ms                                              | `GET /api/v1/ingredients?q=dau%20phong...` → `200`, `meta {page,limit,total,totalPages}`             | Thấy `Đậu phộng` kèm nhãn nhóm thực phẩm; < 2s sau khi gõ xong (SC-002). Gõ có dấu `Đậu phộng` cũng ra cùng kết quả     |
| 2.2 | Chọn lọc `foodGroup=LEGUMES` (nhóm Đậu), rồi bấm sang trang 2 (nếu có nhiều hơn 1 trang)       | `GET ...&foodGroup=LEGUMES&page=2` → `200`                                                           | List đổi theo filter; phân trang đúng `total/totalPages`; đổi filter reset về `page=1`                                  |
| 2.3 | Ô phân giải (resolve) nhập tên trùng duy nhất (vd tên chuẩn đầy đủ của 1 nguyên liệu chỉ có 1) | `GET /api/v1/ingredients/resolve?query=...` → `200`, `data.match=EXACT`, `candidates` có đúng 1 item | Hiện 1 kết quả highlight, cho phép xác nhận. Không hiện picker nhiều lựa chọn                                           |
| 2.4 | Ô resolve nhập tên mơ hồ `đậu`                                                                 | `.../resolve?query=%C4%91%E1%BA%ADu` → `200`, `data.match=AMBIGUOUS`, `candidates.length >= 2`       | Hiện danh sách ứng viên + bắt buộc tự chọn (radio/list). **FAIL nếu UI tự chọn hộ candidate đầu tiên** (vi phạm SC-003) |
| 2.5 | Ô resolve nhập tên bịa `xyzabc123`                                                             | `.../resolve?query=xyzabc123` → `200`, `data.match=NONE`, `candidates=[]`                            | Hiện "Không trùng khớp" + gợi ý thử từ khác (vd kiểm tra chính tả, thử không dấu). Không hiện list cũ sót lại           |
| 2.6 | Ô resolve nhập 1 ký tự `a`                                                                     | Không gọi API (do rule `enabled: trim.length >= 2`)                                                  | Không loading, giữ placeholder/hint "Nhập ít nhất 2 ký tự". Nếu vẫn gọi = sai `enabled`                                 |

### VC-3 — Admin danh mục (P2, FR-004/FR-005/FR-006, SC-004/SC-005)

**Ý tưởng dễ hiểu lầm (hay hỏi nhất):**

- `PATCH` category gửi **partial** (chỉ field đổi) — khác với ingredient metadata.
- `DELETE /admin/categories/:id` thực chất là **archive mềm**, không xóa cứng. Item biến mất khỏi public nhưng còn trong admin list với `status=ARCHIVED`.
- `replacementId` là **query param** (`DELETE ...?replacementId=...`), không phải body. Chỉ bắt buộc khi danh mục **đang được nội dung dùng** (backend báo `CATEGORY_REPLACEMENT_REQUIRED`). Replacement phải **cùng `type` + cùng tầng** (cùng là cha hoặc cùng là con) và đang `ACTIVE`.

**Chuẩn bị:**

- Đăng nhập tài khoản admin seed. Ghi lại 2 category cùng loại/cùng tầng để làm replacement cho nhau (vd `Rau củ` → thay bằng `Rau xanh`, cùng `FOOD_TYPE`, cùng tầng cha).
- Chuẩn bị sẵn: 1 cha `FOOD_TYPE`, 1 cha `RECIPE_GROUP`, 1 con của cha `FOOD_TYPE` (để test tầng 3).

| #    | Thao tác                                                                                                 | Kiểm tra Network                                                                  | Kỳ vọng UI                                                                                                                                                                                                                                                                                  |
| ---- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1  | Mở quản trị catalog, bật filter `status=ALL` (hoặc tab Active/Archived)                                  | `GET /api/v1/admin/categories?page=1&limit=...&status=...` → `200`                | Thấy cả ACTIVE + ARCHIVED; phân trang + lọc `type/status` hoạt động; public tree (mở tab ẩn danh) không thấy ARCHIVED                                                                                                                                                                       |
| 3.2a | Form tạo con: chọn cha khác loại (cha `FOOD_TYPE` nhưng form để `type=RECIPE_GROUP`) rồi Lưu             | Chưa gọi API nếu client validate đúng; nếu gọi thì `409 CATEGORY_TYPE_MISMATCH`   | Form chặn ngay tại client ("Danh mục con phải cùng loại với cha"), không tạo. Nếu lọt qua client thì backend báo đúng field cha/loại                                                                                                                                                        |
| 3.2b | Sửa lại cùng loại (`FOOD_TYPE` + cha `FOOD_TYPE`), slug để trống, Lưu                                    | `POST /api/v1/admin/categories {name,type,parentId}` → `201`                      | Tạo thành công; mở tab guest reload → cây public có node mới ngay (do invalidate `useCategoryTreeQuery`). Admin list cũng có                                                                                                                                                                |
| 3.3  | Tạo con của danh mục con (cha đã là tầng 2) → Lưu                                                        | `409 CATEGORY_DEPTH_EXCEEDED` (nếu lọt qua client)                                | Bị chặn "vượt quá hai tầng" (client đếm từ cây đã tải nếu biết, backend enforce). Không tạo tầng 3                                                                                                                                                                                          |
| 3.4  | Tạo mới với slug trùng trong cùng cha (copy slug của 3.2b) → Lưu                                         | `409 CATEGORY_SLUG_CONFLICT` (+ `fields.slug` nếu có)                             | Lỗi map đúng ô slug/tên, không tạo trùng. Đổi slug khác → tạo được                                                                                                                                                                                                                          |
| 3.5  | Bấm Archive danh mục **đang được dùng** (vd danh mục seed có recipe dùng)                                | Lần 1 `DELETE /api/v1/admin/categories/:id` → `409 CATEGORY_REPLACEMENT_REQUIRED` | UI bắt mở `ReplacementPicker` (list chỉ hiện item **cùng loại + cùng tầng + ACTIVE**). Chọn replacement hợp lệ → gọi lại `DELETE ...?replacementId=<id>` → `200 {id,status:ARCHIVED}`. Sau đó: cây public mất nó, admin list hiện `ARCHIVED`. **FAIL nếu archive mà không hỏi replacement** |
| 3.6  | Archive danh mục **không ai dùng**                                                                       | `DELETE ...` → `200` thẳng (không cần replacement)                                | Mất khỏi public, còn trong admin. Không hiện picker thừa                                                                                                                                                                                                                                    |
| 3.7  | Đăng xuất admin → đăng nhập member → truy cập lại URL trang admin (hoặc gọi API admin bằng token member) | `403` + `code=FORBIDDEN` (hoặc redirect login/guard)                              | Hiện trang "Không đủ quyền", không hiện dữ liệu admin, không hiện lỗi hệ thống chung. Route + query đều chặn (FR-009)                                                                                                                                                                       |

**Phân biệt lỗi archive:** `INVALID_CATEGORY_REPLACEMENT` = replacement sai điều kiện (khác loại/khác tầng/đã archived) → cho chọn lại. `CATEGORY_REPLACEMENT_CONFLICT` = cây đổi giữa chừng → refresh cây rồi chọn lại.

### VC-4 — Admin nguyên liệu + alias (P2, FR-007/FR-008, SC-006)

**Ý tưởng dễ hiểu lầm (hay hỏi nhất):**

- `PATCH /admin/ingredients/:id` gửi **full snapshot**: 3 mảng `allergenCodes / dietCompatibilities / traditionWarnings` gửi đi được coi là **ảnh chụp đầy đủ mới**. Trường nào **không gửi = đã xóa**. Nên form sửa phải **preload đủ 3 mảng hiện tại** vào form trước khi sửa, nếu không sẽ vô tình xóa sạch.
- Alias so trùng **sau normalize** (không dấu + lowercase) do backend làm. Frontend chỉ hiển thị lỗi đúng field.
- Xóa alias trả **`204 rỗng`**: client dùng `api.delete<void>`, **không parse body**, chỉ invalidate list.

**Chuẩn bị:** đăng nhập admin. Chuẩn bị tên nguyên liệu mới chưa từng có (vd `Hạt gai dầu test`).

| #    | Thao tác                                                                                                                                     | Kiểm tra Network                                                                                                               | Kỳ vọng UI                                                                                                                                                                            |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1  | Tạo nguyên liệu: `canonicalName=Hạt gai dầu test`, `foodGroup=NUTS_SEEDS`, `allergenCodes=[...1 mã]`, `dietCompatibilities=[...1 dòng]`, Lưu | `POST /api/v1/admin/ingredients` → `201`                                                                                       | Mở tab guest tìm `hat gai dau` (không dấu) thấy ngay (public list có nó, `status=ACTIVE`). Reload vẫn còn                                                                             |
| 4.2  | Tạo lại cùng tên nhưng khác dấu/hoa-thường (vd `hạt gai dầu TEST`) → Lưu                                                                     | `409 INGREDIENT_NAME_CONFLICT`                                                                                                 | Báo trùng tại ô tên chuẩn, không tạo. Đây là test normalize (SC-004)                                                                                                                  |
| 4.3  | Mở form sửa của 4.1: **xóa hết 1 mảng** (vd xóa sạch `allergenCodes` về `[]`), giữ nguyên 2 mảng còn lại, Lưu. Sau đó reload form            | `PATCH /api/v1/admin/ingredients/:id {allergenCodes:[], dietCompatibilities:[...đủ cũ], traditionWarnings:[...đủ cũ]}` → `200` | Backend hiểu mảng rỗng = đã xóa mảng đó. Reload form thấy mảng đó vẫn rỗng, 2 mảng kia còn nguyên. **FAIL nếu UI chỉ gửi 2 mảng còn lại và bỏ luôn field rỗng** (backend sẽ hiểu sai) |
| 4.4a | Thêm alias mới (vd `dau phong my`) cho nguyên liệu 4.1                                                                                       | `POST .../:id/aliases {alias:...}` → `201` (trả `IngredientResponse` đủ)                                                       | Tìm public không dấu bằng alias mới ra ngay                                                                                                                                           |
| 4.4b | Thêm alias trùng (copy alias vừa tạo, đổi hoa/thường hoặc bỏ dấu)                                                                            | `409 INGREDIENT_ALIAS_CONFLICT`                                                                                                | Báo trùng tại ô alias, không tạo                                                                                                                                                      |
| 4.5  | Xóa alias vừa thêm                                                                                                                           | `DELETE .../:id/aliases/:aliasId` → `204` (body rỗng)                                                                          | UI cập nhật ngay (mất alias), không crash vì parse rỗng. Tìm bằng alias cũ không ra nữa. Reload vẫn đúng                                                                              |
| 4.6  | Archive nguyên liệu 4.1                                                                                                                      | `DELETE /api/v1/admin/ingredients/:id` → `200`                                                                                 | Public list + `resolve` đều không còn nó (SC-006: 0 item archived còn ở public). Admin list (filter ARCHIVED) vẫn thấy. Resolve tên nó → `NONE`                                       |
| 4.7  | Member vào trang admin ingredient                                                                                                            | `403 FORBIDDEN`                                                                                                                | Trang quyền như VC-3.7                                                                                                                                                                |

### VC-5 — Mã lỗi và edge (FR-010/FR-011)

| #   | Thao tác                                                                                   | Kiểm tra                                          | Kỳ vọng                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | Tắt backend, ở form admin nhập dở rồi bấm Lưu                                              | Không response / network error                    | Nội dung đã nhập **còn nguyên** (không reset form), toast lỗi kết nối tiếng Việt, bấm "Thử lại" sau khi bật backend thì lưu được |
| 5.2 | Cố tình để trống tên / sai format để backend trả `VALIDATION_ERROR` có `fields`            | `400 VALIDATION_ERROR`, `error.fields={name:...}` | Lỗi map đúng input (ô nào sai đỏ ô đó + message tiếng Việt), không toast chung chung. Sửa đúng → lưu được                        |
| 5.3 | Dùng token member gọi trực tiếp API admin (hoặc hết quyền giữa chừng khi đang ở màn admin) | `403 FORBIDDEN`                                   | Hiện trang quyền, không hiện "Lỗi hệ thống". Không lộ dữ liệu admin                                                              |

**Tra nhanh mã lỗi:** xem `contracts/catalog-errors.md` — luôn branch theo `error.code` qua `getApiErrorCode`, `message` chỉ fallback. Test cấm suy đoán theo text message.

### VC-6 — Ngoài scope (không đánh dấu hoàn thành nhầm)

1. Không có màn submit/review đề xuất danh mục contributor (endpoint còn `PLANNED`).
2. Không có UI nào gọi `GET /health` (theo changelog 1.1).
3. Không có nút "xóa cứng" danh mục/nguyên liệu ở đâu (chỉ archive).

## 5. Definition of Done (feature)

- [ ] Static gate §2 pass.
- [ ] VC-1 → VC-5 pass với backend local (dùng cả guest + member + admin).
- [ ] `docs/BACKEND_INTEGRATION.md`: `FE integrated = Yes` cho 13 endpoint catalog, kèm ngày.
- [ ] `docs/PROGRESS.md`: task catalog + lịch sử (liên quan task #4 tìm kiếm).
- [ ] `docs/WORK-LOG.md`: append entry.
- [ ] Không commit nếu chưa được yêu cầu.
