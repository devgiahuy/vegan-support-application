# Leader Meal Plan Data Changes

## Meal item nutrition fields

Meal Plan item responses now add these nullable estimated values while retaining all existing fields:

- `proteinGrams`
- `fiberGrams`
- `fatGrams`
- `carbohydrateGrams`

The values reuse the published recipe nutrition estimate or the existing custom-meal nutrition estimate, scaled by item servings. They are returned by the shared item DTO used by generate, detail, swap, and manual-add responses. No vitamin or micronutrient field was added.

## Recipes added

Twelve realistic, Meal Planner-eligible vegan recipes were added through the existing recipe seed definitions:

- Breakfast: Yến Mạch Qua Đêm Chuối Hạt Chia; Cháo Quinoa Bí Đỏ Hạt Bí; Cơm Lứt Đậu Hũ Cải Bó Xôi Buổi Sáng; Cháo Hạt Sen Đậu Đỏ Yến Mạch.
- Lunch: Cơm Lứt Tempeh Bông Cải Sốt Gừng; Quinoa Đậu Gà Rau Củ Nướng; Cà Ri Đậu Hũ Khoai Lang Dùng Với Cơm; Cơm Đậu Lăng Cà Tím Nướng.
- Dinner: Phở Xào Nấm Đậu Hũ Cải Thìa; Cà Tím Kho Đậu Hũ Dùng Với Cơm Lứt; Đậu Đen Hầm Bí Đỏ Dùng Với Quinoa; Cơm Tempeh Măng Tây Nấm Áp Chảo.

Each recipe has estimated calories, protein, fiber, fat, and carbohydrates. All ingredients resolve to existing canonical ingredient records with `EXACT` resolution.

## Temporary test recipes removed

The seed now retires only these eight known synthetic Meal Planner fixtures by exact slug, setting them to `DELETED` so they leave search and candidate pools while historical meal-plan foreign keys remain valid:

- `to-dau-hu-rau-xanh-420-demo`
- `com-nam-gao-lut-500-demo`
- `com-dau-hu-nam-520-demo`
- `gao-lut-bong-cai-540-demo`
- `to-nam-rau-xanh-560-demo`
- `com-dau-hu-bong-cai-580-demo`
- `gao-lut-dau-hu-600-demo`
- `com-nam-bong-cai-610-demo`

No user-created or uncertain recipe was deleted.

## Recipe image data

Each new recipe has a distinct representative remote food image URL in its existing `coverMedia` definition, with a unique seed public ID and the existing cover-image dimensions. No frontend image handling or upload behavior changed.

## Seed and database changes

- Published recipe count before: 27.
- Temporary active fixture count before: 8.
- New recipes added: 12.
- Temporary fixtures retired: 8.
- Published recipe count after: 31.
- Meal Planner-eligible published recipes after: 30.
- Eligible recipes categorized for breakfast: 5.
- Eligible recipes categorized for lunch: 4.
- Eligible recipes categorized for dinner: 4.
- A second seed run completed successfully, confirming idempotency.

## Database dump and restore

Dump path: `backend/database/vegan_support_seed_dump.sql`

The dump contains the recipe/catalog development dataset and sanitized author identities required by foreign keys. Authentication sessions, tokens, API keys, environment secrets, and real password hashes are excluded. Sanitized author rows use `DISABLED_RESTORE_ONLY` and cannot be used to authenticate.

Restore into an empty compatible local database from the backend directory:

```powershell
docker compose exec -T postgres createdb -U vegan vegan_support_seed_restore
$env:DATABASE_URL = 'postgresql://vegan:vegan_local@localhost:5432/vegan_support_seed_restore?schema=public'
npx.cmd prisma migrate deploy
docker compose cp database/vegan_support_seed_dump.sql postgres:/tmp/vegan_support_seed_dump.sql
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U vegan -d vegan_support_seed_restore -f /tmp/vegan_support_seed_dump.sql
```

The restore account must be allowed to set `session_replication_role`; the local Compose `vegan` database owner supports this. The restore was verified against a new migrated database, then the verification database was removed.

## Meal Plan verification result

A real `POST /api/v1/meal-plans/generate` request using the seeded Member produced:

- Breakfast filled: 7/7.
- Lunch filled: 7/7.
- Dinner filled: 7/7.
- Total filled: 21/21.
- Remaining unfilled reasons: none.
- Meals selected from newly added recipes: 6.
- Filled items missing any requested macro: 0.

The corresponding `GET /api/v1/meal-plans/:id` returned the same 21 items and seven-day slot view. One sample filled item was:

```json
{
  "title": "Cháo Hạt Sen Đậu Đỏ Yến Mạch",
  "calories": 560,
  "proteinGrams": 19,
  "fiberGrams": 15,
  "fatGrams": 12,
  "carbohydrateGrams": 91
}
```

## Checks performed

- `npx prisma validate`: passed.
- `npx prisma generate`: passed after stopping the local process that held the Windows query-engine DLL.
- `npm run seed`: passed twice.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run meal-plans:acceptance`: passed.
- `npm run openapi:generate`: passed.
- Real generate/detail API verification: passed.
- Sanitized dump restore into an empty migrated database: passed.
- `git diff --check`: passed after removing trailing blank lines.

## Unresolved issues

- The representative image URLs are remote seed data and require network access when displayed.
- Frontend integration documentation was not updated because the leader explicitly prohibited modifying frontend files or `frontend/docs/BACKEND_INTEGRATION.md` for this change.
