# Task: Phase 27 — MVP Hardening & Cross-cutting Release Gate

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-27-hardening.md`](../../../../backend/docs/prompts/phase-27-hardening.md)
> **Trạng thái Backend**: `NOT_STARTED`
> **Trạng thái Frontend**: `PLANNED`
> **Phụ thuộc**: Toàn bộ các Phase từ 00 đến 26
> **Mức độ ưu tiên**: 🛡️ **CỔNG CHẤT LƯỢNG NGHIỆM THU MVP**

---

## 1. Bối cảnh & Mục tiêu

Giai đoạn tối ưu hóa, rà soát bảo mật, độ trễ và nghiệm thu chất lượng toàn diện trước khi phát hành MVP chính thức:
- Đảm bảo 100% các tiêu chí chất lượng và quy chuẩn kiến trúc của dự án được thỏa mãn.
- Rà soát toàn bộ rủi ro hiệu năng, memory leak, trải nghiệm trên mobile và desktop.
- Đảm bảo tính nhất quán của giao diện người dùng tiếng Việt.

---

## 2. Checklist Cổng Nghiệm Thu Chất Lượng (Release Gate Checklist)

### 2.1 Kiến trúc & Mã nguồn
- [ ] Không có bất kỳ lỗi type: `node node_modules/typescript/bin/tsc --noEmit` đạt 0 lỗi.
- [ ] Toàn bộ unit tests pass: `npm test` đạt 100% (dự kiến >300 tests khi hoàn thiện).
- [ ] Build thành công: `npm run build` không có cảnh báo nghiêm trọng, tạo đầy đủ các routes.
- [ ] Quy tắc cấm tuyệt đối: Không còn bất kỳ từ khóa `any`, `as any`, `@ts-ignore` trong toàn bộ `src/`.
- [ ] Không có trang mồ côi (No orphan pages): Mọi route đều có liên kết điều hướng tự nhiên từ Header, Footer hoặc Context Link.

### 2.2 Hiệu năng & Motion (Tuân thủ `fixing-motion-performance`)
- [ ] Mọi hoạt cảnh đạt 60 FPS mượt mà trên cả desktop và thiết bị di động tầm trung.
- [ ] 100% thuộc tính animate chỉ dùng GPU Compositor (`transform` translate3d/scale/rotate, `opacity`).
- [ ] Tuyệt đối không animate các thuộc tính gây layout thrashing (`width`, `height`, `top`, `left`, `margin`, `padding`).
- [ ] Hỗ trợ đầy đủ `prefers-reduced-motion` cho người dùng nhạy cảm với chuyển động.
- [ ] Tối ưu hình ảnh: Tất cả hình ảnh dùng thẻ `<Image>` của Next.js hoặc WebP nén <500KB.

### 2.3 Giao diện & Tiếp cận (Tuân thủ `baseline-ui` & `ui-ux-pro-max`)
- [ ] Toàn bộ nhãn, thông báo lỗi, nút bấm, placeholder hiển thị 100% bằng **tiếng Việt**.
- [ ] Đạt chuẩn tương phản màu sắc Web Accessibility (WCAG 2.1 AA) cho cả Light và Dark mode.
- [ ] Xử lý triệt để 4 trạng thái trên mọi màn hình: Đang tải (Skeleton), Lỗi (Error boundary + nút thử lại), Rỗng (Empty state minh họa đẹp mắt), Thành công (Success).
- [ ] Đáp ứng hoàn hảo trên mọi kích thước màn hình: Mobile (375px), Tablet (768px), Desktop (1280px+).

### 2.4 An toàn Nghiệp vụ (Business-rule Safety)
- [ ] Không bao giờ gợi ý món ăn có chứa nguyên liệu người dùng bị dị ứng.
- [ ] Người dùng chưa đăng nhập không bao giờ truy cập được trang quản trị Admin hoặc hồ sơ cá nhân.
- [ ] Giới hạn tải file và hạn ngạch lưu trữ 1 GiB được kiểm soát chặt chẽ.
- [ ] Các thông báo pháp lý và miễn trừ y tế luôn hiển thị rõ ràng trên Trợ lý AI và bảng dinh dưỡng.
