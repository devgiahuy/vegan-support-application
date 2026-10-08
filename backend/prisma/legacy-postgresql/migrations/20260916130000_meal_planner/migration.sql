CREATE TYPE "meal_goal" AS ENUM ('MAINTAIN', 'LOSE', 'GAIN');
CREATE TYPE "meal_type" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');
CREATE TYPE "meal_slot_status" AS ENUM ('FILLED', 'UNFILLED');
CREATE TYPE "nutrition_data_quality" AS ENUM ('COMPLETE', 'PARTIAL', 'UNAVAILABLE');
CREATE TYPE "meal_plan_mutation_type" AS ENUM ('SWAP');

CREATE TABLE "meal_plans" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "week_start" DATE NOT NULL,
  "goal" "meal_goal" NOT NULL,
  "target_calories" INTEGER NOT NULL,
  "version" INTEGER NOT NULL,
  "lock_version" INTEGER NOT NULL DEFAULT 1,
  "supersedes_meal_plan_id" UUID,
  "idempotency_key" VARCHAR(120) NOT NULL,
  "payload_hash" CHAR(64) NOT NULL,
  "seed_hash" CHAR(64) NOT NULL,
  "algorithm_version" VARCHAR(80) NOT NULL,
  "recommendation_version" VARCHAR(80) NOT NULL,
  "constraint_snapshot" JSONB NOT NULL,
  "warnings" JSONB NOT NULL DEFAULT '[]',
  "nutrition_data_quality" "nutrition_data_quality" NOT NULL,
  "micronutrient_summary" JSONB NOT NULL,
  "explanation" TEXT,
  "deleted_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "meal_plans_week_start_monday" CHECK (EXTRACT(ISODOW FROM "week_start") = 1),
  CONSTRAINT "meal_plans_positive_values" CHECK ("target_calories" > 0 AND "version" > 0 AND "lock_version" > 0),
  CONSTRAINT "meal_plans_hashes_hex" CHECK ("payload_hash" ~ '^[0-9a-f]{64}$' AND "seed_hash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "meal_plans_warnings_array" CHECK (jsonb_typeof("warnings") = 'array'),
  CONSTRAINT "meal_plans_constraint_snapshot_object" CHECK (jsonb_typeof("constraint_snapshot") = 'object'),
  CONSTRAINT "meal_plans_micronutrient_summary_object" CHECK (jsonb_typeof("micronutrient_summary") = 'object')
);

CREATE TABLE "meal_plan_items" (
  "id" UUID NOT NULL,
  "meal_plan_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "meal_type" "meal_type" NOT NULL,
  "position" INTEGER NOT NULL,
  "status" "meal_slot_status" NOT NULL,
  "recipe_id" UUID,
  "recipe_revision_id" UUID,
  "target_calories" INTEGER NOT NULL,
  "calories" INTEGER,
  "tolerance_percent" DECIMAL(5,2),
  "reason_codes" JSONB NOT NULL DEFAULT '[]',
  "warning_codes" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "meal_plan_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "meal_plan_items_position_nonnegative" CHECK ("position" >= 0 AND "target_calories" > 0),
  CONSTRAINT "meal_plan_items_arrays" CHECK (jsonb_typeof("reason_codes") = 'array' AND jsonb_typeof("warning_codes") = 'array'),
  CONSTRAINT "meal_plan_items_filled_shape" CHECK (
    ("status" = 'FILLED' AND "recipe_id" IS NOT NULL AND "recipe_revision_id" IS NOT NULL AND "calories" IS NOT NULL AND "calories" > 0 AND "tolerance_percent" IS NOT NULL)
    OR
    ("status" = 'UNFILLED' AND "recipe_id" IS NULL AND "recipe_revision_id" IS NULL AND "calories" IS NULL AND "tolerance_percent" IS NULL)
  )
);

