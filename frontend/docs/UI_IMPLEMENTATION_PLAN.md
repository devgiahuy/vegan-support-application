# UI IMPLEMENTATION PLAN — VeggieConnect / ChayXanh

> Căn cứ: `docs/SRS_Vegan_Support_Application.md`, `docs/UI_UX_DESIGN_PROMPT.md`,
> và 9 màn hình Stitch trong `stitch_vietvegan_companion/`.
> Quy tắc kỹ thuật: xem `docs/ARCHITECTURE.md`. Ngôn ngữ UI: tiếng Việt.

## 0. Quyết định nền tảng

- **Nền mặc định màu TRẮNG** (`--background: #ffffff`) theo yêu cầu. Bỏ nền kem/xanh của Stitch.
- **Dark mode**: dùng `next-themes` (`attribute="class"`), mặc định `light`, có nút đổi Sáng/Tối trên header. Token dark khai báo trong `globals.css`.
- **Màu thương hiệu**: theo Stitch — primary xanh lá `#2E7D32`, secondary `#8BC34A`, CTA cam `#FF8F00`. Map vào token shadcn (`--primary`, `--secondary`, `--accent`).
- **Font**: `Be Vietnam Pro` qua `next/font/google` (subset `vietnamese`), gán `--font-sans`.
- **Icon**: `lucide-react` (thay Material Symbols).
- **Dữ liệu**: giai đoạn UI dùng mock data tĩnh (chưa có BE API). Khi có API sẽ bổ sung DTO/Model/Mapper theo ARCHITECTURE.
- **Fidelity**: implement đúng cấu trúc + nội dung; bỏ các block "demo/QA" của Stitch (edge-case auth, state-preview, nút demo lag); giữ đủ loading/empty/error.

## 1. Mapping màn hình Stitch (đã có) → route

| #   | Màn Stitch                  | Route          | Nhóm layout | SRS/UC       |
| --- | --------------------------- | -------------- | ----------- | ------------ |
| 1   | Trang chủ                   | `/`            | (site)      | UC-04, UC-14 |
| 2   | Đăng nhập/Đăng ký/Khôi phục | `/login`       | (auth)      | UC-01        |
| 3   | Khám phá công thức          | `/recipes`     | (site)      | UC-04        |
| 4   | Đăng công thức              | `/recipes/new` | (site)      | UC-02, UC-16 |
| 5   | Kế hoạch bữa ăn 7 ngày      | `/meal-plans`  | (site)      | UC-06, UC-08 |
| 6   | Hồ sơ & BMI                 | `/profile`     | (site)      | UC-13, UC-06 |
| 7   | Bản đồ quán chay            | `/restaurants` | (site)      | UC-12        |
| 8   | Trợ lý AI                   | `/assistant`   | (site)      | UC-07        |
| 9   | Admin dashboard             | `/admin`       | (admin)     | UC-11, UC-15 |

→ Stitch **không dư trang nào** so với SRS/UI-UX (tất cả đều map được vào UC).

## 2. Các trang còn THIẾU (báo cáo để lên plan đợt sau)

### Ưu tiên cao (luồng chính chưa có)

1. **Onboarding / Splash + Khai báo trường phái chay** (Phật giáo/Đạo giáo, chay trường/chay kỳ) — UC-01.
2. **Chi tiết công thức** `/recipes/[id]` — UC-04 (hiện chỉ có danh sách).
3. **Trung tâm gợi ý "Vì sao tôi thấy gợi ý này"** + tắt cá nhân hoá — UC-08.
4. **Danh sách + chi tiết Video** & **Upload video** — UC-05, UC-10.
5. **Chi tiết quán ăn** `/restaurants/[id]` — UC-12.
6. **Danh sách thực đơn đã lưu** — UC-06/UC-08.
7. **Xác thực email / OTP** — UC-01.

### Ưu tiên trung bình

8. **CV nhận diện nguyên liệu tủ lạnh** — UC-09.
9. **Tạo thực đơn cộng đồng** + **Dashboard Người đóng góp** — UC-16.
10. **Expert Review Queue** + **màn kiểm chứng AI** + **hồ sơ công khai Chuyên gia** + **form đăng ký Expert/Experienced** — UC-17.
11. **Cài đặt & Quyền riêng tư** (consent, "Dữ liệu hành vi của tôi", xoá dữ liệu) — NĐ 13/2023.

### Ưu tiên thấp / Admin bổ sung

12. **Duyệt vai trò** (Expert/Experienced) — UC-17.
13. **Giám sát AI Models** (drift, chi phí, feature toggle) — UC-15.
14. **Quản lý quán ăn** — UC-12.
15. **Thông báo** & **Tìm kiếm người dùng / hồ sơ công khai** — UC-03.

## 3. Kiến trúc thư mục áp dụng cho đợt này

```
src/app/
├── layout.tsx                 # html/body + providers + Toaster (KHÔNG header/container)
├── (site)/                    # nhóm layout public: SiteHeader + children + SiteFooter
│   ├── layout.tsx
│   ├── page.tsx               # Trang chủ
│   ├── recipes/page.tsx
│   ├── recipes/new/page.tsx
│   ├── meal-plans/page.tsx
│   ├── profile/page.tsx
│   ├── restaurants/page.tsx
│   └── assistant/page.tsx
├── (auth)/layout.tsx          # layout tối giản cho auth
│   └── login/page.tsx
└── (admin)/admin/page.tsx     # sidebar admin riêng
src/components/layout/         # site-header, site-footer, mobile-nav, admin-sidebar
src/features/<domain>/components/  # UI riêng từng màn (mock data đặt cùng)
```

- Mock data đặt trong `features/<domain>/data.mock.ts` (typed Model-like). Khi có API thay bằng queries/mapper.

## 4. Thứ tự thực thi

1. Design tokens (trắng + dark) + font + theme mặc định light.
2. Restructure layout + SiteHeader/Footer/MobileNav.
3. Trang chủ → Đăng nhập → Khám phá → Đăng công thức → Kế hoạch bữa ăn → Hồ sơ/BMI → Bản đồ → Trợ lý AI → Admin.
4. Verify `tsc --noEmit` + `npm run build`; dọn lint phần code mới.

## 5. Ghi chú còn lại cho đợt code

- Bản đồ: tạm dùng SVG/khung placeholder; tích hợp Google Maps Platform (UC-12) là hạng mục riêng cần API key.
- Chat AI: UI streaming giả lập; nối AI Gateway sau.
- Không có `WHtR` trong Stitch — sẽ bổ sung field theo SRS UC-13 khi làm hồ sơ.
