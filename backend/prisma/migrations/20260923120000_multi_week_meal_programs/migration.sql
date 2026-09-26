-- Phase 19: Multi-week Meal Programs
CREATE TYPE "meal_program_status" AS ENUM ('GENERATING', 'DRAFT', 'PARTIAL', 'FAILED', 'CONFIRMED');
CREATE TYPE "meal_program_week_status" AS ENUM ('PENDING', 'READY', 'FAILED');
CREATE TYPE "meal_program_projection_status" AS ENUM ('CURRENT', 'STALE');
CREATE TYPE "meal_program_analysis_status" AS ENUM ('CURRENT', 'STALE');
CREATE TYPE "meal_program_mutation_type" AS ENUM ('UPDATE_METADATA', 'SELECT_ALTERNATIVE', 'REGENERATE_WEEK', 'REANALYZE', 'CONFIRM');

CREATE TABLE "meal_programs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "goal" "meal_goal" NOT NULL,
    "start_date" DATE NOT NULL,
    "timezone" VARCHAR(64) NOT NULL,
    "horizon_weeks" INTEGER NOT NULL,
    "status" "meal_program_status" NOT NULL DEFAULT 'GENERATING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotency_key" VARCHAR(120) NOT NULL,
    "payload_hash" CHAR(64) NOT NULL,
    "generation_parameters" JSONB NOT NULL,
    "failure_summary" JSONB,
    "confirmed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "meal_programs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "meal_programs_horizon_valid" CHECK ("horizon_weeks" BETWEEN 2 AND 12),
    CONSTRAINT "meal_programs_confirmed_shape" CHECK (
      ("status" = 'CONFIRMED' AND "confirmed_at" IS NOT NULL)
      OR ("status" <> 'CONFIRMED' AND "confirmed_at" IS NULL)
    )
);

CREATE TABLE "meal_program_weeks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "meal_program_id" UUID NOT NULL,
    "week_index" INTEGER NOT NULL,
    "week_start" DATE NOT NULL,
    "status" "meal_program_week_status" NOT NULL DEFAULT 'PENDING',
    "selected_alternative_rank" INTEGER,
    "projection_status" "meal_program_projection_status" NOT NULL DEFAULT 'CURRENT',
    "failure" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "meal_program_weeks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "meal_program_weeks_index_valid" CHECK ("week_index" >= 0),
    CONSTRAINT "meal_program_weeks_selection_valid" CHECK (
      ("status" = 'READY' AND "selected_alternative_rank" IS NOT NULL AND "failure" IS NULL)
      OR ("status" = 'FAILED' AND "selected_alternative_rank" IS NULL AND "failure" IS NOT NULL)
      OR ("status" = 'PENDING' AND "selected_alternative_rank" IS NULL)
    )
);

CREATE TABLE "meal_program_week_alternatives" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "week_id" UUID NOT NULL,
    "meal_plan_id" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "seed" VARCHAR(120) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meal_program_week_alternatives_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "meal_program_week_alternatives_rank_valid" CHECK ("rank" >= 0 AND "rank" < 5)
);

CREATE TABLE "meal_program_analyses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "meal_program_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "meal_program_analysis_status" NOT NULL DEFAULT 'CURRENT',
    "input_fingerprint" CHAR(64) NOT NULL,
    "invalidated_from_week_index" INTEGER,
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "nutrition_summary" JSONB NOT NULL,
    "weekly_analyses" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "meal_program_analyses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meal_program_mutations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "meal_program_id" UUID NOT NULL,
    "type" "meal_program_mutation_type" NOT NULL,
    "idempotency_key" VARCHAR(120) NOT NULL,
    "payload_hash" CHAR(64) NOT NULL,
    "resulting_version" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meal_program_mutations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meal_programs_user_id_idempotency_key_key" ON "meal_programs"("user_id", "idempotency_key");
CREATE INDEX "meal_programs_user_id_status_start_date_created_at_idx" ON "meal_programs"("user_id", "status", "start_date", "created_at");
CREATE UNIQUE INDEX "meal_program_weeks_meal_program_id_week_index_key" ON "meal_program_weeks"("meal_program_id", "week_index");
CREATE UNIQUE INDEX "meal_program_weeks_meal_program_id_week_start_key" ON "meal_program_weeks"("meal_program_id", "week_start");
CREATE INDEX "meal_program_weeks_meal_program_id_status_week_index_idx" ON "meal_program_weeks"("meal_program_id", "status", "week_index");
CREATE UNIQUE INDEX "meal_program_week_alternatives_week_id_rank_key" ON "meal_program_week_alternatives"("week_id", "rank");
CREATE UNIQUE INDEX "meal_program_week_alternatives_week_id_meal_plan_id_key" ON "meal_program_week_alternatives"("week_id", "meal_plan_id");
CREATE INDEX "meal_program_week_alternatives_meal_plan_id_idx" ON "meal_program_week_alternatives"("meal_plan_id");
CREATE UNIQUE INDEX "meal_program_analyses_meal_program_id_version_key" ON "meal_program_analyses"("meal_program_id", "version");
CREATE INDEX "meal_program_analyses_meal_program_id_status_created_at_idx" ON "meal_program_analyses"("meal_program_id", "status", "created_at");
CREATE INDEX "meal_program_analyses_input_fingerprint_idx" ON "meal_program_analyses"("input_fingerprint");
CREATE UNIQUE INDEX "meal_program_mutations_user_id_idempotency_key_key" ON "meal_program_mutations"("user_id", "idempotency_key");
CREATE INDEX "meal_program_mutations_meal_program_id_created_at_idx" ON "meal_program_mutations"("meal_program_id", "created_at");

ALTER TABLE "meal_programs" ADD CONSTRAINT "meal_programs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_program_weeks" ADD CONSTRAINT "meal_program_weeks_meal_program_id_fkey" FOREIGN KEY ("meal_program_id") REFERENCES "meal_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_program_week_alternatives" ADD CONSTRAINT "meal_program_week_alternatives_week_id_fkey" FOREIGN KEY ("week_id") REFERENCES "meal_program_weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_program_week_alternatives" ADD CONSTRAINT "meal_program_week_alternatives_meal_plan_id_fkey" FOREIGN KEY ("meal_plan_id") REFERENCES "meal_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "meal_program_analyses" ADD CONSTRAINT "meal_program_analyses_meal_program_id_fkey" FOREIGN KEY ("meal_program_id") REFERENCES "meal_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_program_mutations" ADD CONSTRAINT "meal_program_mutations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_program_mutations" ADD CONSTRAINT "meal_program_mutations_meal_program_id_fkey" FOREIGN KEY ("meal_program_id") REFERENCES "meal_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
