CREATE TYPE "ai_artifact_type" AS ENUM ('CHAT_ANSWER', 'RECIPE_NUTRITION', 'FRIDGE_RECOGNITION', 'RECEIPT_EXTRACTION');
CREATE TYPE "ai_artifact_status" AS ENUM ('DRAFT', 'SUBMITTED');
CREATE TYPE "ai_artifact_visibility" AS ENUM ('PRIVATE', 'PUBLIC');
CREATE TYPE "ai_verification_conclusion" AS ENUM ('VERIFIED', 'CORRECTION_NEEDED', 'REJECTED');
CREATE TYPE "ai_verification_status" AS ENUM ('ACTIVE', 'SUPERSEDED', 'REVOKED');
CREATE TYPE "ai_verification_admin_action_type" AS ENUM ('OVERRIDE', 'REVOKE');

CREATE TABLE "ai_artifacts" (
  "id" UUID NOT NULL,
  "owner_id" UUID NOT NULL,
  "type" "ai_artifact_type" NOT NULL,
  "source_id" UUID NOT NULL,
  "source_version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "snapshot_hash" CHAR(64) NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "summary" VARCHAR(1000) NOT NULL,
  "author_anonymous" BOOLEAN NOT NULL DEFAULT true,
  "status" "ai_artifact_status" NOT NULL DEFAULT 'DRAFT',
  "visibility" "ai_artifact_visibility" NOT NULL DEFAULT 'PRIVATE',
  "version" INTEGER NOT NULL DEFAULT 1,
  "lifecycle_version" INTEGER NOT NULL DEFAULT 1,
  "submitted_at" TIMESTAMPTZ(3),
  "shared_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "ai_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_verifications" (
  "id" UUID NOT NULL,
  "artifact_id" UUID NOT NULL,
  "artifact_version" INTEGER NOT NULL,
  "reviewer_id" UUID NOT NULL,
  "reviewer_role" "user_role" NOT NULL,
  "conclusion" "ai_verification_conclusion" NOT NULL,
  "scope" VARCHAR(500) NOT NULL,
  "evidence_note" VARCHAR(2000) NOT NULL,
  "correction" VARCHAR(2000),
  "status" "ai_verification_status" NOT NULL DEFAULT 'ACTIVE',
  "supersedes_id" UUID,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "ai_verifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_verification_admin_actions" (
  "id" UUID NOT NULL,
  "verification_id" UUID NOT NULL,
  "actor_id" UUID NOT NULL,
  "action" "ai_verification_admin_action_type" NOT NULL,
  "reason" VARCHAR(2000) NOT NULL,
  "expected_version" INTEGER NOT NULL,
  "resulting_version" INTEGER NOT NULL,
  "replacement_verification_id" UUID,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_verification_admin_actions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_artifacts_owner_id_type_source_id_source_version_key" ON "ai_artifacts"("owner_id", "type", "source_id", "source_version");
CREATE INDEX "ai_artifacts_owner_id_created_at_id_idx" ON "ai_artifacts"("owner_id", "created_at", "id");
CREATE INDEX "ai_artifacts_visibility_status_shared_at_id_idx" ON "ai_artifacts"("visibility", "status", "shared_at", "id");
CREATE UNIQUE INDEX "ai_verifications_one_active_per_artifact" ON "ai_verifications"("artifact_id") WHERE "status" = 'ACTIVE';
CREATE INDEX "ai_verifications_artifact_id_created_at_id_idx" ON "ai_verifications"("artifact_id", "created_at", "id");
CREATE INDEX "ai_verifications_reviewer_id_created_at_idx" ON "ai_verifications"("reviewer_id", "created_at");
CREATE INDEX "ai_verifications_supersedes_id_idx" ON "ai_verifications"("supersedes_id");
CREATE INDEX "ai_verification_admin_actions_verification_id_created_at_idx" ON "ai_verification_admin_actions"("verification_id", "created_at");
CREATE INDEX "ai_verification_admin_actions_actor_id_created_at_idx" ON "ai_verification_admin_actions"("actor_id", "created_at");
CREATE INDEX "ai_verification_admin_actions_replacement_verification_id_idx" ON "ai_verification_admin_actions"("replacement_verification_id");

ALTER TABLE "ai_artifacts" ADD CONSTRAINT "ai_artifacts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_verifications" ADD CONSTRAINT "ai_verifications_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "ai_artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_verifications" ADD CONSTRAINT "ai_verifications_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_verifications" ADD CONSTRAINT "ai_verifications_supersedes_id_fkey" FOREIGN KEY ("supersedes_id") REFERENCES "ai_verifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_verification_admin_actions" ADD CONSTRAINT "ai_verification_admin_actions_verification_id_fkey" FOREIGN KEY ("verification_id") REFERENCES "ai_verifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_verification_admin_actions" ADD CONSTRAINT "ai_verification_admin_actions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_verification_admin_actions" ADD CONSTRAINT "ai_verification_admin_actions_replacement_verification_id_fkey" FOREIGN KEY ("replacement_verification_id") REFERENCES "ai_verifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
