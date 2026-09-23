# Master Tasks Index — Frontend Roadmap theo Backend Phases (00–27)

> **Mục đích**: Thư mục này định nghĩa toàn bộ danh sách task chuẩn bị và checklist thực thi cho Frontend, bám sát **thứ tự 28 phase** tại `backend/docs/prompts/`.
> Mỗi file tương ứng 1:1 với 1 prompt của Backend, giúp lập trình viên và AI Agent biết chính xác:
> 1. Đang làm việc cho Phase nào của Backend.
> 2. Cần chuẩn bị những gì trước khi code.
> 3. Cần triển khai những file nào theo đúng quy chuẩn 7 tầng (`ARCHITECTURE.md`).
> 4. Cần verify và cập nhật tài liệu nào trước khi bàn giao (`AGENTS.md`).

---

## 1. Bảng Ma Trận Tiến Độ 28 Phases (BE ↔ FE)

| Phase | Backend Prompt | Trạng thái BE | Trạng thái FE | File Task FE | Ưu tiên hành động |
|:---:|---|:---:|:---:|---|:---:|
| **00** | [`phase-00-foundation.md`](../../../../backend/docs/prompts/phase-00-foundation.md) | `COMPLETED` | 70% | [`phase-00-foundation.md`](./phase-00-foundation.md) | Hoàn thiện Cloudinary config |
| **01** | [`phase-01-auth.md`](../../../../backend/docs/prompts/phase-01-auth.md) | `COMPLETED` | 95% | [`phase-01-auth.md`](./phase-01-auth.md) | Test tay VS-1..VS-8 |
| **02** | [`phase-02-profile-diet.md`](../../../../backend/docs/prompts/phase-02-profile-diet.md) | `COMPLETED` | 90% | [`phase-02-profile-diet.md`](./phase-02-profile-diet.md) | Test tay VP-1..VP-7 |
| **03** | [`phase-03-catalog.md`](../../../../backend/docs/prompts/phase-03-catalog.md) | `COMPLETED` | 75% | [`phase-03-catalog.md`](./phase-03-catalog.md) | Test tay VC-1..VC-6 |
| **04** | [`phase-04-content.md`](../../../../backend/docs/prompts/phase-04-content.md) | `COMPLETED` | 95% | [`phase-04-content.md`](./phase-04-content.md) | Migrate sang Phase 15 & 16 |
| **05** | [`phase-05-search.md`](../../../../backend/docs/prompts/phase-05-search.md) | `COMPLETED` | 75% | [`phase-05-search.md`](./phase-05-search.md) | Test full-text Postgres |
| **06** | [`phase-06-community.md`](../../../../backend/docs/prompts/phase-06-community.md) | `COMPLETED` | 95% | [`phase-06-community.md`](./phase-06-community.md) | Test tay CM-1..CM-4 |
| **07** | [`phase-07-contributors.md`](../../../../backend/docs/prompts/phase-07-contributors.md) | `COMPLETED` | 90% | [`phase-07-contributors.md`](./phase-07-contributors.md) | Giữ baseline; chờ Phase 14 |
| **08** | [`phase-08-moderation.md`](../../../../backend/docs/prompts/phase-08-moderation.md) | `COMPLETED` | 95% | [`phase-08-moderation.md`](./phase-08-moderation.md) | Test tay MA-1..MA-4 & TS |
| **09** | [`phase-09-recommendations.md`](../../../../backend/docs/prompts/phase-09-recommendations.md) | `COMPLETED` | 90% | [`phase-09-recommendations.md`](./phase-09-recommendations.md) | Test tay RC-1..RC-5 |
| **10** | [`phase-10-meal-planner.md`](../../../../backend/docs/prompts/phase-10-meal-planner.md) | `COMPLETED` | 95% | [`phase-10-meal-planner.md`](./phase-10-meal-planner.md) | Test tay MP-1..MP-6 |
| **11** | [`phase-11-ai-chat.md`](../../../../backend/docs/prompts/phase-11-ai-chat.md) | `COMPLETED` | 95% | [`phase-11-ai-chat.md`](./phase-11-ai-chat.md) | Test tay AC-1..AC-6 |
| **12** | [`phase-12-food-data.md`](../../../../backend/docs/prompts/phase-12-food-data.md) | **`COMPLETED`** | `PLANNED` | [`phase-12-food-data.md`](./phase-12-food-data.md) | 🌟 **Xây dựng module mới** |
| **13** | [`phase-13-recipe-nutrition.md`](../../../../backend/docs/prompts/phase-13-recipe-nutrition.md) | `IN_PROGRESS` | `PLANNED` | [`phase-13-recipe-nutrition.md`](./phase-13-recipe-nutrition.md) | Chuẩn bị DTO/Mapper |
| **14** | [`phase-14-unified-contributors.md`](../../../../backend/docs/prompts/phase-14-unified-contributors.md) | `IN_PROGRESS` / `CHANGING` | `PLANNED` | [`phase-14-unified-contributors.md`](./phase-14-unified-contributors.md) | ⚠️ **Breaking migration** |
| **15** | [`phase-15-storage-quota.md`](../../../../backend/docs/prompts/phase-15-storage-quota.md) | **`COMPLETED`** | `PLANNED` | [`phase-15-storage-quota.md`](./phase-15-storage-quota.md) | 🚨 **CẤP BÁCH: Migrate Upload** |
| **16** | [`phase-16-video-review.md`](../../../../backend/docs/prompts/phase-16-video-review.md) | **`COMPLETED`** | `PLANNED` | [`phase-16-video-review.md`](./phase-16-video-review.md) | 🚨 **CẤP BÁCH: Migrate Review** |
| **17** | [`phase-17-custom-meals.md`](../../../../backend/docs/prompts/phase-17-custom-meals.md) | `NOT_STARTED` | `PLANNED` | [`phase-17-custom-meals.md`](./phase-17-custom-meals.md) | Chờ BE Phase 17 |
| **18** | [`phase-18-meal-analysis.md`](../../../../backend/docs/prompts/phase-18-meal-analysis.md) | `NOT_STARTED` | `PLANNED` | [`phase-18-meal-analysis.md`](./phase-18-meal-analysis.md) | Chờ BE Phase 18 |
| **19** | [`phase-19-meal-programs.md`](../../../../backend/docs/prompts/phase-19-meal-programs.md) | `NOT_STARTED` | `PLANNED` | [`phase-19-meal-programs.md`](./phase-19-meal-programs.md) | Chờ BE Phase 19 |
| **20** | [`phase-20-pantry.md`](../../../../backend/docs/prompts/phase-20-pantry.md) | `NOT_STARTED` | `PLANNED` | [`phase-20-pantry.md`](./phase-20-pantry.md) | Chờ BE Phase 20 |
| **21** | [`phase-21-fridge-vision.md`](../../../../backend/docs/prompts/phase-21-fridge-vision.md) | `NOT_STARTED` | `PLANNED` | [`phase-21-fridge-vision.md`](./phase-21-fridge-vision.md) | Chờ BE Phase 21 |
| **22** | [`phase-22-receipts-shopping.md`](../../../../backend/docs/prompts/phase-22-receipts-shopping.md) | `NOT_STARTED` | `PLANNED` | [`phase-22-receipts-shopping.md`](./phase-22-receipts-shopping.md) | Chờ BE Phase 22 |
| **23** | [`phase-23-ai-review.md`](../../../../backend/docs/prompts/phase-23-ai-review.md) | `NOT_STARTED` | `PLANNED` | [`phase-23-ai-review.md`](./phase-23-ai-review.md) | Chờ BE Phase 23 |
| **24** | [`phase-24-restaurants.md`](../../../../backend/docs/prompts/phase-24-restaurants.md) | `NOT_STARTED` | 70% (Scaffold) | [`phase-24-restaurants.md`](./phase-24-restaurants.md) | Chờ BE Phase 24 |
| **25** | [`phase-25-notifications.md`](../../../../backend/docs/prompts/phase-25-notifications.md) | `NOT_STARTED` | 70% (Scaffold) | [`phase-25-notifications.md`](./phase-25-notifications.md) | Chờ BE Phase 25 |
| **26** | [`phase-26-ai-governance.md`](../../../../backend/docs/prompts/phase-26-ai-governance.md) | `NOT_STARTED` | 70% (Scaffold) | [`phase-26-ai-governance.md`](./phase-26-ai-governance.md) | Chờ BE Phase 26 |
| **27** | [`phase-27-hardening.md`](../../../../backend/docs/prompts/phase-27-hardening.md) | `NOT_STARTED` | `PLANNED` | [`phase-27-hardening.md`](./phase-27-hardening.md) | Chuẩn bị checklist release |

