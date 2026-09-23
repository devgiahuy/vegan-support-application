CREATE TYPE "nutrition_value_origin" AS ENUM (
    'CANONICAL_CALCULATED',
    'AI_ESTIMATED',
    'USER_PROVIDED',
    'VERIFIED_OVERRIDE'
);

CREATE TYPE "recipe_nutrition_estimate_status" AS ENUM ('CURRENT', 'HISTORICAL', 'STALE');

CREATE TABLE "recipe_steps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "revision_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "instruction" VARCHAR(2000) NOT NULL,
    "cooking_method_id" UUID,
    "duration_minutes" INTEGER,
    "temperature_celsius" DECIMAL(6,2),
    "affected_ingredient_positions" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recipe_steps_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "recipe_steps_position_check" CHECK ("position" >= 0),
    CONSTRAINT "recipe_steps_duration_check" CHECK ("duration_minutes" IS NULL OR "duration_minutes" > 0),
    CONSTRAINT "recipe_steps_temperature_check" CHECK ("temperature_celsius" IS NULL OR "temperature_celsius" BETWEEN 0 AND 400),
    CONSTRAINT "recipe_steps_positions_array_check" CHECK (jsonb_typeof("affected_ingredient_positions") = 'array')
);

CREATE TABLE "recipe_nutrition_estimates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "revision_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "recipe_nutrition_estimate_status" NOT NULL DEFAULT 'CURRENT',
    "calculation_version" VARCHAR(40) NOT NULL,
    "recipe_fingerprint" CHAR(64) NOT NULL,
    "servings" INTEGER NOT NULL,
    "total_raw_grams" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "total_cooked_grams" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "total_nutrients" JSONB NOT NULL,
    "per_serving_nutrients" JSONB NOT NULL,
    "source_versions" JSONB NOT NULL DEFAULT '[]',
    "assumptions" JSONB NOT NULL DEFAULT '[]',
    "uncovered_ingredients" JSONB NOT NULL DEFAULT '[]',
    "confidence" DECIMAL(5,4) NOT NULL,
    "uncertainty" JSONB NOT NULL DEFAULT '{}',
    "ai_used" BOOLEAN NOT NULL DEFAULT false,
    "provider_down" BOOLEAN NOT NULL DEFAULT false,
    "disclaimer" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recipe_nutrition_estimates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "recipe_nutrition_estimates_version_check" CHECK ("version" > 0),
    CONSTRAINT "recipe_nutrition_estimates_servings_check" CHECK ("servings" > 0),
    CONSTRAINT "recipe_nutrition_estimates_grams_check" CHECK ("total_raw_grams" >= 0 AND "total_cooked_grams" >= 0),
    CONSTRAINT "recipe_nutrition_estimates_confidence_check" CHECK ("confidence" >= 0 AND "confidence" <= 1),
    CONSTRAINT "recipe_nutrition_estimates_json_check" CHECK (
        jsonb_typeof("total_nutrients") = 'array'
        AND jsonb_typeof("per_serving_nutrients") = 'array'
        AND jsonb_typeof("source_versions") = 'array'
        AND jsonb_typeof("assumptions") = 'array'
        AND jsonb_typeof("uncovered_ingredients") = 'array'
        AND jsonb_typeof("uncertainty") = 'object'
    )
);

CREATE TABLE "recipe_nutrition_estimate_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "estimate_id" UUID NOT NULL,
    "recipe_ingredient_id" UUID,
    "ingredient_id" UUID,
    "position" INTEGER NOT NULL,
    "display_name" VARCHAR(160) NOT NULL,
    "origin" "nutrition_value_origin" NOT NULL,
    "normalized_raw_grams" DECIMAL(18,6),
    "edible_raw_grams" DECIMAL(18,6),
    "yield_factor" DECIMAL(9,6),
    "cooked_grams" DECIMAL(18,6),
    "nutrient_coverage" JSONB NOT NULL DEFAULT '[]',
    "source_versions" JSONB NOT NULL DEFAULT '[]',
    "assumptions" JSONB NOT NULL DEFAULT '[]',
    "confidence" DECIMAL(5,4) NOT NULL,
    "uncertainty" JSONB NOT NULL DEFAULT '{}',
    "uncovered_reason" VARCHAR(160),
    CONSTRAINT "recipe_nutrition_estimate_lines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "recipe_nutrition_estimate_lines_position_check" CHECK ("position" >= 0),
    CONSTRAINT "recipe_nutrition_estimate_lines_grams_check" CHECK (
        ("normalized_raw_grams" IS NULL OR "normalized_raw_grams" >= 0)
        AND ("edible_raw_grams" IS NULL OR "edible_raw_grams" >= 0)
        AND ("yield_factor" IS NULL OR "yield_factor" > 0)
        AND ("cooked_grams" IS NULL OR "cooked_grams" >= 0)
    ),
    CONSTRAINT "recipe_nutrition_estimate_lines_confidence_check" CHECK ("confidence" >= 0 AND "confidence" <= 1),
    CONSTRAINT "recipe_nutrition_estimate_lines_json_check" CHECK (
        jsonb_typeof("nutrient_coverage") = 'array'
        AND jsonb_typeof("source_versions") = 'array'
        AND jsonb_typeof("assumptions") = 'array'
        AND jsonb_typeof("uncertainty") = 'object'
    )
);

