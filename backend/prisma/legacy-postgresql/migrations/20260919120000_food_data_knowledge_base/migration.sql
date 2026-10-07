CREATE TYPE "food_data_provider" AS ENUM ('USDA_FDC', 'VIETNAM_CURATED', 'OPEN_FOOD_FACTS', 'MANUAL', 'AI_SUGGESTION');
CREATE TYPE "food_data_review_status" AS ENUM ('STAGED', 'APPROVED', 'REJECTED', 'SUPERSEDED');
CREATE TYPE "food_data_quality" AS ENUM ('VERIFIED', 'REVIEWED', 'ESTIMATED', 'INCOMPLETE');
CREATE TYPE "food_data_import_status" AS ENUM ('PREVIEWED', 'COMMITTED', 'FAILED');
CREATE TYPE "unit_dimension" AS ENUM ('MASS', 'VOLUME', 'ENERGY', 'COUNT', 'PROPORTION');
CREATE TYPE "nutrient_reference_type" AS ENUM ('RDA', 'AI', 'UL', 'DV', 'OTHER');
CREATE TYPE "evidence_grade" AS ENUM ('HIGH', 'MODERATE', 'LOW', 'INSUFFICIENT');
CREATE TYPE "food_rule_severity" AS ENUM ('INFO', 'CAUTION', 'HIGH');
CREATE TYPE "guideline_period" AS ENUM ('MEAL', 'DAY', 'WEEK');
CREATE TYPE "interaction_scope" AS ENUM ('SAME_DISH', 'SAME_MEAL', 'SAME_DAY');
CREATE TYPE "interaction_direction" AS ENUM ('BENEFICIAL', 'ADVERSE');
CREATE TYPE "food_data_suggestion_type" AS ENUM (
    'INGREDIENT_MAPPING',
    'NUTRIENT_VALUE',
    'REFERENCE_INTAKE',
    'HOUSEHOLD_CONVERSION',
    'RETENTION_FACTOR',
    'YIELD_FACTOR',
    'INTERACTION_RULE'
);

CREATE TABLE "food_data_sources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "provider" "food_data_provider" NOT NULL,
    "source_url" VARCHAR(2048),
    "license_name" VARCHAR(200) NOT NULL,
    "license_url" VARCHAR(2048),
    "attribution" VARCHAR(1000) NOT NULL,
    "default_locale" VARCHAR(20) NOT NULL DEFAULT 'en-US',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "food_data_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_data_import_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(160) NOT NULL,
    "source_version" VARCHAR(120) NOT NULL,
    "source_date" DATE,
    "payload_hash" VARCHAR(64) NOT NULL,
    "status" "food_data_import_status" NOT NULL DEFAULT 'PREVIEWED',
    "staged_payload" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "committed_at" TIMESTAMPTZ(3),
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "food_data_import_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ingredient_food_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingredient_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "import_batch_id" UUID,
    "source_record_id" VARCHAR(160) NOT NULL,
    "source_version" VARCHAR(120) NOT NULL,
    "source_date" DATE,
    "preparation" VARCHAR(120) NOT NULL DEFAULT 'raw',
    "locale" VARCHAR(20) NOT NULL DEFAULT 'en-US',
    "edible_portion_percent" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "serving_grams" DECIMAL(12,4),
    "quality" "food_data_quality" NOT NULL,
    "review_status" "food_data_review_status" NOT NULL DEFAULT 'STAGED',
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ingredient_food_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ingredient_food_profiles_edible_check" CHECK ("edible_portion_percent" > 0 AND "edible_portion_percent" <= 100),
    CONSTRAINT "ingredient_food_profiles_serving_check" CHECK ("serving_grams" IS NULL OR "serving_grams" > 0),
    CONSTRAINT "ingredient_food_profiles_effective_check" CHECK ("effective_to" IS NULL OR "effective_to" >= "effective_from")
);