---

## 2. Quy Trình Chuẩn Bị Bắt Buộc Trước Khi Vào Làm Bất Kỳ Task Nào (Pre-flight Checklist)

Trước khi viết bất kỳ dòng code nào cho 1 phase, Agent/Dev **BẮT BUỘC** thực hiện tuần tự 5 bước:

### Bước 1: Xác định nguồn dữ liệu & Trạng thái Backend
- [ ] Mở file task tương ứng trong thư mục này (vd: `phase-15-storage-quota.md`).
- [ ] Đọc prompt tham chiếu tại `backend/docs/prompts/phase-XX-*.md`.
- [ ] Kiểm tra trạng thái endpoint tại `frontend/docs/BACKEND_INTEGRATION.md` (chỉ tích hợp các endpoint `READY`).

### Bước 2: Đồng bộ Swagger & Kiểm tra Hợp đồng API
- [ ] Chạy `npm run sync:swagger` (hoặc `node scripts/sync-swagger.mjs ../backend/openapi.json`).
- [ ] Mở file tài liệu endpoint đã sinh tại `frontend/docs/api/<group>.md` để kiểm tra request/response schema.
- [ ] Cập nhật endpoint path vào `src/common/constants/api-endpoints.ts` nếu chưa có. Cấm hard-code URL!

