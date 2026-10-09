CREATE TYPE "health_sex" AS ENUM ('MALE', 'FEMALE');
CREATE TYPE "activity_level" AS ENUM (
    'SEDENTARY',
    'LIGHTLY_ACTIVE',
    'MODERATELY_ACTIVE',
    'VERY_ACTIVE',
    'EXTRA_ACTIVE'
);
CREATE TYPE "health_data_source" AS ENUM ('MANUAL');
CREATE TYPE "diet_pattern" AS ENUM ('VEGAN', 'LACTO_OVO');
CREATE TYPE "practice_schedule" AS ENUM ('PERMANENT', 'PERIODIC');
CREATE TYPE "tradition" AS ENUM ('NONE', 'BUDDHIST', 'CHRISTIAN');
CREATE TYPE "diet_rule_source" AS ENUM ('DIET_PATTERN', 'TRADITION');
CREATE TYPE "allergy_severity" AS ENUM ('MILD', 'MODERATE', 'SEVERE');

ALTER TABLE "users" ADD COLUMN "avatar_url" VARCHAR(2048);

CREATE TABLE "health_profiles" (
    "user_id" UUID NOT NULL,
    "height_cm" DECIMAL(5,2) NOT NULL,
    "weight_kg" DECIMAL(6,2) NOT NULL,
    "age" INTEGER NOT NULL,
    "sex" "health_sex" NOT NULL,
    "activity_level" "activity_level" NOT NULL,
    "bmi" DECIMAL(6,2) NOT NULL,
    "bmr" DECIMAL(8,2) NOT NULL,
    "tdee" DECIMAL(8,2) NOT NULL,
    "data_source" "health_data_source" NOT NULL DEFAULT 'MANUAL',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "health_profiles_pkey" PRIMARY KEY ("user_id"),
    CONSTRAINT "health_profiles_height_check" CHECK ("height_cm" BETWEEN 80 AND 250),
    CONSTRAINT "health_profiles_weight_check" CHECK ("weight_kg" BETWEEN 20 AND 500),
    CONSTRAINT "health_profiles_age_check" CHECK ("age" BETWEEN 13 AND 120)
);

CREATE TABLE "diet_preferences" (
    "user_id" UUID NOT NULL,
    "diet_pattern" "diet_pattern" NOT NULL,
    "practice_schedule" "practice_schedule" NOT NULL,
    "tradition" "tradition" NOT NULL,
    "rule_set_version" INTEGER NOT NULL,
    "confirmed_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "diet_preferences_pkey" PRIMARY KEY ("user_id"),
    CONSTRAINT "diet_preferences_rule_set_version_check" CHECK ("rule_set_version" > 0)
);

CREATE TABLE "diet_rule_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(120) NOT NULL,
    "label" VARCHAR(180) NOT NULL,
    "description" TEXT NOT NULL,
    "source" "diet_rule_source" NOT NULL,
    "diet_pattern" "diet_pattern",
    "tradition" "tradition",
    "default_enabled" BOOLEAN NOT NULL DEFAULT true,
    "hard_constraint" BOOLEAN NOT NULL DEFAULT true,
    "rule_set_version" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "diet_rule_definitions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "diet_rule_definitions_version_check" CHECK ("rule_set_version" > 0),
    CONSTRAINT "diet_rule_definitions_scope_check" CHECK (
        ("source" = 'DIET_PATTERN' AND "diet_pattern" IS NOT NULL AND "tradition" IS NULL)
        OR
        ("source" = 'TRADITION' AND "diet_pattern" IS NULL AND "tradition" IS NOT NULL)
    )
);

CREATE TABLE "diet_preference_rules" (
    "user_id" UUID NOT NULL,
    "rule_definition_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "source" "diet_rule_source" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "diet_preference_rules_pkey" PRIMARY KEY ("user_id", "rule_definition_id")
);

CREATE TABLE "diet_schedule_dates" (
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "diet_schedule_dates_pkey" PRIMARY KEY ("user_id", "date")
);

CREATE TABLE "user_allergies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "allergen_code" VARCHAR(100) NOT NULL,
    "label" VARCHAR(160),
    "severity" "allergy_severity",
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_allergies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_ingredient_exclusions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "ingredient_name" VARCHAR(160) NOT NULL,
    "normalized_name" VARCHAR(160) NOT NULL,
    "reason" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_ingredient_exclusions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "diet_rule_definitions_code_rule_set_version_key"
    ON "diet_rule_definitions"("code", "rule_set_version");
CREATE INDEX "diet_rule_definitions_rule_set_version_active_idx"
    ON "diet_rule_definitions"("rule_set_version", "active");
CREATE INDEX "diet_preference_rules_user_id_enabled_idx"
    ON "diet_preference_rules"("user_id", "enabled");
CREATE INDEX "diet_schedule_dates_user_id_enabled_date_idx"
    ON "diet_schedule_dates"("user_id", "enabled", "date");
CREATE UNIQUE INDEX "user_allergies_user_id_allergen_code_key"
    ON "user_allergies"("user_id", "allergen_code");
CREATE INDEX "user_allergies_user_id_active_idx"
    ON "user_allergies"("user_id", "active");
CREATE UNIQUE INDEX "user_ingredient_exclusions_user_id_normalized_name_key"
    ON "user_ingredient_exclusions"("user_id", "normalized_name");
CREATE INDEX "user_ingredient_exclusions_user_id_active_idx"
    ON "user_ingredient_exclusions"("user_id", "active");

ALTER TABLE "health_profiles"
    ADD CONSTRAINT "health_profiles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "diet_preferences"
    ADD CONSTRAINT "diet_preferences_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "diet_preference_rules"
    ADD CONSTRAINT "diet_preference_rules_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "diet_preference_rules"
    ADD CONSTRAINT "diet_preference_rules_rule_definition_id_fkey"
    FOREIGN KEY ("rule_definition_id") REFERENCES "diet_rule_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "diet_schedule_dates"
    ADD CONSTRAINT "diet_schedule_dates_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_allergies"
    ADD CONSTRAINT "user_allergies_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_ingredient_exclusions"
    ADD CONSTRAINT "user_ingredient_exclusions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