CREATE TABLE "household_conversions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "unit_name" VARCHAR(100) NOT NULL,
    "unit_symbol" VARCHAR(30),
    "quantity" DECIMAL(12,4) NOT NULL,
    "unit_dimension" "unit_dimension" NOT NULL,
    "grams" DECIMAL(12,4) NOT NULL,
    "quality" "food_data_quality" NOT NULL,
    "review_status" "food_data_review_status" NOT NULL DEFAULT 'STAGED',
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "household_conversions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "household_conversions_positive_check" CHECK ("quantity" > 0 AND "grams" > 0),
    CONSTRAINT "household_conversions_dimension_check" CHECK ("unit_dimension" IN ('COUNT', 'VOLUME'))
);

CREATE TABLE "nutrients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "default_unit" VARCHAR(20) NOT NULL,
    "unit_dimension" "unit_dimension" NOT NULL,
    "description" VARCHAR(1000),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nutrients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ingredient_nutrient_values" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "nutrient_id" UUID NOT NULL,
    "value_per_100g" DECIMAL(18,8) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "min_value" DECIMAL(18,8),
    "max_value" DECIMAL(18,8),
    "quality" "food_data_quality" NOT NULL,
    "review_status" "food_data_review_status" NOT NULL DEFAULT 'STAGED',
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ingredient_nutrient_values_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ingredient_nutrient_values_range_check" CHECK (
        "value_per_100g" >= 0
        AND ("min_value" IS NULL OR "min_value" >= 0 AND "min_value" <= "value_per_100g")
        AND ("max_value" IS NULL OR "max_value" >= "value_per_100g")
    ),
    CONSTRAINT "ingredient_nutrient_values_effective_check" CHECK ("effective_to" IS NULL OR "effective_to" >= "effective_from")
);

CREATE TABLE "nutrient_reference_intakes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nutrient_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "reference_type" "nutrient_reference_type" NOT NULL,
    "population_code" VARCHAR(120) NOT NULL,
    "applicability" JSONB NOT NULL,
    "value" DECIMAL(18,8) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "warning_eligible" BOOLEAN NOT NULL DEFAULT false,
    "source_record_id" VARCHAR(160) NOT NULL,
    "source_version" VARCHAR(120) NOT NULL,
    "locale" VARCHAR(20) NOT NULL DEFAULT 'en-US',
    "review_status" "food_data_review_status" NOT NULL DEFAULT 'STAGED',
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nutrient_reference_intakes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "nutrient_reference_intakes_value_check" CHECK ("value" > 0),
    CONSTRAINT "nutrient_reference_intakes_effective_check" CHECK ("effective_to" IS NULL OR "effective_to" >= "effective_from")
);

CREATE TABLE "ingredient_intake_guidelines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingredient_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "population_code" VARCHAR(120) NOT NULL,
    "applicability" JSONB NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "unit" VARCHAR(30) NOT NULL,
    "frequency" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "period" "guideline_period" NOT NULL,
    "advisory_only" BOOLEAN NOT NULL DEFAULT true,
    "evidence_grade" "evidence_grade" NOT NULL,
    "severity" "food_rule_severity" NOT NULL,
    "explanation" VARCHAR(2000) NOT NULL,
    "source_record_id" VARCHAR(160) NOT NULL,
    "source_version" VARCHAR(120) NOT NULL,
    "locale" VARCHAR(20) NOT NULL DEFAULT 'en-US',
    "review_status" "food_data_review_status" NOT NULL DEFAULT 'STAGED',
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ingredient_intake_guidelines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ingredient_intake_guidelines_amount_check" CHECK ("amount" > 0 AND "frequency" > 0),
    CONSTRAINT "ingredient_intake_guidelines_effective_check" CHECK ("effective_to" IS NULL OR "effective_to" >= "effective_from")
);

CREATE TABLE "cooking_methods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" VARCHAR(1000),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cooking_methods_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nutrient_retention_factors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cooking_method_id" UUID NOT NULL,
    "nutrient_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "factor" DECIMAL(7,6) NOT NULL,
    "applicability" JSONB NOT NULL,
    "source_record_id" VARCHAR(160) NOT NULL,
    "source_version" VARCHAR(120) NOT NULL,
    "quality" "food_data_quality" NOT NULL,
    "review_status" "food_data_review_status" NOT NULL DEFAULT 'STAGED',
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nutrient_retention_factors_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "nutrient_retention_factors_factor_check" CHECK ("factor" >= 0 AND "factor" <= 1),
    CONSTRAINT "nutrient_retention_factors_effective_check" CHECK ("effective_to" IS NULL OR "effective_to" >= "effective_from")
);

