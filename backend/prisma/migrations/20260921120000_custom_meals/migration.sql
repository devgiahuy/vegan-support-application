-- Phase 17: Custom Meals, Photos & User Tags
-- CreateEnum
CREATE TYPE "meal_plan_item_source_type" AS ENUM ('RECIPE', 'CUSTOM_MEAL');

-- CreateEnum
CREATE TYPE "custom_meal_delete_policy" AS ENUM ('BLOCK', 'RETAIN_SNAPSHOT');

-- CreateTable
CREATE TABLE "custom_meals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "notes" TEXT,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "source_note" VARCHAR(500),
    "user_calories" INTEGER,
    "user_protein_grams" DECIMAL(8,2),
    "user_carbs_grams" DECIMAL(8,2),
    "user_fat_grams" DECIMAL(8,2),
    "nutrition_coverage" VARCHAR(20) NOT NULL DEFAULT 'UNAVAILABLE',
    "delete_policy" "custom_meal_delete_policy" NOT NULL DEFAULT 'BLOCK',
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "custom_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_meal_ingredients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "custom_meal_id" UUID NOT NULL,
    "ingredient_id" UUID,
    "position" INTEGER NOT NULL,
    "display_name" VARCHAR(160) NOT NULL,
    "normalized_name" VARCHAR(160) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "unit" VARCHAR(40) NOT NULL,
    "resolution_status" "ingredient_resolution_status" NOT NULL,

    CONSTRAINT "custom_meal_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_meal_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "custom_meal_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_meal_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_meal_tags" (
    "custom_meal_id" UUID NOT NULL,
    "tag" VARCHAR(80) NOT NULL,
    "normalized_tag" VARCHAR(80) NOT NULL,

    CONSTRAINT "custom_meal_tags_pkey" PRIMARY KEY ("custom_meal_id","normalized_tag")
);

-- Add sourceType and customMealId to meal_plan_items
ALTER TABLE "meal_plan_items"
    ADD COLUMN "source_type" "meal_plan_item_source_type" NOT NULL DEFAULT 'RECIPE',
    ADD COLUMN "custom_meal_id" UUID,
    ADD COLUMN "custom_meal_snapshot" JSONB;

-- CreateIndex
CREATE INDEX "custom_meals_owner_id_deleted_at_created_at_idx" ON "custom_meals"("owner_id", "deleted_at", "created_at");
CREATE INDEX "custom_meal_ingredients_custom_meal_id_resolution_status_idx" ON "custom_meal_ingredients"("custom_meal_id", "resolution_status");
CREATE UNIQUE INDEX "custom_meal_ingredients_custom_meal_id_position_key" ON "custom_meal_ingredients"("custom_meal_id", "position");
CREATE INDEX "custom_meal_photos_custom_meal_id_position_idx" ON "custom_meal_photos"("custom_meal_id", "position");
CREATE UNIQUE INDEX "custom_meal_photos_custom_meal_id_asset_id_key" ON "custom_meal_photos"("custom_meal_id", "asset_id");
CREATE INDEX "custom_meal_tags_normalized_tag_idx" ON "custom_meal_tags"("normalized_tag");
CREATE INDEX "meal_plan_items_custom_meal_id_idx" ON "meal_plan_items"("custom_meal_id");

-- AddForeignKey
ALTER TABLE "custom_meals" ADD CONSTRAINT "custom_meals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "custom_meal_ingredients" ADD CONSTRAINT "custom_meal_ingredients_custom_meal_id_fkey" FOREIGN KEY ("custom_meal_id") REFERENCES "custom_meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "custom_meal_ingredients" ADD CONSTRAINT "custom_meal_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "custom_meal_photos" ADD CONSTRAINT "custom_meal_photos_custom_meal_id_fkey" FOREIGN KEY ("custom_meal_id") REFERENCES "custom_meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "custom_meal_photos" ADD CONSTRAINT "custom_meal_photos_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "custom_meal_tags" ADD CONSTRAINT "custom_meal_tags_custom_meal_id_fkey" FOREIGN KEY ("custom_meal_id") REFERENCES "custom_meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_custom_meal_id_fkey" FOREIGN KEY ("custom_meal_id") REFERENCES "custom_meals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
