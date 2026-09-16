# Quickstart: Validate English Routes Rename

**Feature**: `004-fe-english-routes` | **Date**: 2026-09-16
**Spec**: [spec.md](./spec.md) | **Contract**: [contracts/route-contract.md](./contracts/route-contract.md)

## Prerequisites

- Chạy lệnh trong `frontend/` (workdir, không `cd`), shell PowerShell, OS Windows.
- `npm install` đã chạy; backend local tùy chọn ở `http://localhost:4000/api/v1` cho trang cần dữ liệu động.

## 1. Static checks (không cần chạy server)

```powershell
# Không còn link Việt trong src (kỳ vọng: 0 match)
rg -n "/(bai-viet|cong-thuc|danh-muc|ban-do|tim-kiem|ho-so|ke-hoach-bua-an|tro-ly-ai|dang-cong-thuc|dang-video|xac-thuc-otp)" src

# Route mới tồn tại
Get-ChildItem src/app -Recurse -Filter page.tsx | Select-Object FullName

# Typecheck + unit tests + build
node node_modules/typescript/bin/tsc --noEmit
npm test
npm run build
```

Kết quả đạt khi: grep 0 match, `tsc` không lỗi mới, `vitest` pass, `next build` pass.

## 2. Manual validation (cần `npm run dev`)

| # | Thao tác | Kết quả mong đợi |
|---|---|---|
| 1 | Mở `/recipes`, `/articles`, `/videos`, `/categories`, `/restaurants`, `/search` (guest) | Nội dung đúng như URL cũ, không 404 |
| 2 | Login, mở `/profile`, `/meal-plans`, `/meal-plans/saved`, `/assistant` | Đúng dữ liệu user, guard không đá về login sai |
| 3 | Mở URL cũ `/cong-thuc`, `/bai-viet/tao-moi`, `/ban-do/1`, `/tim-kiem?q=chay`, `/danh-muc?type=RECIPE_GROUP`, `/ho-so?tab=posts` | 308 về URL mới, giữ query, hiển thị đúng |
| 4 | Tạo bài ở `/articles/new`, sửa ở `/articles/[id]/edit`, tạo recipe `/recipes/new`, tạo video `/videos/new` | Lưu xong điều hướng tới `/articles/[id]`, `/recipes/[id]`, `/videos/[id]` |
| 5 | Bấm toàn bộ header (desktop+mobile), footer, breadcrumb, CTA home, form search | Mọi link là URL Anh; mobile menu đủ mục |
| 6 | Copy-link bài viết, xem OG/canonical | URL dạng `/articles/[id]` |
| 7 | Logout rồi mở `/profile`, mở `/login` khi đã login | Đá về `/login?from=/profile` (URL Anh); đã login không quay lại `/login` |
| 8 | Mở URL sai `/bai-viet/%5Bid%5D` | 404 thân thiện tiếng Việt + link về `/` |

## 3. References (không copy code vào đây)

- Chi tiết mapping: [data-model.md](./data-model.md), [contracts/route-contract.md](./contracts/route-contract.md)
- Quyết định kỹ thuật: [research.md](./research.md)
- Quy tắc dự án: `docs/ARCHITECTURE.md` (orphan-page, alias `@/*`, VI UI), `docs/BACKEND_INTEGRATION.md` (mục 5 mapping module)