CREATE TABLE "cooking_yield_factors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cooking_method_id" UUID NOT NULL,
    "ingredient_id" UUID,
    "source_id" UUID NOT NULL,
    "factor" DECIMAL(7,6) NOT NULL,
    "applicability" JSONB NOT NULL,
    "source_record_id" VARCHAR(160) NOT NULL,
    "source_version" VARCHAR(120) NOT NULL,
    "quality" "food_data_quality" NOT NULL,
    "review_status" "food_data_review_status" NOT NULL DEFAULT 'STAGED',
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cooking_yield_factors_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cooking_yield_factors_factor_check" CHECK ("factor" > 0),
    CONSTRAINT "cooking_yield_factors_effective_check" CHECK ("effective_to" IS NULL OR "effective_to" >= "effective_from")
);

CREATE TABLE "ingredient_interaction_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingredient_a_id" UUID NOT NULL,
    "ingredient_b_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "scope" "interaction_scope" NOT NULL,
    "direction" "interaction_direction" NOT NULL,
    "severity" "food_rule_severity" NOT NULL,
    "evidence_grade" "evidence_grade" NOT NULL,
    "applicability" JSONB NOT NULL,
    "explanation" VARCHAR(2000) NOT NULL,
    "suggested_action" VARCHAR(1000),
    "hard_rule" BOOLEAN NOT NULL DEFAULT false,
    "source_record_id" VARCHAR(160) NOT NULL,
    "source_version" VARCHAR(120) NOT NULL,
    "locale" VARCHAR(20) NOT NULL DEFAULT 'en-US',
    "review_status" "food_data_review_status" NOT NULL DEFAULT 'STAGED',
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ingredient_interaction_rules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ingredient_interaction_rules_distinct_check" CHECK ("ingredient_a_id" <> "ingredient_b_id"),
    CONSTRAINT "ingredient_interaction_rules_order_check" CHECK ("ingredient_a_id"::text < "ingredient_b_id"::text),
    CONSTRAINT "ingredient_interaction_rules_hard_rule_check" CHECK (
        NOT "hard_rule" OR ("review_status" = 'APPROVED' AND "evidence_grade" <> 'INSUFFICIENT')
    ),
    CONSTRAINT "ingredient_interaction_rules_effective_check" CHECK ("effective_to" IS NULL OR "effective_to" >= "effective_from")
);

CREATE TABLE "food_data_suggestions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "suggestion_type" "food_data_suggestion_type" NOT NULL,
    "provider" "food_data_provider" NOT NULL DEFAULT 'AI_SUGGESTION',
    "payload" JSONB NOT NULL,
    "rationale" VARCHAR(2000),
    "confidence" DECIMAL(5,4),
    "review_status" "food_data_review_status" NOT NULL DEFAULT 'STAGED',
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "review_note" VARCHAR(2000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "food_data_suggestions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "food_data_suggestions_provider_check" CHECK ("provider" = 'AI_SUGGESTION'),
    CONSTRAINT "food_data_suggestions_confidence_check" CHECK ("confidence" IS NULL OR "confidence" >= 0 AND "confidence" <= 1)
);

ALTER TABLE "ingredient_aliases"
    ADD COLUMN "locale" VARCHAR(20) NOT NULL DEFAULT 'vi-VN',
    ADD COLUMN "source_id" UUID,
    ADD COLUMN "source_record_id" VARCHAR(160),
    ADD COLUMN "review_status" "food_data_review_status" NOT NULL DEFAULT 'APPROVED',
    ADD COLUMN "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "food_data_sources_code_key" ON "food_data_sources"("code");
