-- Phase 18: Meal Portion & Compatibility Analysis
ALTER TYPE "meal_plan_mutation_type" ADD VALUE 'MANUAL_ADD';

ALTER TABLE "meal_plan_items" ADD COLUMN "servings" DECIMAL(6,2) NOT NULL DEFAULT 1;

CREATE TYPE "meal_analysis_status" AS ENUM ('CURRENT', 'STALE');

CREATE TABLE "meal_analyses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "meal_plan_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "meal_analysis_status" NOT NULL DEFAULT 'CURRENT',
    "algorithm_version" VARCHAR(80) NOT NULL,
    "input_fingerprint" CHAR(64) NOT NULL,
    "request_snapshot" JSONB NOT NULL,
    "profile_snapshot" JSONB NOT NULL,
    "rule_versions" JSONB NOT NULL,
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "incomplete_data" JSONB NOT NULL DEFAULT '[]',
    "summary" JSONB NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "disclaimer" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "meal_analyses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meal_analyses_meal_plan_id_version_key" ON "meal_analyses"("meal_plan_id", "version");
CREATE INDEX "meal_analyses_meal_plan_id_status_created_at_idx" ON "meal_analyses"("meal_plan_id", "status", "created_at");
CREATE INDEX "meal_analyses_input_fingerprint_idx" ON "meal_analyses"("input_fingerprint");

ALTER TABLE "meal_analyses" ADD CONSTRAINT "meal_analyses_meal_plan_id_fkey"
FOREIGN KEY ("meal_plan_id") REFERENCES "meal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
