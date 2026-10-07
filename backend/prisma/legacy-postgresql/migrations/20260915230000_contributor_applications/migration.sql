ALTER TABLE "contributor_applications"
  ADD COLUMN "approved_type" "contributor_type",
  ADD COLUMN "approval_basis" VARCHAR(2000),
  ADD COLUMN "review_note" VARCHAR(2000),
  ADD COLUMN "reviewed_by_id" UUID,
  ADD COLUMN "reviewed_at" TIMESTAMPTZ(3),
  ADD COLUMN "reapply_eligible_at" TIMESTAMPTZ(3);

CREATE TABLE "contributor_profiles" (
  "user_id" UUID NOT NULL,
  "contributor_type" "contributor_type" NOT NULL,
  "approval_basis" VARCHAR(2000) NOT NULL,
  "approved_at" TIMESTAMPTZ(3) NOT NULL,
  "approved_by_id" UUID NOT NULL,
  "source_application_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "contributor_profiles_pkey" PRIMARY KEY ("user_id")
);

CREATE INDEX "contributor_applications_status_created_at_id_idx"
  ON "contributor_applications"("status", "created_at", "id");
CREATE INDEX "contributor_applications_requested_type_status_created_at_idx"
  ON "contributor_applications"("requested_type", "status", "created_at");
CREATE INDEX "contributor_applications_reviewed_by_id_reviewed_at_idx"
  ON "contributor_applications"("reviewed_by_id", "reviewed_at");
CREATE UNIQUE INDEX "contributor_profiles_source_application_id_key"
  ON "contributor_profiles"("source_application_id");
CREATE INDEX "contributor_profiles_contributor_type_approved_at_idx"
  ON "contributor_profiles"("contributor_type", "approved_at");
CREATE INDEX "contributor_profiles_approved_by_id_approved_at_idx"
  ON "contributor_profiles"("approved_by_id", "approved_at");

ALTER TABLE "contributor_applications"
  ADD CONSTRAINT "contributor_applications_reviewed_by_id_fkey"
  FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "contributor_profiles"
  ADD CONSTRAINT "contributor_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contributor_profiles"
  ADD CONSTRAINT "contributor_profiles_approved_by_id_fkey"
  FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contributor_profiles"
  ADD CONSTRAINT "contributor_profiles_source_application_id_fkey"
  FOREIGN KEY ("source_application_id") REFERENCES "contributor_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
