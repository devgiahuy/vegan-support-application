# Data Model: FE English Routes Rename

**Feature**: `004-fe-english-routes` | **Date**: 2026-09-16
**Spec**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

> Phạm vi này không thêm table database. Các "entity" dưới đây là entity thiết kế phục vụ rename + kiểm thử hồi quy.

## Entity 1 — Route (trang FE)

| Field | Type | Rule |
|---|---|---|
| `oldPath` | string | Slug Việt hiện tại, bắt đầu `/`, ví dụ `/cong-thuc`. `ROOT` (`/`) không đổi. |
| `newPath` | string | Slug Anh, kebab-case, không dấu, ví dụ `/recipes`. Duy nhất toàn app. |
| `segmentType` | enum | `static` \| `dynamic-[id]` \| `nested` (ví dụ `/meal-plans/saved`, `/articles/[id]/edit`). |
| `routeGroup` | enum | `(site)` \| `(auth)` \| `(admin)` \| `root`. Group giữ nguyên sau rename. |
| `auth` | enum | `public` \| `member` \| `admin`. Dùng để đối chiếu middleware/guard. |
| `entryPoints` | string[] | ≥1 điểm vào UI (header/footer/breadcrumb/CTA). Bắt buộc theo rule orphan-page. |

**Validation**:
- `newPath` matching `^/[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9\[\]-]+)*$`, không chứa tiếng Việt có dấu.
- Mọi `newPath` có ≥1 entry point; `isActive(href)` trong header dùng prefix-match nên `/recipes/new` không được nhầm active với `/recipes` ngoài ý muốn (kiểm tra tay).
- UI label giữ tiếng Việt (ARCHITECTURE.md), chỉ slug đổi.

## Entity 2 — RedirectRule (old → new)

| Field | Type | Rule |
|---|---|---|
| `source` | string | `oldPath` + biến thể động (`/cong-thuc/:id`, `/bai-viet/:id/chinh-sua`, `/ban-do/:id`). |
| `destination` | string | `newPath` tương ứng (`/recipes/:id`, `/articles/:id/edit`, `/restaurants/:id`). |
| `permanent` | boolean | Luôn `true` (308) cho truy cập trực tiếp/bookmark/SEO. |
| `preserveQueryHash` | boolean | Luôn `true`; kiểm thử với `?type=`, `?q=`, `?tab=posts`, hash. |

**Validation**:
- Không redirect vòng (`source != destination`, không có chuỗi A→B→A).
- Query/hash được bảo toàn (do `redirects()` 308 tự giữ query; hash do browser giữ).
- `/video/upload` → `/videos/new` là rule xóa-alias, không phải route chính.

## Entity 3 — NavigationEntryPoint

| Field | Type | Rule |
|---|---|---|
| `route` | string | `newPath` được trỏ tới. |
| `location` | enum | `header-desktop` \| `header-mobile` \| `footer` \| `breadcrumb` \| `contextual-link` \| `form-action` \| `programmatic` (`router.push`/`redirect`). |
| `file` | string | File chứa link, ví dụ `src/components/layout/site-header.tsx`, `src/app/(site)/page.tsx`. |

**Validation**:
- Mỗi route mới có ≥1 entry; grep toàn `src/` không còn string URL Việt (`bai-viet|cong-thuc|danh-muc|ban-do|tim-kiem|ho-so|ke-hoach|tro-ly-ai|dang-|xac-thuc`).
- Form tìm kiếm `action` trỏ `/search`; `router.push('/tim-kiem...')` → `/search...`.

## Full mapping (source of truth cho implement + test)

| # | oldPath | newPath | group | auth |
|---|---|---|---|---|
| 1 | `/cong-thuc` | `/recipes` | (site) | public |
| 2 | `/cong-thuc/[id]` | `/recipes/[id]` | (site) | public |
| 3 | `/dang-cong-thuc` | `/recipes/new` | (site) | member |
| 4 | `/bai-viet` | `/articles` | (site) | public |
| 5 | `/bai-viet/tao-moi` | `/articles/new` | (site) | member |
| 6 | `/bai-viet/[id]` | `/articles/[id]` | (site) | public |
| 7 | `/bai-viet/[id]/chinh-sua` | `/articles/[id]/edit` | (site) | member-owner |
| 8 | `/video` | `/videos` | (site) | public |
| 9 | `/video/[id]` | `/videos/[id]` | (site) | public |
| 10 | `/dang-video` | `/videos/new` | (site) | member |
| 11 | `/video/upload` | → `/videos/new` (xóa) | (site) | — |
| 12 | `/danh-muc` | `/categories` | (site) | public |
| 13 | `/ban-do` | `/restaurants` | (site) | public |
| 14 | `/ban-do/[id]` | `/restaurants/[id]` | (site) | public |
| 15 | `/tim-kiem` | `/search` | (site) | public |
| 16 | `/ho-so` | `/profile` | (site) | member |
| 17 | `/ke-hoach-bua-an` | `/meal-plans` | (site) | member |
| 18 | `/ke-hoach-bua-an/da-luu` | `/meal-plans/saved` | (site) | member |
| 19 | `/tro-ly-ai` | `/assistant` | (site) | public+member |
| 20 | `/xac-thuc-otp` | `/verify-otp` | (auth) | guest |
| — | `/`, `/login`, `/onboarding`, `/admin` | giữ nguyên | — | — |

## State transitions

```text
OLD_URL (bookmark/crawler/link cũ)
  └── GET trực tiếp ── 308 redirects() ──> NEW_URL (render duy nhất, canonical)
NEW_URL nội bộ (Link/router.push/form)
  └── render trực tiếp, không đi vòng qua OLD_URL
```

Không có trạng thái trung gian render nội dung trên URL cũ.
