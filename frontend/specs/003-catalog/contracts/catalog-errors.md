# Contract: Catalog Error Codes → UI Behavior

**Feature**: `003-catalog` | **Nguồn**: `BACKEND_INTEGRATION.md` §8.

Nguyên tắc: branch theo `error.code` (qua `getApiErrorCode`), `message` chỉ fallback. Toast global 5xx/403/429/network giữ nguyên.

| Code | HTTP | Hành vi UI frontend |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Map `error.fields` vào đúng input; không retry |
| `NOT_FOUND` | 404 | Empty/not-found phù hợp (refresh list ở admin) |
| `FORBIDDEN` | 403 | Trang "không đủ quyền" ở màn admin (không toast hệ thống đè) |
| `INVALID_CATALOG_NAME` | 400 | Báo tại field tên: không chuẩn hóa được slug/canonical hợp lệ |
| `INVALID_CATEGORY_PARENT` | 400 | Báo tại field cha: chọn parent active khác |
| `CATEGORY_TYPE_MISMATCH` | 409 | Báo: chỉ chọn parent cùng loại (client đã validate trước) |
| `CATEGORY_DEPTH_EXCEEDED` | 409 | Báo: không tạo/chuyển vượt quá hai tầng |
| `CATEGORY_SLUG_CONFLICT` | 409 | Báo tại field slug/tên: đã tồn tại trong cùng cha/loại |
| `CATEGORY_REPLACEMENT_REQUIRED` | 409 | Mở bắt buộc `ReplacementPicker` trước khi archive |
| `INVALID_CATEGORY_REPLACEMENT` | 409 | Báo: chỉ nhận replacement active, cùng loại, cùng tầng; cho chọn lại |
| `CATEGORY_REPLACEMENT_CONFLICT` | 409 | Refresh cây rồi cho chọn replacement lại |
| `INVALID_INGREDIENT_METADATA` | 400 | Báo sync lại: metadata dị ứng/diet/truyền thống không hợp lệ |
| `INGREDIENT_NAME_CONFLICT` | 409 | Báo tại field tên chuẩn: đã tồn tại sau normalize không dấu |
| `INGREDIENT_ALIAS_CONFLICT` | 409 | Báo tại field alias: đã tồn tại trên nguyên liệu này |
| `CATALOG_REFERENCE_CONFLICT` | 409 | Refresh catalog (item/metadata đang có reference không hợp lệ) rồi làm lại |
| `AUTH_REQUIRED` / `TOKEN_EXPIRED` / `INVALID_REFRESH_TOKEN` / `REFRESH_TOKEN_REUSED` | 401/403 | Luồng auth chung (`001-user-auth`) |

## Definition of Done

- [ ] Mọi mã trong bảng có nhánh xử lý riêng, không gom alert chung (trừ `message` fallback).
- [ ] Không branch theo text `message` ở `features/{category,ingredient,admin-catalog}`.
- [ ] `403` ở màn admin hiện trang quyền, không hiện lỗi hệ thống.
