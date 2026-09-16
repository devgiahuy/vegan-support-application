CREATE TYPE "post_type" AS ENUM ('RECIPE', 'BLOG', 'VIDEO');
CREATE TYPE "post_status" AS ENUM (
    'DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'FLAGGED', 'REJECTED', 'HIDDEN', 'DELETED'
);
CREATE TYPE "post_revision_status" AS ENUM (
    'DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'FLAGGED', 'REJECTED'
);
CREATE TYPE "recipe_difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE "ingredient_resolution_status" AS ENUM ('EXACT', 'AMBIGUOUS', 'UNKNOWN');
CREATE TYPE "media_kind" AS ENUM ('COVER_IMAGE', 'VIDEO');
CREATE TYPE "media_provider" AS ENUM ('CLOUDINARY', 'YOUTUBE');

CREATE TABLE "posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "author_id" UUID NOT NULL,
    "type" "post_type" NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "status" "post_status" NOT NULL DEFAULT 'PENDING_REVIEW',
    "version" INTEGER NOT NULL DEFAULT 1,
    "published_revision_id" UUID,
    "published_at" TIMESTAMPTZ(3),
    "deleted_at" TIMESTAMPTZ(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "posts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "posts_version_check" CHECK ("version" > 0)
);

CREATE TABLE "post_revisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "post_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "post_revision_status" NOT NULL DEFAULT 'PENDING_REVIEW',
    "title" VARCHAR(200) NOT NULL,
    "excerpt" VARCHAR(500),
    "body" TEXT NOT NULL,
    "created_by_id" UUID NOT NULL,
    "review_note" VARCHAR(2000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_revisions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "post_revisions_version_check" CHECK ("version" > 0)
);

CREATE TABLE "recipe_details" (
    "revision_id" UUID NOT NULL,
    "servings" INTEGER NOT NULL,
    "prep_time_minutes" INTEGER NOT NULL,
    "cook_time_minutes" INTEGER NOT NULL,
    "difficulty" "recipe_difficulty" NOT NULL,
    "calories" INTEGER,
    "protein_grams" DECIMAL(8,2),
    "carbs_grams" DECIMAL(8,2),
    "fat_grams" DECIMAL(8,2),
    "fiber_grams" DECIMAL(8,2),
    "vitamin_b12_mcg" DECIMAL(8,2),
    "meal_planner_eligible" BOOLEAN NOT NULL DEFAULT false,
    "allergen_codes" JSONB NOT NULL DEFAULT '[]',
    "tradition_warnings" JSONB NOT NULL DEFAULT '[]',
    CONSTRAINT "recipe_details_pkey" PRIMARY KEY ("revision_id"),
    CONSTRAINT "recipe_details_servings_check" CHECK ("servings" > 0),
    CONSTRAINT "recipe_details_prep_time_check" CHECK ("prep_time_minutes" >= 0),
    CONSTRAINT "recipe_details_cook_time_check" CHECK ("cook_time_minutes" >= 0),
    CONSTRAINT "recipe_details_calories_check" CHECK ("calories" IS NULL OR "calories" >= 0),
    CONSTRAINT "recipe_details_nutrition_check" CHECK (
        ("protein_grams" IS NULL OR "protein_grams" >= 0) AND
        ("carbs_grams" IS NULL OR "carbs_grams" >= 0) AND
        ("fat_grams" IS NULL OR "fat_grams" >= 0) AND
        ("fiber_grams" IS NULL OR "fiber_grams" >= 0) AND
        ("vitamin_b12_mcg" IS NULL OR "vitamin_b12_mcg" >= 0)
    )
);

CREATE TABLE "recipe_ingredients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "revision_id" UUID NOT NULL,
    "ingredient_id" UUID,
    "position" INTEGER NOT NULL,
    "display_name" VARCHAR(160) NOT NULL,
    "normalized_name" VARCHAR(160) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "unit" VARCHAR(40) NOT NULL,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "resolution_status" "ingredient_resolution_status" NOT NULL,
    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "recipe_ingredients_position_check" CHECK ("position" >= 0),
    CONSTRAINT "recipe_ingredients_amount_check" CHECK ("amount" > 0)
);

