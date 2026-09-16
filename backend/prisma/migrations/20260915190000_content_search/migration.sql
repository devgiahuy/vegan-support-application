CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

ALTER TABLE "post_revisions"
    ADD COLUMN "normalized_title" VARCHAR(200),
    ADD COLUMN "normalized_excerpt" VARCHAR(500),
    ADD COLUMN "normalized_body" TEXT;

UPDATE "post_revisions"
SET
    "normalized_title" = TRIM(REGEXP_REPLACE(LOWER(UNACCENT("title")), '[^a-z0-9]+', ' ', 'g')),
    "normalized_excerpt" = CASE
        WHEN "excerpt" IS NULL THEN NULL
        ELSE TRIM(REGEXP_REPLACE(LOWER(UNACCENT("excerpt")), '[^a-z0-9]+', ' ', 'g'))
    END,
    "normalized_body" = TRIM(REGEXP_REPLACE(LOWER(UNACCENT("body")), '[^a-z0-9]+', ' ', 'g'));

ALTER TABLE "post_revisions"
    ALTER COLUMN "normalized_title" SET NOT NULL,
    ALTER COLUMN "normalized_body" SET NOT NULL;

CREATE TABLE "post_tags" (
    "revision_id" UUID NOT NULL,
    "normalized_tag" VARCHAR(80) NOT NULL,
    "tag" VARCHAR(80) NOT NULL,
    CONSTRAINT "post_tags_pkey" PRIMARY KEY ("revision_id", "normalized_tag")
);

ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_revision_id_fkey"
    FOREIGN KEY ("revision_id") REFERENCES "post_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "post_revisions_normalized_title_trgm_idx"
    ON "post_revisions" USING GIN ("normalized_title" gin_trgm_ops);
CREATE INDEX "post_revisions_normalized_body_trgm_idx"
    ON "post_revisions" USING GIN ("normalized_body" gin_trgm_ops);
CREATE INDEX "recipe_ingredients_normalized_name_trgm_idx"
    ON "recipe_ingredients" USING GIN ("normalized_name" gin_trgm_ops);
CREATE INDEX "recipe_ingredients_search_ingredient_revision_idx"
    ON "recipe_ingredients" ("ingredient_id", "revision_id");
CREATE INDEX "recipe_details_search_filters_idx"
    ON "recipe_details" ("difficulty", "cook_time_minutes", "revision_id");
CREATE INDEX "post_categories_search_category_revision_idx"
    ON "post_categories" ("category_id", "revision_id");
CREATE INDEX "post_tags_normalized_tag_trgm_idx"
    ON "post_tags" USING GIN ("normalized_tag" gin_trgm_ops);
