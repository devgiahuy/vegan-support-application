CREATE TYPE "catalog_status" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "category_type" AS ENUM ('FOOD_TYPE', 'RECIPE_GROUP', 'CONTENT_TOPIC');
CREATE TYPE "category_proposal_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "food_group" AS ENUM (
    'GRAINS',
    'LEGUMES',
    'VEGETABLES',
    'FRUITS',
    'NUTS_SEEDS',
    'MUSHROOMS',
    'DAIRY_EGGS',
    'HERBS_SPICES',
    'OTHER'
);

CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "parent_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "type" "category_type" NOT NULL,
    "status" "catalog_status" NOT NULL DEFAULT 'ACTIVE',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "categories_parent_not_self_check" CHECK ("parent_id" IS NULL OR "parent_id" <> "id")
);

CREATE TABLE "ingredients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "canonical_name" VARCHAR(160) NOT NULL,
    "normalized_name" VARCHAR(160) NOT NULL,
    "food_group" "food_group" NOT NULL,
    "status" "catalog_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "category_proposals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "proposed_by_id" UUID NOT NULL,
    "parent_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "type" "category_type" NOT NULL,
    "status" "category_proposal_status" NOT NULL DEFAULT 'PENDING',
    "review_note" VARCHAR(1000),
    "reviewed_by_id" UUID,
    "resolved_category_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "category_proposals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ingredient_aliases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingredient_id" UUID NOT NULL,
    "alias" VARCHAR(160) NOT NULL,
    "normalized_alias" VARCHAR(160) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ingredient_aliases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "allergen_definitions" (
    "code" VARCHAR(100) NOT NULL,
    "label" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "allergen_definitions_pkey" PRIMARY KEY ("code")
);

CREATE TABLE "ingredient_allergens" (
    "ingredient_id" UUID NOT NULL,
    "allergen_code" VARCHAR(100) NOT NULL,
    CONSTRAINT "ingredient_allergens_pkey" PRIMARY KEY ("ingredient_id", "allergen_code")
);

CREATE TABLE "ingredient_diet_compatibilities" (
    "ingredient_id" UUID NOT NULL,
    "diet_pattern" "diet_pattern" NOT NULL,
    "compatible" BOOLEAN NOT NULL,
    CONSTRAINT "ingredient_diet_compatibilities_pkey" PRIMARY KEY ("ingredient_id", "diet_pattern")
);

CREATE TABLE "ingredient_tradition_warnings" (
    "ingredient_id" UUID NOT NULL,
    "tradition" "tradition" NOT NULL,
    "warning_code" VARCHAR(120) NOT NULL,
    "label" VARCHAR(180) NOT NULL,
    CONSTRAINT "ingredient_tradition_warnings_pkey" PRIMARY KEY ("ingredient_id", "tradition", "warning_code")
);

ALTER TABLE "user_ingredient_exclusions" ADD COLUMN "ingredient_id" UUID;

CREATE UNIQUE INDEX "categories_root_type_slug_key"
    ON "categories"("type", "slug") WHERE "parent_id" IS NULL;
CREATE UNIQUE INDEX "categories_child_type_parent_id_slug_key"
    ON "categories"("type", "parent_id", "slug") WHERE "parent_id" IS NOT NULL;
CREATE INDEX "categories_type_parent_id_status_sort_order_idx"
    ON "categories"("type", "parent_id", "status", "sort_order");
CREATE INDEX "category_proposals_status_created_at_idx"
    ON "category_proposals"("status", "created_at");
CREATE INDEX "category_proposals_proposed_by_id_status_idx"
    ON "category_proposals"("proposed_by_id", "status");
CREATE UNIQUE INDEX "ingredients_normalized_name_key" ON "ingredients"("normalized_name");
CREATE INDEX "ingredients_status_food_group_canonical_name_idx"
    ON "ingredients"("status", "food_group", "canonical_name");
CREATE UNIQUE INDEX "ingredient_aliases_ingredient_id_normalized_alias_key"
    ON "ingredient_aliases"("ingredient_id", "normalized_alias");
CREATE INDEX "ingredient_aliases_normalized_alias_idx" ON "ingredient_aliases"("normalized_alias");
CREATE INDEX "ingredient_allergens_allergen_code_idx" ON "ingredient_allergens"("allergen_code");
CREATE INDEX "ingredient_diet_compatibilities_diet_pattern_compatible_idx"
    ON "ingredient_diet_compatibilities"("diet_pattern", "compatible");
CREATE INDEX "ingredient_tradition_warnings_tradition_idx"
    ON "ingredient_tradition_warnings"("tradition");
CREATE INDEX "user_ingredient_exclusions_ingredient_id_idx"
    ON "user_ingredient_exclusions"("ingredient_id");

ALTER TABLE "categories"
    ADD CONSTRAINT "categories_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ingredient_aliases"
    ADD CONSTRAINT "ingredient_aliases_ingredient_id_fkey"
    FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "category_proposals"
    ADD CONSTRAINT "category_proposals_proposed_by_id_fkey"
    FOREIGN KEY ("proposed_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "category_proposals"
    ADD CONSTRAINT "category_proposals_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "category_proposals"
    ADD CONSTRAINT "category_proposals_reviewed_by_id_fkey"
    FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "category_proposals"
    ADD CONSTRAINT "category_proposals_resolved_category_id_fkey"
    FOREIGN KEY ("resolved_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ingredient_allergens"
    ADD CONSTRAINT "ingredient_allergens_ingredient_id_fkey"
    FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ingredient_allergens"
    ADD CONSTRAINT "ingredient_allergens_allergen_code_fkey"
    FOREIGN KEY ("allergen_code") REFERENCES "allergen_definitions"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ingredient_diet_compatibilities"
    ADD CONSTRAINT "ingredient_diet_compatibilities_ingredient_id_fkey"
    FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ingredient_tradition_warnings"
    ADD CONSTRAINT "ingredient_tradition_warnings_ingredient_id_fkey"
    FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_ingredient_exclusions"
    ADD CONSTRAINT "user_ingredient_exclusions_ingredient_id_fkey"
    FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
