# AGENTS.md — Chỉ dẫn bắt buộc cho Agent làm việc tại Frontend

> Bạn là coding agent làm việc trong workspace **`frontend/`** thuộc dự án **vegan-support-application**.
> **ĐỌC KỸ FILE NÀY TRƯỚC TIÊN**. Phải tuân thủ nghiêm ngặt các quy tắc kiến trúc, quy trình nhận task và quy định sử dụng Skills dưới đây trước khi viết bất kỳ dòng code nào.

---

## 1. Thứ tự đọc tài liệu bắt buộc (trước khi nhận task)

Đọc theo đúng số thứ tự. Hầu hết tài liệu nằm trong `docs/` hoặc thư mục gốc:

| # | Tài liệu | Nội dung trọng tâm cần nắm |
|---|---|---|
| **1** | `../docs/SRS.md` | Nguồn yêu cầu sản phẩm chuẩn duy nhất; phân biệt rõ MVP và năng lực đang chạy. |
| **2** | `../docs/IMPLEMENTATION_PLAN.md` | Business logic, state machine, quyết định đã duyệt và thứ tự triển khai. |
| **3** | `docs/ARCHITECTURE.md` | **Quan trọng nhất cho code frontend.** Luật code 7 tầng scaffold, DTO → Mapper → Model, rule cấm trang mồ côi, nhật ký bắt buộc. |
| **4** | `docs/BACKEND_INTEGRATION.md` | Trạng thái API Backend (`READY`, `IN_PROGRESS`...). **Chỉ tích hợp các endpoint đã READY**. |
| **5** | `docs/API-CATALOG.md` | Catalog đã sinh và quy trình đồng bộ API từ Swagger BE (`npm run sync:swagger`). **Cấm đọc swagger gốc** khi code feature. |
| **6** | `../docs/ROADMAP_PHASE_2.md` | Backlog sau MVP để giữ định hướng; không biến thành capability hiện tại. |
| **7** | `docs/PROGRESS.md` & `docs/WORK-LOG.md` | Nơi theo dõi tiến độ % và nhật ký công việc. Agent **bắt buộc cập nhật sau mỗi task**. |
| **8** | `package.json`, `components.json`, `tsconfig.json` | Tech stack (Next.js 16, React 19, Tailwind v4, shadcn/ui style `new-york` base `radix`), path alias `@/*`. |
| **9** | `src/app/layout.tsx`, `src/middleware.ts`, `src/lib/auth-refresh.ts` | App shell, cơ chế Auth session, HttpOnly cookie, silent-refresh chống race condition. |
| **10** | `src/lib/mapper/` + `src/common/constants/api-endpoints.ts` | Base mapper, contract API tập trung. |
| **11** | `src/features/category/*` hoặc `src/features/profile/*` | **Feature mẫu chuẩn end-to-end**: DTO → Model → Mapper → API → Query → Components. Mọi feature mới phải theo đúng mẫu này. |

*Lưu ý:* `docs/SRS_Vegan_Support_Application.md` và `docs/SRS_Production.md` chỉ là tài liệu tham khảo/lịch sử. Nếu mâu thuẫn, dùng `../docs/SRS.md`. Tuyệt đối không đọc `node_modules/`, `.next/`, file build artifacts hoặc đọc trực tiếp file swagger json thô khi chưa cần thiết.

### Xác nhận đã hiểu (trả lời 3 câu này trước khi nhận task)

1. DTO / Model / Mapper đặt ở đâu, ai được phép đọc DTO?
2. Component lấy data qua tầng nào (client và server)?
3. Thêm endpoint mới thì sửa file gì **trước tiên**?

---

## 2. Quy tắc BẮT BUỘC sử dụng Skills (`.agents/skills/`) theo ngữ cảnh

Hệ sinh thái dự án trang bị sẵn các bộ kỹ năng chuyên sâu tại `.agents/skills/`. **Khi gặp ngữ cảnh công việc tương ứng, Agent BẮT BUỘC phải mở file `SKILL.md` của skill đó ra đọc và tuân thủ các nguyên tắc thiết kế/kỹ thuật:**

### 🎨 2.1. Xây dựng UI / Component / Layout / Styling
- **`shadcn`** (`.agents/skills/shadcn/SKILL.md`):
  - Bắt buộc tham chiếu khi thêm, cấu hình hoặc sửa các component UI cơ bản.
  - Tuân thủ quy chuẩn `components/ui/*`, không tự viết lại component nếu shadcn đã hỗ trợ.
- **`ui-ux-pro-max`** (`.agents/skills/ui-ux-pro-max/SKILL.md`):
  - Tham chiếu khi thiết kế màn hình, căn chỉnh typography, phân cấp thị giác (visual hierarchy), bento grid, responsive layout, form validation states.
- **`baseline-ui`** (`.agents/skills/baseline-ui/SKILL.md`):
  - Kiểm tra thang đo typography, độ tương phản accessibility, timing animation chuẩn (150ms–300ms), ngăn chặn layout anti-patterns.
- **`design-taste-frontend`** & **`impeccable`**:
  - Triệt tiêu giao diện AI khuôn mẫu (anti-slop), đảm bảo giao diện cao cấp, màu sắc hài hòa với định vị thương hiệu ăn chay hiện đại VeggieConnect.

### 🎬 2.2. Hoạt cảnh, Chuyển động & Hiệu năng Motion
- **`remotion-best-practices`** (`.agents/skills/remotion-best-practices/SKILL.md`):
  - Bắt buộc mở khi làm việc với Remotion (`@remotion/player`, Composition, SVG animation, interpolate, spring physics).
