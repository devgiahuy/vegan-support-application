ALTER TYPE "post_status" ADD VALUE 'QUARANTINED' AFTER 'FLAGGED';
ALTER TYPE "post_revision_status" ADD VALUE 'QUARANTINED' AFTER 'FLAGGED';

CREATE TYPE "report_target_type" AS ENUM ('POST', 'COMMENT');
CREATE TYPE "report_status" AS ENUM ('OPEN', 'RESOLVED');
CREATE TYPE "moderation_priority" AS ENUM ('NORMAL', 'HIGH');
CREATE TYPE "ai_flag_risk_level" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "ai_flag_status" AS ENUM ('OPEN', 'REVIEWED');
CREATE TYPE "moderation_target_type" AS ENUM ('POST', 'COMMENT', 'USER', 'REPORT', 'AI_FLAG');
CREATE TYPE "moderation_decision" AS ENUM (
  'APPROVE', 'REJECT', 'NO_VIOLATION', 'WARN', 'HIDE', 'RESTORE',
  'DEMOTE', 'BAN', 'UNBAN', 'LOCK', 'UNLOCK', 'DELETE_ACCOUNT'
);

ALTER TABLE "users"
  ADD COLUMN "private_data_purge_at" TIMESTAMPTZ(3);

ALTER TABLE "posts"
  ADD COLUMN "hidden_at" TIMESTAMPTZ(3),
  ADD COLUMN "hidden_by_id" UUID,
  ADD COLUMN "hidden_reason" VARCHAR(1000);

ALTER TABLE "post_revisions"
  ADD COLUMN "reviewed_by_id" UUID,
  ADD COLUMN "reviewed_at" TIMESTAMPTZ(3);

CREATE TABLE "reports" (
  "id" UUID NOT NULL,
  "reporter_id" UUID NOT NULL,
  "target_type" "report_target_type" NOT NULL,
  "target_id" UUID NOT NULL,
  "reason_code" VARCHAR(120) NOT NULL,
  "details" VARCHAR(2000),
  "status" "report_status" NOT NULL DEFAULT 'OPEN',
  "priority" "moderation_priority" NOT NULL DEFAULT 'NORMAL',
  "active_key" VARCHAR(160),
  "resolved_decision" "moderation_decision",
  "resolved_reason" VARCHAR(2000),
  "resolved_by_id" UUID,
  "resolved_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reports_reason_code_not_blank" CHECK (length(btrim("reason_code")) > 0),
  CONSTRAINT "reports_resolution_consistent" CHECK (
    ("status" = 'OPEN' AND "resolved_decision" IS NULL AND "resolved_reason" IS NULL AND "resolved_by_id" IS NULL AND "resolved_at" IS NULL AND "active_key" IS NOT NULL)
    OR
    ("status" = 'RESOLVED' AND "resolved_decision" IS NOT NULL AND "resolved_reason" IS NOT NULL AND "resolved_by_id" IS NOT NULL AND "resolved_at" IS NOT NULL AND "active_key" IS NULL)
  ),
  CONSTRAINT "reports_active_key_matches_target" CHECK (
    "status" = 'RESOLVED'
    OR "active_key" = "reporter_id"::text || ':' || "target_type"::text || ':' || "target_id"::text
  )
);

CREATE TABLE "ai_flags" (
  "id" UUID NOT NULL,
  "post_revision_id" UUID NOT NULL,
  "provider" VARCHAR(80) NOT NULL,
  "model" VARCHAR(120) NOT NULL,
  "rule_version" VARCHAR(40) NOT NULL,
  "reason_codes" JSONB NOT NULL,
  "risk_score" DECIMAL(5,4) NOT NULL,
  "risk_level" "ai_flag_risk_level" NOT NULL,
  "status" "ai_flag_status" NOT NULL DEFAULT 'OPEN',
  "reviewed_by_id" UUID,
  "reviewed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_flags_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_flags_risk_score_range" CHECK ("risk_score" BETWEEN 0 AND 1),
  CONSTRAINT "ai_flags_reason_codes_array" CHECK (jsonb_typeof("reason_codes") = 'array')
);

CREATE TABLE "moderation_actions" (
  "id" UUID NOT NULL,
  "actor_id" UUID NOT NULL,
  "decision" "moderation_decision" NOT NULL,
  "target_type" "moderation_target_type" NOT NULL,
  "target_id" UUID NOT NULL,
  "reason" VARCHAR(2000) NOT NULL,
  "related_report_ids" JSONB NOT NULL DEFAULT '[]',
  "related_ai_flag_ids" JSONB NOT NULL DEFAULT '[]',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "moderation_actions_reason_not_blank" CHECK (length(btrim("reason")) > 0),
  CONSTRAINT "moderation_actions_related_reports_array" CHECK (jsonb_typeof("related_report_ids") = 'array'),
  CONSTRAINT "moderation_actions_related_flags_array" CHECK (jsonb_typeof("related_ai_flag_ids") = 'array'),
  CONSTRAINT "moderation_actions_metadata_object" CHECK (jsonb_typeof("metadata") = 'object')
);

CREATE UNIQUE INDEX "reports_active_key_key" ON "reports"("active_key");
CREATE INDEX "reports_target_type_target_id_status_created_at_idx" ON "reports"("target_type", "target_id", "status", "created_at");
CREATE INDEX "reports_status_priority_created_at_idx" ON "reports"("status", "priority", "created_at");
CREATE INDEX "reports_reporter_id_status_created_at_idx" ON "reports"("reporter_id", "status", "created_at");
CREATE INDEX "ai_flags_status_risk_level_created_at_idx" ON "ai_flags"("status", "risk_level", "created_at");
CREATE INDEX "ai_flags_post_revision_id_status_idx" ON "ai_flags"("post_revision_id", "status");
CREATE INDEX "moderation_actions_target_type_target_id_created_at_idx" ON "moderation_actions"("target_type", "target_id", "created_at");
CREATE INDEX "moderation_actions_actor_id_created_at_idx" ON "moderation_actions"("actor_id", "created_at");
CREATE INDEX "moderation_actions_decision_created_at_idx" ON "moderation_actions"("decision", "created_at");

ALTER TABLE "posts" ADD CONSTRAINT "posts_hidden_by_id_fkey" FOREIGN KEY ("hidden_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "post_revisions" ADD CONSTRAINT "post_revisions_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_flags" ADD CONSTRAINT "ai_flags_post_revision_id_fkey" FOREIGN KEY ("post_revision_id") REFERENCES "post_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_flags" ADD CONSTRAINT "ai_flags_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
