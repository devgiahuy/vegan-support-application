ALTER TYPE "media_kind" ADD VALUE 'RECEIPT_IMAGE';

CREATE TYPE "receipt_job_status" AS ENUM ('QUEUED', 'PROCESSING', 'READY', 'PARTIAL_FAILED', 'FAILED', 'CONFIRMED', 'CANCELLED');
CREATE TYPE "receipt_input_status" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');
CREATE TYPE "receipt_candidate_status" AS ENUM ('PROPOSED', 'EDITED', 'REJECTED', 'CONFIRMED');

CREATE TABLE "receipt_jobs" (
  "id" UUID NOT NULL,
  "owner_id" UUID NOT NULL,
  "status" "receipt_job_status" NOT NULL DEFAULT 'QUEUED',
  "provider" VARCHAR(40) NOT NULL,
  "model_id" VARCHAR(100) NOT NULL,
  "template_version" VARCHAR(80) NOT NULL,
  "idempotency_key" VARCHAR(160) NOT NULL,
  "request_hash" CHAR(64) NOT NULL,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "merchant_name" VARCHAR(200),
  "purchased_at" DATE,
  "currency" CHAR(3),
  "total_amount" DECIMAL(14,2),
  "metadata_confidence" DECIMAL(5,4),
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
  CONSTRAINT "receipt_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "receipt_inputs" (
  "id" UUID NOT NULL,
  "job_id" UUID NOT NULL,
  "asset_id" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "status" "receipt_input_status" NOT NULL DEFAULT 'PENDING',
  "error_code" VARCHAR(100),
  "error_message" VARCHAR(500),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "receipt_inputs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "receipt_candidates" (
  "id" UUID NOT NULL,
  "job_id" UUID NOT NULL,
  "input_id" UUID NOT NULL,
  "ingredient_id" UUID,
  "line_text" VARCHAR(300) NOT NULL,
  "detected_name" VARCHAR(160) NOT NULL,
  "normalized_name" VARCHAR(160) NOT NULL,
  "quantity" DECIMAL(14,4),
  "unit" VARCHAR(40),
  "unit_price" DECIMAL(14,2),
  "line_total" DECIMAL(14,2),
  "currency" CHAR(3),
  "confidence" DECIMAL(5,4) NOT NULL,
  "match_confidence" DECIMAL(5,4),
  "uncertainty_note" VARCHAR(500),
  "status" "receipt_candidate_status" NOT NULL DEFAULT 'PROPOSED',
  "version" INTEGER NOT NULL DEFAULT 1,
  "pantry_item_id" UUID,
  "pantry_action" VARCHAR(20),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "receipt_candidates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "receipt_jobs_owner_id_idempotency_key_key" ON "receipt_jobs"("owner_id", "idempotency_key");
CREATE UNIQUE INDEX "receipt_jobs_owner_id_confirmation_key_key" ON "receipt_jobs"("owner_id", "confirmation_key");
CREATE INDEX "receipt_jobs_owner_id_status_created_at_idx" ON "receipt_jobs"("owner_id", "status", "created_at");
CREATE INDEX "receipt_jobs_status_updated_at_idx" ON "receipt_jobs"("status", "updated_at");
CREATE UNIQUE INDEX "receipt_inputs_job_id_position_key" ON "receipt_inputs"("job_id", "position");
CREATE UNIQUE INDEX "receipt_inputs_job_id_asset_id_key" ON "receipt_inputs"("job_id", "asset_id");
CREATE INDEX "receipt_inputs_asset_id_idx" ON "receipt_inputs"("asset_id");
CREATE INDEX "receipt_candidates_job_id_status_created_at_idx" ON "receipt_candidates"("job_id", "status", "created_at");
CREATE INDEX "receipt_candidates_input_id_idx" ON "receipt_candidates"("input_id");
CREATE INDEX "receipt_candidates_ingredient_id_idx" ON "receipt_candidates"("ingredient_id");
CREATE INDEX "receipt_candidates_pantry_item_id_idx" ON "receipt_candidates"("pantry_item_id");

ALTER TABLE "receipt_jobs" ADD CONSTRAINT "receipt_jobs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "receipt_inputs" ADD CONSTRAINT "receipt_inputs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "receipt_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "receipt_inputs" ADD CONSTRAINT "receipt_inputs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receipt_candidates" ADD CONSTRAINT "receipt_candidates_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "receipt_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "receipt_candidates" ADD CONSTRAINT "receipt_candidates_input_id_fkey" FOREIGN KEY ("input_id") REFERENCES "receipt_inputs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "receipt_candidates" ADD CONSTRAINT "receipt_candidates_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receipt_candidates" ADD CONSTRAINT "receipt_candidates_pantry_item_id_fkey" FOREIGN KEY ("pantry_item_id") REFERENCES "pantry_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