CREATE INDEX "food_data_sources_provider_active_idx" ON "food_data_sources"("provider", "active");
CREATE UNIQUE INDEX "food_data_import_batches_source_id_idempotency_key_key" ON "food_data_import_batches"("source_id", "idempotency_key");
CREATE INDEX "food_data_import_batches_source_id_source_version_status_created_at_idx" ON "food_data_import_batches"("source_id", "source_version", "status", "created_at");
CREATE UNIQUE INDEX "ingredient_food_profiles_source_id_source_record_id_source_version_key" ON "ingredient_food_profiles"("source_id", "source_record_id", "source_version");
CREATE UNIQUE INDEX "ingredient_food_profiles_source_record_effective_key" ON "ingredient_food_profiles"("source_id", "source_record_id", "effective_from");
CREATE INDEX "ingredient_food_profiles_ingredient_id_preparation_review_status_effective_from_idx" ON "ingredient_food_profiles"("ingredient_id", "preparation", "review_status", "effective_from");
CREATE INDEX "ingredient_food_profiles_source_id_source_record_id_idx" ON "ingredient_food_profiles"("source_id", "source_record_id");
CREATE INDEX "ingredient_food_profiles_import_batch_id_idx" ON "ingredient_food_profiles"("import_batch_id");
CREATE UNIQUE INDEX "household_conversions_profile_id_unit_name_quantity_key" ON "household_conversions"("profile_id", "unit_name", "quantity");
CREATE INDEX "household_conversions_profile_id_review_status_idx" ON "household_conversions"("profile_id", "review_status");
CREATE UNIQUE INDEX "nutrients_code_key" ON "nutrients"("code");
CREATE INDEX "nutrients_active_name_idx" ON "nutrients"("active", "name");
CREATE UNIQUE INDEX "ingredient_nutrient_values_profile_id_nutrient_id_effective_from_key" ON "ingredient_nutrient_values"("profile_id", "nutrient_id", "effective_from");
CREATE INDEX "ingredient_nutrient_values_nutrient_id_review_status_effective_from_idx" ON "ingredient_nutrient_values"("nutrient_id", "review_status", "effective_from");
CREATE UNIQUE INDEX "nutrient_reference_intakes_identity_key" ON "nutrient_reference_intakes"("nutrient_id", "reference_type", "population_code", "source_id", "source_version", "effective_from");
CREATE UNIQUE INDEX "nutrient_reference_intakes_source_record_effective_key" ON "nutrient_reference_intakes"("source_id", "source_record_id", "effective_from");
CREATE INDEX "nutrient_reference_intakes_population_code_review_status_effective_from_idx" ON "nutrient_reference_intakes"("population_code", "review_status", "effective_from");
CREATE UNIQUE INDEX "ingredient_intake_guidelines_identity_key" ON "ingredient_intake_guidelines"("ingredient_id", "population_code", "period", "source_id", "source_version", "effective_from");
CREATE UNIQUE INDEX "ingredient_intake_guidelines_source_record_effective_key" ON "ingredient_intake_guidelines"("source_id", "source_record_id", "effective_from");
CREATE INDEX "ingredient_intake_guidelines_ingredient_id_review_status_effective_from_idx" ON "ingredient_intake_guidelines"("ingredient_id", "review_status", "effective_from");
CREATE UNIQUE INDEX "cooking_methods_code_key" ON "cooking_methods"("code");
CREATE INDEX "cooking_methods_active_name_idx" ON "cooking_methods"("active", "name");
CREATE UNIQUE INDEX "nutrient_retention_factors_identity_key" ON "nutrient_retention_factors"("cooking_method_id", "nutrient_id", "source_id", "source_version", "effective_from");
CREATE UNIQUE INDEX "nutrient_retention_factors_source_record_effective_key" ON "nutrient_retention_factors"("source_id", "source_record_id", "effective_from");
CREATE INDEX "nutrient_retention_factors_method_review_effective_idx" ON "nutrient_retention_factors"("cooking_method_id", "review_status", "effective_from");
CREATE INDEX "cooking_yield_factors_method_ingredient_review_effective_idx" ON "cooking_yield_factors"("cooking_method_id", "ingredient_id", "review_status", "effective_from");
CREATE UNIQUE INDEX "cooking_yield_factors_identity_key" ON "cooking_yield_factors"("cooking_method_id", "ingredient_id", "source_id", "source_version", "effective_from");
CREATE UNIQUE INDEX "cooking_yield_factors_source_record_effective_key" ON "cooking_yield_factors"("source_id", "source_record_id", "effective_from");
CREATE INDEX "cooking_yield_factors_source_identity_idx" ON "cooking_yield_factors"("source_id", "source_record_id", "source_version");
CREATE UNIQUE INDEX "ingredient_interaction_rules_identity_key" ON "ingredient_interaction_rules"("ingredient_a_id", "ingredient_b_id", "scope", "source_id", "source_version", "effective_from");
CREATE UNIQUE INDEX "ingredient_interaction_rules_source_record_effective_key" ON "ingredient_interaction_rules"("source_id", "source_record_id", "effective_from");
CREATE INDEX "ingredient_interaction_rules_scope_review_status_effective_from_idx" ON "ingredient_interaction_rules"("scope", "review_status", "effective_from");
CREATE INDEX "ingredient_interaction_rules_ingredient_a_id_ingredient_b_id_idx" ON "ingredient_interaction_rules"("ingredient_a_id", "ingredient_b_id");
CREATE INDEX "food_data_suggestions_suggestion_type_review_status_created_at_idx" ON "food_data_suggestions"("suggestion_type", "review_status", "created_at");
CREATE INDEX "ingredient_aliases_normalized_alias_locale_review_status_idx" ON "ingredient_aliases"("normalized_alias", "locale", "review_status");
CREATE INDEX "ingredient_aliases_source_id_source_record_id_idx" ON "ingredient_aliases"("source_id", "source_record_id");

