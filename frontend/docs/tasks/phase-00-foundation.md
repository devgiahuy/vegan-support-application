# Task: Phase 00 — Frontend Foundation & Shell

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-00-foundation.md`](../../../../backend/docs/prompts/phase-00-foundation.md)
> **Trạng thái Backend**: `COMPLETED`
> **Trạng thái Frontend**: 70% (Đã có App shell, Providers, Remotion Hero, Logo, Theme)
> **Mức độ ưu tiên**: 🟢 Hoàn thiện nốt phần cấu hình hạ tầng

---

## 1. Bối cảnh & Mục tiêu

Thiết lập toàn bộ khung nền tảng cho ứng dụng Next.js 16 (App Router), bao gồm hệ thống layout, app providers, interceptor mạng, chuẩn hóa mapper, nhận diện thương hiệu VeggieConnect và animation Hero.

---

## 2. Checklist Đã Hoàn Thành
- [x] Cài đặt Next.js 16, React 19, TypeScript strict, Tailwind v4, shadcn/ui.
- [x] Thiết lập `src/app/layout.tsx` với đầy đủ tầng providers: `QueryProvider` > `ThemeController` > `AuthProvider` > `SiteHeader` > `Toaster`.
- [x] Cấu hình `src/lib/axios.ts` với refresh token queue, Bearer in-memory, silent-refresh, toast error tập trung.
- [x] Xây dựng bộ lõi mapper: `BaseMapper`, `BaseBidirectionalMapper`, `pickField`, `safe*` helpers.
- [x] Tích hợp bộ nhận diện thương hiệu VeggieConnect: Logo mark (512x512, favicon, apple-icon), Logo horizontal (light & dark).
- [x] Hoạt cảnh Hero Section 2D Food Animation bằng Remotion 60 FPS, WebP nén <500KB, hỗ trợ `prefers-reduced-motion`.

---

## 3. Checklist Công Việc Còn Lại Cần Chuẩn Bị
- [ ] Kiểm tra kết nối Health check backend `GET /api/v1/health` từ ứng dụng frontend khi khởi động.
- [ ] Đảm bảo biến môi trường `NEXT_PUBLIC_API_URL` và `CLOUDINARY_CLOUD_NAME` được cấu hình đầy đủ trong `.env.local`.
- [ ] Rà soát và ngăn chặn rò rỉ secret hoặc API keys lên client bundle.