CREATE TABLE "meal_plan_shopping_items" (
  "id" UUID NOT NULL,
  "meal_plan_id" UUID NOT NULL,
  "ingredient_id" UUID NOT NULL,
  "canonical_name" VARCHAR(160) NOT NULL,
  "amount" DECIMAL(14,3) NOT NULL,
  "unit" VARCHAR(40) NOT NULL,
  "source_item_count" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "meal_plan_shopping_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "meal_plan_shopping_items_positive" CHECK ("amount" > 0 AND "source_item_count" > 0)
);

CREATE TABLE "meal_plan_mutations" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "meal_plan_id" UUID NOT NULL,
  "meal_plan_item_id" UUID NOT NULL,
  "type" "meal_plan_mutation_type" NOT NULL,
  "idempotency_key" VARCHAR(120) NOT NULL,
  "payload_hash" CHAR(64) NOT NULL,
  "resulting_lock_version" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meal_plan_mutations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "meal_plan_mutations_payload_hash_hex" CHECK ("payload_hash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "meal_plan_mutations_positive_version" CHECK ("resulting_lock_version" > 0)
);

CREATE UNIQUE INDEX "meal_plans_user_id_idempotency_key_key" ON "meal_plans"("user_id", "idempotency_key");
CREATE UNIQUE INDEX "meal_plans_user_id_week_start_version_key" ON "meal_plans"("user_id", "week_start", "version");
CREATE INDEX "meal_plans_user_id_week_start_deleted_at_version_idx" ON "meal_plans"("user_id", "week_start", "deleted_at", "version");
CREATE INDEX "meal_plans_supersedes_meal_plan_id_idx" ON "meal_plans"("supersedes_meal_plan_id");
CREATE UNIQUE INDEX "meal_plan_items_meal_plan_id_date_meal_type_key" ON "meal_plan_items"("meal_plan_id", "date", "meal_type");
CREATE INDEX "meal_plan_items_meal_plan_id_position_idx" ON "meal_plan_items"("meal_plan_id", "position");
CREATE INDEX "meal_plan_items_recipe_id_date_idx" ON "meal_plan_items"("recipe_id", "date");
CREATE UNIQUE INDEX "meal_plan_shopping_items_meal_plan_id_ingredient_id_unit_key" ON "meal_plan_shopping_items"("meal_plan_id", "ingredient_id", "unit");
CREATE INDEX "meal_plan_shopping_items_meal_plan_id_canonical_name_idx" ON "meal_plan_shopping_items"("meal_plan_id", "canonical_name");
CREATE UNIQUE INDEX "meal_plan_mutations_user_id_idempotency_key_key" ON "meal_plan_mutations"("user_id", "idempotency_key");
CREATE INDEX "meal_plan_mutations_meal_plan_id_created_at_idx" ON "meal_plan_mutations"("meal_plan_id", "created_at");

ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_supersedes_meal_plan_id_fkey" FOREIGN KEY ("supersedes_meal_plan_id") REFERENCES "meal_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_meal_plan_id_fkey" FOREIGN KEY ("meal_plan_id") REFERENCES "meal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_recipe_revision_id_fkey" FOREIGN KEY ("recipe_revision_id") REFERENCES "post_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "meal_plan_shopping_items" ADD CONSTRAINT "meal_plan_shopping_items_meal_plan_id_fkey" FOREIGN KEY ("meal_plan_id") REFERENCES "meal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_plan_shopping_items" ADD CONSTRAINT "meal_plan_shopping_items_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "meal_plan_mutations" ADD CONSTRAINT "meal_plan_mutations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_plan_mutations" ADD CONSTRAINT "meal_plan_mutations_meal_plan_id_fkey" FOREIGN KEY ("meal_plan_id") REFERENCES "meal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_plan_mutations" ADD CONSTRAINT "meal_plan_mutations_meal_plan_item_id_fkey" FOREIGN KEY ("meal_plan_item_id") REFERENCES "meal_plan_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