ALTER TABLE "food_data_import_batches" ADD CONSTRAINT "food_data_import_batches_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "food_data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ingredient_food_profiles" ADD CONSTRAINT "ingredient_food_profiles_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ingredient_food_profiles" ADD CONSTRAINT "ingredient_food_profiles_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "food_data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ingredient_food_profiles" ADD CONSTRAINT "ingredient_food_profiles_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "food_data_import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "household_conversions" ADD CONSTRAINT "household_conversions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "ingredient_food_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ingredient_nutrient_values" ADD CONSTRAINT "ingredient_nutrient_values_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "ingredient_food_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ingredient_nutrient_values" ADD CONSTRAINT "ingredient_nutrient_values_nutrient_id_fkey" FOREIGN KEY ("nutrient_id") REFERENCES "nutrients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nutrient_reference_intakes" ADD CONSTRAINT "nutrient_reference_intakes_nutrient_id_fkey" FOREIGN KEY ("nutrient_id") REFERENCES "nutrients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nutrient_reference_intakes" ADD CONSTRAINT "nutrient_reference_intakes_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "food_data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ingredient_intake_guidelines" ADD CONSTRAINT "ingredient_intake_guidelines_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ingredient_intake_guidelines" ADD CONSTRAINT "ingredient_intake_guidelines_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "food_data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nutrient_retention_factors" ADD CONSTRAINT "nutrient_retention_factors_cooking_method_id_fkey" FOREIGN KEY ("cooking_method_id") REFERENCES "cooking_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nutrient_retention_factors" ADD CONSTRAINT "nutrient_retention_factors_nutrient_id_fkey" FOREIGN KEY ("nutrient_id") REFERENCES "nutrients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nutrient_retention_factors" ADD CONSTRAINT "nutrient_retention_factors_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "food_data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cooking_yield_factors" ADD CONSTRAINT "cooking_yield_factors_cooking_method_id_fkey" FOREIGN KEY ("cooking_method_id") REFERENCES "cooking_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cooking_yield_factors" ADD CONSTRAINT "cooking_yield_factors_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cooking_yield_factors" ADD CONSTRAINT "cooking_yield_factors_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "food_data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ingredient_interaction_rules" ADD CONSTRAINT "ingredient_interaction_rules_ingredient_a_id_fkey" FOREIGN KEY ("ingredient_a_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ingredient_interaction_rules" ADD CONSTRAINT "ingredient_interaction_rules_ingredient_b_id_fkey" FOREIGN KEY ("ingredient_b_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ingredient_interaction_rules" ADD CONSTRAINT "ingredient_interaction_rules_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "food_data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ingredient_aliases" ADD CONSTRAINT "ingredient_aliases_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "food_data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