CREATE TABLE "recipe_diet_compatibilities" (
    "revision_id" UUID NOT NULL,
    "diet_pattern" "diet_pattern" NOT NULL,
    "compatible" BOOLEAN NOT NULL,
    "reason_codes" JSONB NOT NULL DEFAULT '[]',
    CONSTRAINT "recipe_diet_compatibilities_pkey" PRIMARY KEY ("revision_id", "diet_pattern")
);

CREATE TABLE "post_categories" (
    "revision_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    CONSTRAINT "post_categories_pkey" PRIMARY KEY ("revision_id", "category_id")
);

CREATE TABLE "post_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "revision_id" UUID NOT NULL,
    "kind" "media_kind" NOT NULL,
    "provider" "media_provider" NOT NULL,
    "public_id" VARCHAR(255),
    "secure_url" VARCHAR(2048) NOT NULL,
    "mime_type" VARCHAR(100),
    "bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "duration_seconds" DECIMAL(10,2),
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "post_media_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "post_media_bytes_check" CHECK ("bytes" IS NULL OR "bytes" > 0),
    CONSTRAINT "post_media_dimensions_check" CHECK (
        ("width" IS NULL OR "width" > 0) AND ("height" IS NULL OR "height" > 0)
    ),
    CONSTRAINT "post_media_duration_check" CHECK (
        "duration_seconds" IS NULL OR "duration_seconds" > 0
    )
);

CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");
CREATE UNIQUE INDEX "posts_published_revision_id_key" ON "posts"("published_revision_id");
CREATE INDEX "posts_status_type_published_at_idx" ON "posts"("status", "type", "published_at");
CREATE INDEX "posts_author_id_status_updated_at_idx" ON "posts"("author_id", "status", "updated_at");
CREATE UNIQUE INDEX "post_revisions_post_id_version_key" ON "post_revisions"("post_id", "version");
CREATE INDEX "post_revisions_post_id_status_created_at_idx" ON "post_revisions"("post_id", "status", "created_at");
CREATE UNIQUE INDEX "recipe_ingredients_revision_id_position_key" ON "recipe_ingredients"("revision_id", "position");
CREATE INDEX "recipe_ingredients_ingredient_id_idx" ON "recipe_ingredients"("ingredient_id");
CREATE INDEX "recipe_ingredients_revision_id_resolution_status_idx" ON "recipe_ingredients"("revision_id", "resolution_status");
CREATE INDEX "recipe_diet_compatibilities_diet_pattern_compatible_idx" ON "recipe_diet_compatibilities"("diet_pattern", "compatible");
CREATE INDEX "post_categories_category_id_idx" ON "post_categories"("category_id");
CREATE UNIQUE INDEX "post_media_revision_id_kind_key" ON "post_media"("revision_id", "kind");
CREATE INDEX "post_media_public_id_idx" ON "post_media"("public_id");

ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_deleted_by_id_fkey"
    FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "post_revisions" ADD CONSTRAINT "post_revisions_post_id_fkey"
    FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_revisions" ADD CONSTRAINT "post_revisions_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_published_revision_id_fkey"
    FOREIGN KEY ("published_revision_id") REFERENCES "post_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recipe_details" ADD CONSTRAINT "recipe_details_revision_id_fkey"
    FOREIGN KEY ("revision_id") REFERENCES "post_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_revision_id_fkey"
    FOREIGN KEY ("revision_id") REFERENCES "post_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey"
    FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recipe_diet_compatibilities" ADD CONSTRAINT "recipe_diet_compatibilities_revision_id_fkey"
    FOREIGN KEY ("revision_id") REFERENCES "post_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_categories" ADD CONSTRAINT "post_categories_revision_id_fkey"
    FOREIGN KEY ("revision_id") REFERENCES "post_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_categories" ADD CONSTRAINT "post_categories_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_revision_id_fkey"
    FOREIGN KEY ("revision_id") REFERENCES "post_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
