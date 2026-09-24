ALTER TYPE "media_kind" ADD VALUE 'FRIDGE_IMAGE';

CREATE TYPE "recognition_job_status" AS ENUM ('QUEUED', 'PROCESSING', 'READY', 'PARTIAL_FAILED', 'FAILED', 'CONFIRMED', 'CANCELLED');
CREATE TYPE "recognition_input_status" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');
CREATE TYPE "recognition_candidate_status" AS ENUM ('PROPOSED', 'EDITED', 'REJECTED', 'CONFIRMED');

CREATE TABLE "recognition_jobs" (
  "id" UUID NOT NULL,
  "owner_id" UUID NOT NULL,
  "status" "recognition_job_status" NOT NULL DEFAULT 'QUEUED',
  "provider" VARCHAR(40) NOT NULL,
  "model_id" VARCHAR(100) NOT NULL,
  "template_version" VARCHAR(80) NOT NULL,
  "idempotency_key" VARCHAR(160) NOT NULL,
  "request_hash" CHAR(64) NOT NULL,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "error_code" VARCHAR(100),
  "error_message" VARCHAR(500),
  "confirmation_key" VARCHAR(160),
  "confirmation_hash" CHAR(64),
  "last_retry_key" VARCHAR(160),
  "last_retry_hash" CHAR(64),
  "processing_started_at" TIMESTAMPTZ(3),
  "processing_completed_at" TIMESTAMPTZ(3),
  "confirmed_at" TIMESTAMPTZ(3),
  "cancelled_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "recognition_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recognition_inputs" (
  "id" UUID NOT NULL,
  "job_id" UUID NOT NULL,
  "asset_id" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "status" "recognition_input_status" NOT NULL DEFAULT 'PENDING',
  "error_code" VARCHAR(100),
  "error_message" VARCHAR(500),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "recognition_inputs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recognition_candidates" (
  "id" UUID NOT NULL,
  "job_id" UUID NOT NULL,
  "ingredient_id" UUID,
  "detected_name" VARCHAR(160) NOT NULL,
  "normalized_name" VARCHAR(160) NOT NULL,
  "quantity" DECIMAL(14,4),
  "unit" VARCHAR(40),
  "freshness_observation" VARCHAR(1000),
  "confidence" DECIMAL(5,4) NOT NULL,
  "match_confidence" DECIMAL(5,4),
  "uncertainty_note" VARCHAR(500),
  "status" "recognition_candidate_status" NOT NULL DEFAULT 'PROPOSED',
  "version" INTEGER NOT NULL DEFAULT 1,
  "pantry_item_id" UUID,
  "pantry_action" VARCHAR(20),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "recognition_candidates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recognition_candidate_evidence" (
  "candidate_id" UUID NOT NULL,
  "input_id" UUID NOT NULL,
  "observation" VARCHAR(500),
  "confidence" DECIMAL(5,4) NOT NULL,
  CONSTRAINT "recognition_candidate_evidence_pkey" PRIMARY KEY ("candidate_id", "input_id")
);

CREATE UNIQUE INDEX "recognition_jobs_owner_id_idempotency_key_key" ON "recognition_jobs"("owner_id", "idempotency_key");
CREATE UNIQUE INDEX "recognition_jobs_owner_id_confirmation_key_key" ON "recognition_jobs"("owner_id", "confirmation_key");
CREATE INDEX "recognition_jobs_owner_id_status_created_at_idx" ON "recognition_jobs"("owner_id", "status", "created_at");
CREATE INDEX "recognition_jobs_status_updated_at_idx" ON "recognition_jobs"("status", "updated_at");
CREATE UNIQUE INDEX "recognition_inputs_job_id_position_key" ON "recognition_inputs"("job_id", "position");
CREATE UNIQUE INDEX "recognition_inputs_job_id_asset_id_key" ON "recognition_inputs"("job_id", "asset_id");
CREATE INDEX "recognition_inputs_asset_id_idx" ON "recognition_inputs"("asset_id");
CREATE INDEX "recognition_candidates_job_id_status_created_at_idx" ON "recognition_candidates"("job_id", "status", "created_at");
CREATE INDEX "recognition_candidates_ingredient_id_idx" ON "recognition_candidates"("ingredient_id");
CREATE INDEX "recognition_candidates_pantry_item_id_idx" ON "recognition_candidates"("pantry_item_id");
CREATE INDEX "recognition_candidate_evidence_input_id_idx" ON "recognition_candidate_evidence"("input_id");

ALTER TABLE "recognition_jobs" ADD CONSTRAINT "recognition_jobs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recognition_inputs" ADD CONSTRAINT "recognition_inputs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "recognition_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recognition_inputs" ADD CONSTRAINT "recognition_inputs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recognition_candidates" ADD CONSTRAINT "recognition_candidates_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "recognition_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recognition_candidates" ADD CONSTRAINT "recognition_candidates_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recognition_candidates" ADD CONSTRAINT "recognition_candidates_pantry_item_id_fkey" FOREIGN KEY ("pantry_item_id") REFERENCES "pantry_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recognition_candidate_evidence" ADD CONSTRAINT "recognition_candidate_evidence_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "recognition_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recognition_candidate_evidence" ADD CONSTRAINT "recognition_candidate_evidence_input_id_fkey" FOREIGN KEY ("input_id") REFERENCES "recognition_inputs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