### Bước 3: Kiểm tra Skills & Quy tắc Kiến trúc
- [ ] Đọc lại `frontend/AGENTS.md` và `frontend/docs/ARCHITECTURE.md`.
- [ ] Tuân thủ kỹ năng ngữ cảnh trong `.agents/skills/`:
  - `shadcn`: dùng component chuẩn (`components/ui/*`), không viết lại component cơ bản.
  - `ui-ux-pro-max`: bố cục responsive, bento grid, phân cấp thị giác.
  - `baseline-ui`: timing animation (150ms–300ms), typography, WCAG contrast.
  - `full-output-enforcement`: không viết code rút gọn `// ... existing code ...`.

### Bước 4: Thiết kế 7 Tầng Scaffold
- [ ] **Tầng 1 (Types DTO)**: `src/features/<domain>/types/<name>.dto.ts` (đọc từ swagger schema, cho phép nullable/snake_case).
- [ ] **Tầng 2 (Types Model)**: `src/features/<domain>/types/<name>.model.ts` (dữ liệu sạch cho UI, camelCase, typed).
- [ ] **Tầng 3 (Mapper)**: `src/features/<domain>/mappers/<name>.mapper.ts` (kế thừa `BaseMapper`, dùng `pickField`, `safe*`).
- [ ] **Tầng 4 (Unit Test)**: `src/features/<domain>/mappers/<name>.mapper.test.ts` (test đầy đủ trường hợp null, rỗng, hợp lệ).
- [ ] **Tầng 5 (API Client)**: `src/features/<domain>/api/<name>.api.ts` (gọi axios + mapper, không trả DTO ra ngoài).
- [ ] **Tầng 6 (TanStack Query)**: `src/features/<domain>/queries/<name>.queries.ts` (Key Factory + query/mutation hooks, xử lý error toast).
- [ ] **Tầng 7 (UI Components & Zod)**: `src/features/<domain>/components/*` & `schemas/*` (xử lý 4 trạng thái: Loading, Error, Empty, Success; 100% tiếng Việt).

### Bước 5: Kiểm tra Verification Gates & Cập nhật Nhật ký
- [ ] Chạy `node node_modules/typescript/bin/tsc --noEmit` (0 lỗi).
- [ ] Chạy `npm test` (toàn bộ test suite pass, không regress).
- [ ] Chạy `npm run build` (build Next.js thành công).
- [ ] Cập nhật `frontend/docs/BACKEND_INTEGRATION.md` (cột `FE integrated` và changelog).
- [ ] Cập nhật `frontend/docs/PROGRESS.md` (% hoàn thành và history).
- [ ] Cập nhật `frontend/docs/WORK-LOG.md` theo mẫu chuẩn.
