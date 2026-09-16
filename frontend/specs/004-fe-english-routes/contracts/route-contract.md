# Route Contract: Vietnamese → English

**Feature**: `004-fe-english-routes` | **Date**: 2026-09-16
**Spec**: [../spec.md](../spec.md) | **Data model**: [../data-model.md](../data-model.md)

> Contract UI cho toàn bộ URL đổi trong feature này. Mọi kiểm thử hồi quy bám file này.

## 1. Redirect contract (`next.config.ts` → `redirects()`)

Tất cả entry dùng `permanent: true` (308). Query string được bảo toàn tự động; hash do browser giữ.

```ts
// Hình dung contract — code thật nằm ở next.config.ts khi implement
const routeRedirects = [
  { source: '/cong-thuc', destination: '/recipes', permanent: true },
  { source: '/cong-thuc/:id', destination: '/recipes/:id', permanent: true },
  { source: '/dang-cong-thuc', destination: '/recipes/new', permanent: true },
  { source: '/bai-viet', destination: '/articles', permanent: true },
  { source: '/bai-viet/tao-moi', destination: '/articles/new', permanent: true },
  { source: '/bai-viet/:id', destination: '/articles/:id', permanent: true },
  { source: '/bai-viet/:id/chinh-sua', destination: '/articles/:id/edit', permanent: true },
  { source: '/video', destination: '/videos', permanent: true },
  { source: '/video/:id', destination: '/videos/:id', permanent: true },
  { source: '/dang-video', destination: '/videos/new', permanent: true },
  { source: '/video/upload', destination: '/videos/new', permanent: true },
  { source: '/danh-muc', destination: '/categories', permanent: true },
  { source: '/ban-do', destination: '/restaurants', permanent: true },
  { source: '/ban-do/:id', destination: '/restaurants/:id', permanent: true },
  { source: '/tim-kiem', destination: '/search', permanent: true },
  { source: '/ho-so', destination: '/profile', permanent: true },
  { source: '/ke-hoach-bua-an', destination: '/meal-plans', permanent: true },
  { source: '/ke-hoach-bua-an/da-luu', destination: '/meal-plans/saved', permanent: true },
  { source: '/tro-ly-ai', destination: '/assistant', permanent: true },
  { source: '/xac-thuc-otp', destination: '/verify-otp', permanent: true },
];
```

**Lưu ý thứ tự**: các rule tĩnh (`/bai-viet/tao-moi`, `/ke-hoach-bua-an/da-luu`, `/video/upload`) phải đứng trước rule động (`/bai-viet/:id`) để không bị nuốt param.

## 2. Navigation contract (link nội bộ phải dùng URL mới)

| Vị trí | URL mới |
|---|---|
| Header `NAV_ITEMS` | `/recipes`, `/articles`, `/meal-plans`, `/restaurants`, `/assistant` |
| Header search form `action` | `/search` |
| Header AI button | `/assistant` |
| Header user dropdown | `/profile`, `/admin` |
| Footer Khám phá | `/recipes`, `/categories`, `/meal-plans`, `/restaurants`, `/assistant` |
| Footer Đóng góp | `/recipes/new` (thay `/dang-cong-thuc`) |
| Home CTAs | `/recipes`, `/assistant`, `/meal-plans`, `/restaurants` |
| Recipe card/detail/breadcrumb | `/recipes`, `/recipes/[id]` |
| Post card/detail/editor (share/copy-link) | `/articles`, `/articles/[id]`, `/articles/new`, `/articles/[id]/edit`, `/profile?tab=posts` |
| Video list/detail | `/videos`, `/videos/[id]`, `/videos/new` |
| Category tree links | `/categories?type=` |
| Restaurant views | `/restaurants`, `/restaurants/[id]` |
| Profile page links | `/recipes/new`, `/articles/new`, `/articles/[id]`, `/articles/[id]/edit`, `/meal-plans/saved` |
| Meal-plan page links | `/meal-plans/saved`, `/meal-plans`, `/restaurants` |
| Search page | `/search?q=`, `/articles`, `/recipes`, `/videos/[id]` |

## 3. Auth/middleware contract

- `middleware.ts` matcher giữ `/profile/:path*`, `/admin/:path*`, `/login` (đã đúng URL mới sau rename); không thêm matcher URL cũ.
- Redirect `?from=` chứa URL tiếng Anh (ví dụ `/profile`, `/meal-plans`).
- `login/page.tsx:getSafeRedirectTarget` giữ nguyên logic chống open-redirect, chỉ khác là target giờ là URL mới.

## 4. SEO/metadata contract

- Canonical + OG URL = URL mới trên mọi page.
- Không render nội dung trên URL cũ (chỉ 308).
- `copy-link` trong `post-card.tsx` dùng `${origin}/articles/${id}`.
