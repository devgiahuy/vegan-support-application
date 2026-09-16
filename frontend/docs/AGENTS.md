# AGENTS.md — Chỉ dẫn bắt buộc cho agent mới vào dự án

> Bạn là coding agent mới tham gia dự án **vegan-support-application**.
> **ĐỌC FILE NÀY TRƯỚC TIÊN**, đọc theo đúng thứ tự mục 1. **KHÔNG code** cho tới khi hoàn thành mục 1 và xác nhận hiểu ở mục 2.

---

## 1. Thứ tự đọc bắt buộc (đọc hết mới được nhận task)

Đọc theo đúng số thứ tự. File nằm ở thư mục `frontend/` (trừ khi ghi rõ).

| #   | File                                                                                                                | Đọc để biết gì                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | `frontend/docs/ARCHITECTURE.md`                                                                                     | **Quan trọng nhất.** Luật code, cấu trúc `src/`, luồng DTO→Mapper→Model.                                         |
| 2   | `frontend/docs/API-WORKFLOW.md`                                                                                     | Cách lấy API từ Swagger BE. **Cấm đọc swagger gốc** khi code.                                                    |
| 3   | `frontend/docs/SRS_Vegan_Support_Application.md`                                                                    | Chỉ đọc **module sắp làm** (vd task auth → đọc UC-01). Không đọc hết.                                            |
| 4   | `frontend/docs/UI_UX_DESIGN_PROMPT.md`                                                                              | Chỉ đọc khi task có UI.                                                                                          |
| 5   | `frontend/package.json`, `frontend/tsconfig.json`, `frontend/components.json`, `frontend/eslint.config.mjs`         | Stack, alias `@/*`, cấu hình shadcn (style `new-york`, base `radix`), lint.                                      |
| 6   | `frontend/src/app/layout.tsx`, `frontend/src/middleware.ts`, `frontend/src/app/api/auth/*/route.ts`                 | App shell + luồng auth (cookie HttpOnly, silent-refresh).                                                        |
| 7   | `frontend/src/lib/auth-token.ts` → `axios.ts` → `server-fetch.ts` → `query-client.ts` → `api-error.ts` → `utils.ts` | Core dùng chung cho mọi feature. Đọc kỹ.                                                                         |
| 8   | `frontend/src/lib/mapper/` + `frontend/src/common/constants/api-endpoints.ts` + `frontend/src/store/`               | Mapper base, endpoint tập trung, client-state Zustand.                                                           |
| 9   | `frontend/src/features/product/*` + 1 page dùng nó (`src/app/products/[id]/page.tsx`)                               | **Feature mẫu end-to-end**: dto → model → mapper → api → queries → components. Mọi feature mới copy pattern này. |

**Không đọc:** `node_modules/`, `.next/`, chi tiết file test, swagger gốc của BE.

## 2. Xác nhận đã hiểu (trả lời user 3 câu này trước khi nhận task)

1. DTO / Model / Mapper đặt ở đâu, ai được phép đọc DTO?
2. Component lấy data qua tầng nào (client và server)?
3. Thêm endpoint mới thì sửa file gì **trước tiên**?

## 3. Tóm tắt luật (chi tiết xem ARCHITECTURE.md)

- **API:** Mọi call qua bộ 3 `DTO interface` + `Model interface` + `Mapper class` (extends `BaseMapper`/`BaseBidirectionalMapper`, dùng `pickField` + `safe*` cho mọi field). Component chỉ nhận `Model`, không đọc DTO.
- **Cấm:** `any` / `as any` / `@ts-ignore` / `Record<string, any>`; hardcode URL (dùng `common/constants/api-endpoints.ts`); relative import `../../../` (dùng `@/*`); cache server-state trong Zustand; đọc `localStorage` trong interceptor/middleware.
- **UI:** Ưu tiên shadcn (`components/ui/*`). Thiếu → `npx shadcn@latest add <tên>`. shadcn không có → tự code ở `components/shared/*` theo chuẩn Tailwind + `cn()` + `radix-ui`. Không sửa logic file shadcn. Ngôn ngữ UI: **tiếng Việt**.
- **Data:** TanStack Query cho server-state (Key Factory bắt buộc), Zustand chỉ cho client-state (token memory/user/theme). Component xử lý đủ 3 trạng thái loading/error/empty.
- **Verify sau mỗi thay đổi:** `npx tsc --noEmit` (không lỗi mới), `npm test`, `npm run build`.

## 4. Quy trình nhận task chuẩn

1. Đọc task → mở SRS đúng UC + đọc file tag API tương ứng trong `frontend/docs/api/` (nếu có).
2. Trình bày plan ngắn (file nào tạo/sửa) → chờ user duyệt nếu task lớn.
3. Code theo 7 bước scaffold ở ARCHITECTURE.md mục 5.
4. Tự verify (mục 3) rồi mới báo xong. Báo cáo ghi rõ file đã đổi + cách đã test.

## 5. Ghi chú môi trường

- Chạy lệnh trong `frontend/` (dùng `workdir`, không `cd`). OS Windows, shell PowerShell.
- Đọc file bằng tool Read, sửa bằng Edit, không dùng `sed`/`echo` để thao tác file.
- Không commit/push/PR khi chưa được yêu cầu.
