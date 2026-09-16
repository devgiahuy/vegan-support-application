# Research: FE English Routes Rename

**Feature**: `004-fe-english-routes` | **Date**: 2026-09-16
**Spec**: [spec.md](./spec.md)

## Decision 1 — Cơ chế redirect URL cũ → mới

- **Decision**: Dùng `redirects()` trong `next.config.ts` với `permanent: true` (HTTP 308) cho toàn bộ cặp old→new; không nhét logic rename vào `src/middleware.ts`.
- **Rationale**: 308 giữ nguyên method + query string tự động, tốt cho SEO/bookmark; cấu hình build-time, dễ review một chỗ; `middleware.ts` hiện chỉ lo auth (`/login`, `/profile`, `/admin`) nên giữ tách bạch, tránh trộn auth + rename trong Edge runtime.
- **Alternatives considered**:
  - Redirect trong `middleware.ts` bằng `NextResponse.redirect` — loại vì mỗi request chạy Edge logic, khó liệt kê hết 20+ cặp, dễ xung đột với redirect auth (`?from=`).
  - Component `redirect()` từng page cũ — loại vì phải giữ page cũ tồn tại, tạo nội dung trùng lặp, không trả 308 chuẩn SEO.

## Decision 2 — Cách đổi thư mục route App Router

- **Decision**: `git mv` từng thư mục lá trong `src/app/(site)` và `src/app/(auth)`, giữ nguyên route group (`(site)`, `(auth)`, `(admin)`), chỉ đổi slug lá theo bảng mapping.
- **Rationale**: Giữ history git, layout theo group không đổi (`(site)/layout.tsx`, `(auth)/layout.tsx` giữ nguyên), giảm rủi ro vỡ layout. Route động `[id]` giữ nguyên tên param để code `params.id` không phải sửa.
- **Alternatives considered**:
  - Xóa + tạo mới thư mục — loại vì mất history, dễ sót file.
  - Đổi cả tên group — loại vì group không ảnh hưởng URL, đổi gây nhiễu không cần thiết.

## Decision 3 — Xử lý `/video/upload` trùng chức năng

- **Decision**: Xóa route `/video/upload`, thêm redirect `/video/upload` → `/videos/new`.
- **Rationale**: File hiện tại chỉ có `redirect('/dang-video')`; sau rename giữ lại sẽ thành redirect-chồng-redirect. Một URL tạo video duy nhất (`/videos/new`) đúng FR-005.
- **Alternatives considered**: Giữ `/video/upload` như alias — loại vì duy trì 2 URL cùng chức năng, trái spec.

## Decision 4 — Tên tiếng Anh cho `/bai-viet`

- **Decision**: `/articles` (list `/articles`, new `/articles/new`, detail `/articles/[id]`, edit `/articles/[id]/edit`).
- **Rationale**: Backend dùng `/posts` generic cho cả recipes/blogs/videos; FE đang tách articles (cẩm nang) khỏi recipes/videos trong nav. Dùng `/posts` ở FE sẽ gây nhầm FE-route với BE-resource. `/blog` số ít/khó mở rộng loại; `/articles` rõ nghĩa, khớp `features/post` (post-card/detail dùng cho articles).
- **Alternatives considered**: `/posts`, `/blog` — loại theo lý do trên, đã ghi trong Assumptions của spec.

## Decision 5 — Tên tiếng Anh cho `/ban-do`

- **Decision**: `/restaurants` + `/restaurants/[id]`.
- **Rationale**: Đồng bộ trực tiếp backend module Restaurants (`/restaurants/nearby`, `/restaurants/search`, `/restaurants/:id`); dev tìm file theo từ khóa `restaurant` ra ngay. UI map+list giữ nguyên, chỉ đổi slug.
- **Alternatives considered**: `/map`, `/locations` — loại vì lệch tên BE resource, khó truy xuất như mục tiêu feature.

## Decision 6 — Tên tiếng Anh cho `/tro-ly-ai`

- **Decision**: `/assistant`.
- **Rationale**: Ngắn, thân thiện URL người dùng; backend vẫn là `/chat/sessions` cho API nên không cần trùng tuyệt đối, chỉ cần dễ đoán và nhất quán trong FE docs.
- **Alternatives considered**: `/chat`, `/ai-assistant` — `/chat` dễ nhầm với realtime chat (ngoài phạm vi), `/ai-assistant` dài hơn mà không thêm rõ nghĩa.

## Decision 7 — SEO: canonical, sitemap, metadata chia sẻ

- **Decision**: URL mới là canonical duy nhất; URL cũ chỉ redirect, không render; `copy-link` bài viết và Open Graph URL dùng URL mới; kiểm tra không có file `sitemap.ts`/robots hard-code URL cũ (hiện tại grep không thấy sitemap trong `src/`, nếu có thì cập nhật).
- **Rationale**: Tránh duplicate content; crawler chỉ index URL mới. Redirect 308 server-side nên crawler tự cập nhật index.
- **Alternatives considered**: Render cả 2 URL — loại vì duplicate content, hại SEO.

## Decision 8 — Chiến lược cập nhật link nội bộ (~96 vị trí)

- **Decision**: Cập nhật trực tiếp mọi string URL Việt trong `site-header.tsx`, `site-footer.tsx`, `site` pages, `features/*/components` (recipe-card, post-card/detail, restaurant views, category-tree...), form `action="/tim-kiem"`, `router.push/replace`, `redirect()`, `clipboard.writeText`; sau đó quét lại bằng grep để chứng minh 0 link cũ.
- **Rationale**: Không có route-constant tập trung cho FE pages hiện tại (chỉ có `api-endpoints.ts` cho BE API), nên phải sửa tại chỗ + verify bằng grep. NAV_ITEMS trong header/footer là điểm vào chính theo rule orphan-page.
- **Alternatives considered**: Tạo `frontend-routes.ts` constant mới — ghi nhận là cải tiến tốt nhưng ngoài phạm vi rename tối thiểu; có thể đề xuất ở tasks follow-up, không bắt buộc để đạt spec.

## Decision 9 — Middleware + auth `?from=`

- **Decision**: Cập nhật `src/middleware.ts` matcher và mọi `redirectToLogin`/`getSafeRedirectTarget` để dùng `/profile` thay `/ho-so` (hiện matcher có `/profile` nhưng app dùng `/ho-so` — rename lần này khớp chúng lại); `login?page` giữ `getSafeRedirectTarget` chống open-redirect như hiện tại.
- **Rationale**: Sau rename không còn `/ho-so`; matcher `/profile` mới có tác dụng thật. Tham số `from` phải là URL tiếng Anh để login xong quay lại đúng trang mới.
- **Alternatives considered**: Giữ matcher cũ — loại vì bảo vệ sai path.

## Open items resolved

Tất cả `NEEDS CLARIFICATION` trong Technical Context đã được giải quyết bằng khảo sát code thật (25 `page.tsx`, `next.config.ts`, `middleware.ts`, header/footer, grep 96 link). Không còn unknown chặn plan.
