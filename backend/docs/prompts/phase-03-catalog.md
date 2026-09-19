# Prompt — Phase 03: Category & Ingredient Catalog

Triển khai Phase 03 độc lập về session từ thư mục gốc của repository hiện tại.

Đọc `AGENTS.md`, BL-04/12 trong implementation plan, phase map và integration guide. Xác minh Phase 01; nếu Phase 02 đã tồn tại, tái sử dụng diet/allergen types mà không phá contract. Kiểm tra git status.

## Mục tiêu

Tạo catalog category và canonical ingredient làm nền cho content, search và Meal Planner.

## Scope bắt buộc

- Models/migration cho category tree, canonical ingredient, ingredient aliases, food groups, allergen/diet metadata và category proposal nếu cần để giữ contract.
- Category types: `FOOD_TYPE`, `RECIPE_GROUP`, `CONTENT_TOPIC`; tối đa hai tầng; unique slug trong parent/type.
- Admin CRUD category; public active category tree.
- Delete category đang dùng phải yêu cầu replacement và thực hiện transaction; nếu chưa có Post table, thiết kế service/constraint sẵn cho phần hiện có, không tạo giả content model.
- Canonical ingredient normalization tiếng Việt có/không dấu; alias lookup; ambiguous result trả candidates thay vì tự chọn.
- Admin endpoints tối thiểu để list/create/update/archive ingredient và alias nếu implementation plan cần vận hành catalog; ghi rõ trong OpenAPI/integration guide.
- Seed categories, food groups, allergen codes và đủ ingredients cho demo recipe.

## Acceptance

- Xử lý đầy đủ tree depth, duplicate slug, wrong category type, archive/replacement rules, accent-insensitive alias match và ambiguous match.
- Public endpoint không trả archived catalog item.
- Admin authorization được backend enforce đầy đủ.
- OpenAPI/integration guide và phase record cập nhật.
- Lint/typecheck/build pass.

Không triển khai Recipe/Post hoặc search content trong phase này.

Commit duy nhất:

```text
feat(catalog): add categories and ingredients
```

Final báo hash, schema/seed, endpoint READY và gate.