CREATE TABLE "recipe_nutrition_ai_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "revision_id" UUID NOT NULL,
    "estimate_id" UUID,
    "provider" VARCHAR(40) NOT NULL,
    "model_id" VARCHAR(100) NOT NULL,
    "status" "ai_request_status" NOT NULL,
    "request_payload_hash" CHAR(64) NOT NULL,
    "result_payload" JSONB,
    "error_code" VARCHAR(100),
    "started_at" TIMESTAMPTZ(3) NOT NULL,
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recipe_nutrition_ai_jobs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "recipe_nutrition_ai_jobs_completion_shape" CHECK (
        ("status" = 'IN_PROGRESS' AND "completed_at" IS NULL)
        OR ("status" <> 'IN_PROGRESS' AND "completed_at" IS NOT NULL)
    ),
    CONSTRAINT "recipe_nutrition_ai_jobs_result_shape" CHECK ("result_payload" IS NULL OR jsonb_typeof("result_payload") = 'object')
);

CREATE UNIQUE INDEX "recipe_steps_revision_id_position_key" ON "recipe_steps"("revision_id", "position");
CREATE INDEX "recipe_steps_cooking_method_id_idx" ON "recipe_steps"("cooking_method_id");
CREATE UNIQUE INDEX "recipe_nutrition_estimates_revision_id_version_key" ON "recipe_nutrition_estimates"("revision_id", "version");
CREATE INDEX "recipe_nutrition_estimates_revision_id_status_created_at_idx" ON "recipe_nutrition_estimates"("revision_id", "status", "created_at");
CREATE INDEX "recipe_nutrition_estimates_recipe_fingerprint_idx" ON "recipe_nutrition_estimates"("recipe_fingerprint");
CREATE UNIQUE INDEX "recipe_nutrition_estimate_lines_estimate_id_position_key" ON "recipe_nutrition_estimate_lines"("estimate_id", "position");
CREATE INDEX "recipe_nutrition_estimate_lines_recipe_ingredient_id_idx" ON "recipe_nutrition_estimate_lines"("recipe_ingredient_id");
CREATE INDEX "recipe_nutrition_estimate_lines_ingredient_id_idx" ON "recipe_nutrition_estimate_lines"("ingredient_id");
CREATE INDEX "recipe_nutrition_ai_jobs_revision_id_created_at_idx" ON "recipe_nutrition_ai_jobs"("revision_id", "created_at");
CREATE INDEX "recipe_nutrition_ai_jobs_status_created_at_idx" ON "recipe_nutrition_ai_jobs"("status", "created_at");

ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_revision_id_fkey"
    FOREIGN KEY ("revision_id") REFERENCES "post_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_cooking_method_id_fkey"
    FOREIGN KEY ("cooking_method_id") REFERENCES "cooking_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recipe_nutrition_estimates" ADD CONSTRAINT "recipe_nutrition_estimates_revision_id_fkey"
    FOREIGN KEY ("revision_id") REFERENCES "post_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recipe_nutrition_estimate_lines" ADD CONSTRAINT "recipe_nutrition_estimate_lines_estimate_id_fkey"
    FOREIGN KEY ("estimate_id") REFERENCES "recipe_nutrition_estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recipe_nutrition_estimate_lines" ADD CONSTRAINT "recipe_nutrition_estimate_lines_recipe_ingredient_id_fkey"
    FOREIGN KEY ("recipe_ingredient_id") REFERENCES "recipe_ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recipe_nutrition_estimate_lines" ADD CONSTRAINT "recipe_nutrition_estimate_lines_ingredient_id_fkey"
    FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recipe_nutrition_ai_jobs" ADD CONSTRAINT "recipe_nutrition_ai_jobs_revision_id_fkey"
    FOREIGN KEY ("revision_id") REFERENCES "post_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recipe_nutrition_ai_jobs" ADD CONSTRAINT "recipe_nutrition_ai_jobs_estimate_id_fkey"
    FOREIGN KEY ("estimate_id") REFERENCES "recipe_nutrition_estimates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