- **`fixing-motion-performance`** (`.agents/skills/fixing-motion-performance/SKILL.md`):
  - **Quy tắc hiệu năng thép:** Mọi animation bắt buộc phải đạt 60 FPS mượt mà trên cả desktop và mobile.
  - **100% GPU Compositor properties:** Chỉ được animate qua `transform` (`translate3d`, `rotate`, `scale`) và `opacity`. Tuyệt đối **CẤM** animate các thuộc tính gây layout thrashing (`top`, `left`, `width`, `height`, `margin`, `padding`).
  - Phải luôn hỗ trợ `prefers-reduced-motion` và skeleton fallback chống Cumulative Layout Shift (CLS).

### ⚡ 2.3. Kiến trúc Next.js App Router & Server Components
- **`next-best-practices`** (`.agents/skills/next-best-practices/SKILL.md`):
  - Phân tách rõ ràng ranh giới Server Components (RSC) và Client Components (`'use client'`).
  - Xử lý route handlers, cookie HttpOnly, metadata SEO động, tối ưu nén ảnh với Next.js `<Image>`.

### 🔍 2.4. Phân tích tác động & Tracing mã nguồn
- **`codegraph`** (`.agents/skills/codegraph/SKILL.md`):
  - Áp dụng khi cần trace call hierarchy, data flow phức tạp hoặc đánh giá rủi ro ảnh hưởng lan rộng (blast radius) trước khi refactor.

### 📝 2.5. Đặc tả & Lập kế hoạch tính năng lớn
- **Bộ skill `speckit-*`** (`speckit-specify`, `speckit-plan`, `speckit-tasks`, `speckit-implement`):
  - Bắt buộc áp dụng khi nhận yêu cầu tính năng lớn, phức tạp: Phải phân tích spec, lập implementation plan và chia nhỏ task có checklist trước khi code.

### 🛡️ 2.6. Trọn vẹn chất lượng Code (Anti-Truncation)
- **`full-output-enforcement`** (`.agents/skills/full-output-enforcement/SKILL.md`):
  - **Nghiêm cấm** viết code cắt xén, placeholder giả dạng `// ... existing code ...` hoặc bỏ lửng hàm. Mọi file được tạo hoặc chỉnh sửa phải hoàn chỉnh 100% logic.

---

## 3. Quy chuẩn kiến trúc cốt lõi (Xem chi tiết tại `docs/ARCHITECTURE.md`)

1. **Bộ ba DTO - Model - Mapper**:
    - Mọi dữ liệu từ API phải qua DTO → Mapper (`pickField`, `safe*`, kế thừa `BaseMapper`) → Model.
   - UI Component chỉ được phép đọc và hiển thị **UI Model**, tuyệt đối không đọc trực tiếp DTO.
   - Không bọc 2 tầng `APIResponse<*ResponseDto>` ở api layer.
2. **Nghiêm cấm tuyệt đối**:
   - `any`, `as any`, `@ts-ignore`, `Record<string, any>`.
   - Hard-code URL API trong feature (phải khai báo tập trung trong `src/common/constants/api-endpoints.ts`).
   - Import tương đối sâu `../../..` (bắt buộc dùng alias `@/*`).
   - Lưu trữ server-state vào Zustand (Zustand chỉ dành cho client-state: auth session memory, theme).
3. **Quản lý dữ liệu**:
   - Dùng **TanStack Query** cho toàn bộ server-state; bắt buộc tạo Query Key Factory và xử lý triệt để 4 trạng thái: Loading, Error, Empty, Success.
4. **Quy tắc cấm trang mồ côi (No Orphan Pages)**:
   - Bất kỳ trang nào tồn tại phải có ít nhất một lối vào tự nhiên từ UI (Header/Footer/Context link).
   - Trang admin phải kiểm tra quyền `ADMIN` trên thanh điều hướng.
5. **Ngôn ngữ UI**: Toàn bộ nhãn, thông báo, nút bấm hiển thị cho người dùng phải dùng **tiếng Việt**.

---

## 4. Quy trình nhận và bàn giao task chuẩn

1. **Phân tích yêu cầu**: Đối chiếu SRS, kiểm tra trạng thái API trong `docs/BACKEND_INTEGRATION.md`. Mở skill tương ứng để đối chiếu tiêu chuẩn.
2. **Lập kế hoạch**: Trình bày rõ các file sẽ tạo/sửa theo 7 bước scaffold nếu là feature mới.
3. **Triển khai**: Viết code sạch, kèm mapper unit test.
4. **Xác minh chất lượng bắt buộc (Verification Gates)**:
   - `npx tsc --noEmit` (0 lỗi type).
   - `npm test` (toàn bộ test suite pass, không được regress).
   - `npm run build` (build Next.js thành công).
5. **Cập nhật tài liệu tiến độ**:
   - Cập nhật mục tương ứng trong `docs/PROGRESS.md`.
   - Viết nhật ký công việc vào `docs/WORK-LOG.md` theo đúng mẫu chuẩn.

---

## 5. Môi trường làm việc

- Hệ điều hành: Windows, Shell: PowerShell.
- Thư mục làm việc: luôn chạy lệnh tại context `frontend/`.
- Thao tác file: Luôn dùng tool Read/Edit/Write của hệ thống, không dùng lệnh shell thô (`echo`, `Set-Content`) để tránh lỗi hỏng mã hóa UTF-8.
