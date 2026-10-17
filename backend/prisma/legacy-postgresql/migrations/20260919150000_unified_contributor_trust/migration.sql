CREATE TYPE "contributor_approval_basis" AS ENUM (
  'ORGANIZATION_AFFILIATION',
  'PLATFORM_TRACK_RECORD',
  'ADMIN_INVITED'
);

CREATE TYPE "contributor_decision_type" AS ENUM ('APPROVED', 'REJECTED', 'REVOKED');

ALTER TABLE "contributor_applications"
  RENAME COLUMN "approval_basis" TO "legacy_approval_basis";

ALTER TABLE "contributor_profiles"
  RENAME COLUMN "approval_basis" TO "legacy_approval_basis";

ALTER TABLE "contributor_applications"
  ADD COLUMN "claimed_approval_basis" "contributor_approval_basis",
  ADD COLUMN "organization_claim" VARCHAR(500),
  ADD COLUMN "invited_by_id" UUID,
  ADD COLUMN "invitation_reason" VARCHAR(2000),
  ADD COLUMN "approval_basis" "contributor_approval_basis",
  ADD COLUMN "review_evidence" JSONB;

ALTER TABLE "contributor_profiles"
  ADD COLUMN "approval_basis" "contributor_approval_basis",
  ADD COLUMN "approval_evidence" JSONB,
  ADD COLUMN "revoked_at" TIMESTAMPTZ(3),
  ADD COLUMN "revoked_by_id" UUID,
  ADD COLUMN "revocation_reason" VARCHAR(2000);

-- Historical subtype names do not prove an organization affiliation or verified credential.
-- Conservatively map every legacy request/profile to PLATFORM_TRACK_RECORD and retain the
-- original values and free-text basis inside immutable migration evidence for later audit.
UPDATE "contributor_applications" AS application
SET
  "claimed_approval_basis" = 'PLATFORM_TRACK_RECORD',
  "approval_basis" = CASE
    WHEN application."status" = 'APPROVED' THEN 'PLATFORM_TRACK_RECORD'::"contributor_approval_basis"
    ELSE NULL
  END,
  "review_evidence" = CASE
    WHEN application."status" = 'APPROVED' THEN jsonb_build_object(
      'kind', 'PLATFORM_TRACK_RECORD',
      'capturedAt', COALESCE(application."reviewed_at", application."updated_at"),
      'snapshotVersion', 'phase-14-migration-v1',
      'mapping', jsonb_build_object(
        'legacyRequestedType', application."requested_type"::text,
        'legacyApprovedType', application."approved_type"::text,
        'legacyApprovalBasisText', application."legacy_approval_basis",
        'rationale', 'Conservative migration: legacy subtype did not prove organization affiliation or credential verification.'
      ),
      'posts', jsonb_build_object(
        'total', (SELECT COUNT(*) FROM "posts" post WHERE post."author_id" = application."user_id"),
        'published', (SELECT COUNT(*) FROM "posts" post WHERE post."author_id" = application."user_id" AND post."status" = 'PUBLISHED'),
        'pendingReview', (SELECT COUNT(*) FROM "posts" post WHERE post."author_id" = application."user_id" AND post."status" = 'PENDING_REVIEW'),
        'rejected', (SELECT COUNT(*) FROM "posts" post WHERE post."author_id" = application."user_id" AND post."status" = 'REJECTED')
      ),
      'interactions', jsonb_build_object(
        'commentsReceived', (SELECT COUNT(*) FROM "comments" comment INNER JOIN "posts" post ON post."id" = comment."post_id" WHERE post."author_id" = application."user_id"),
        'votesReceived', (SELECT COUNT(*) FROM "post_votes" vote INNER JOIN "posts" post ON post."id" = vote."post_id" WHERE post."author_id" = application."user_id"),
        'ratingsReceived', (SELECT COUNT(*) FROM "post_ratings" rating INNER JOIN "posts" post ON post."id" = rating."post_id" WHERE post."author_id" = application."user_id" AND rating."active" = true),
        'bookmarksReceived', (SELECT COUNT(*) FROM "post_bookmarks" bookmark INNER JOIN "posts" post ON post."id" = bookmark."post_id" WHERE post."author_id" = application."user_id")
      )
    )
    ELSE NULL
  END;

UPDATE "contributor_profiles" AS profile
SET
  "approval_basis" = 'PLATFORM_TRACK_RECORD',
  "approval_evidence" = COALESCE(
    application."review_evidence",
    jsonb_build_object(
      'kind', 'PLATFORM_TRACK_RECORD',
      'capturedAt', profile."approved_at",
      'snapshotVersion', 'phase-14-migration-v1',
      'mapping', jsonb_build_object(
        'legacyContributorType', profile."contributor_type"::text,
        'legacyApprovalBasisText', profile."legacy_approval_basis",
        'rationale', 'Conservative migration: legacy subtype did not prove organization affiliation or credential verification.'
      )
    )
  )
FROM "contributor_applications" AS application
WHERE application."id" = profile."source_application_id";

ALTER TABLE "contributor_applications"
  ALTER COLUMN "claimed_approval_basis" SET NOT NULL;

ALTER TABLE "contributor_profiles"
  ALTER COLUMN "approval_basis" SET NOT NULL,
  ALTER COLUMN "approval_evidence" SET NOT NULL;

ALTER TABLE "contributor_applications" ALTER COLUMN "source" DROP DEFAULT;
CREATE TYPE "contributor_application_source_new" AS ENUM (
  'REGISTRATION',
  'PROFILE',
  'ADMIN_INVITATION'
);
ALTER TABLE "contributor_applications"
  ALTER COLUMN "source" TYPE "contributor_application_source_new"
  USING ("source"::text::"contributor_application_source_new");
DROP TYPE "contributor_application_source";
ALTER TYPE "contributor_application_source_new" RENAME TO "contributor_application_source";
ALTER TABLE "contributor_applications"
  ALTER COLUMN "source" SET DEFAULT 'REGISTRATION'::"contributor_application_source";

CREATE TABLE "contributor_decisions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "application_id" UUID,
  "actor_id" UUID NOT NULL,
  "decision" "contributor_decision_type" NOT NULL,
  "approval_basis" "contributor_approval_basis",
  "evidence" JSONB,
  "reason" VARCHAR(2000) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contributor_decisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "contributor_decisions_reason_not_blank" CHECK (length(btrim("reason")) > 0),
  CONSTRAINT "contributor_decisions_evidence_consistent" CHECK (
    ("decision" = 'REJECTED' AND "approval_basis" IS NULL AND "evidence" IS NULL)
    OR
    ("decision" IN ('APPROVED', 'REVOKED') AND "approval_basis" IS NOT NULL AND "evidence" IS NOT NULL)
  )
);

INSERT INTO "contributor_decisions" (
  "user_id",
  "application_id",
  "actor_id",
  "decision",
  "approval_basis",
  "evidence",
  "reason",
  "created_at"
)
SELECT
  application."user_id",
  application."id",
  application."reviewed_by_id",
  CASE
    WHEN application."status" = 'APPROVED' THEN 'APPROVED'::"contributor_decision_type"
    ELSE 'REJECTED'::"contributor_decision_type"
  END,
  application."approval_basis",
  application."review_evidence",
  COALESCE(application."review_note", 'Historical Contributor decision migrated in Phase 14.'),
  COALESCE(application."reviewed_at", application."updated_at")
FROM "contributor_applications" AS application
WHERE application."status" IN ('APPROVED', 'REJECTED')
  AND application."reviewed_by_id" IS NOT NULL;

DROP INDEX "contributor_applications_requested_type_status_created_at_idx";
DROP INDEX "contributor_profiles_contributor_type_approved_at_idx";

ALTER TABLE "contributor_applications"
  DROP COLUMN "requested_type",
  DROP COLUMN "approved_type",
  DROP COLUMN "legacy_approval_basis";

ALTER TABLE "contributor_profiles"
  DROP COLUMN "contributor_type",
  DROP COLUMN "legacy_approval_basis";

DROP TYPE "contributor_type";

ALTER TABLE "contributor_applications"
  ADD CONSTRAINT "contributor_applications_claim_consistent" CHECK (
    (
      "source" = 'ADMIN_INVITATION'
      AND "claimed_approval_basis" = 'ADMIN_INVITED'
      AND "invited_by_id" IS NOT NULL
      AND "invitation_reason" IS NOT NULL
    )
    OR
    (
      "source" <> 'ADMIN_INVITATION'
      AND "claimed_approval_basis" <> 'ADMIN_INVITED'
      AND "invited_by_id" IS NULL
      AND "invitation_reason" IS NULL
    )
  ),
  ADD CONSTRAINT "contributor_applications_organization_claim_required" CHECK (
    "claimed_approval_basis" <> 'ORGANIZATION_AFFILIATION'
    OR "organization_claim" IS NOT NULL
  ),
  ADD CONSTRAINT "contributor_applications_review_consistent" CHECK (
    (
      "status" = 'PENDING'
      AND "approval_basis" IS NULL
      AND "review_evidence" IS NULL
      AND "review_note" IS NULL
      AND "reviewed_by_id" IS NULL
      AND "reviewed_at" IS NULL
      AND "reapply_eligible_at" IS NULL
    )
    OR
    (
      "status" = 'APPROVED'
      AND "approval_basis" IS NOT NULL
      AND "review_evidence" IS NOT NULL
      AND "review_note" IS NOT NULL
      AND "reviewed_by_id" IS NOT NULL
      AND "reviewed_at" IS NOT NULL
      AND "reapply_eligible_at" IS NULL
    )
    OR
    (
      "status" = 'REJECTED'
      AND "approval_basis" IS NULL
      AND "review_evidence" IS NULL
      AND "review_note" IS NOT NULL
      AND "reviewed_by_id" IS NOT NULL
      AND "reviewed_at" IS NOT NULL
      AND "reapply_eligible_at" IS NOT NULL
    )
  );

ALTER TABLE "contributor_profiles"
  ADD CONSTRAINT "contributor_profiles_revocation_consistent" CHECK (
    ("revoked_at" IS NULL AND "revoked_by_id" IS NULL AND "revocation_reason" IS NULL)
    OR
    ("revoked_at" IS NOT NULL AND "revoked_by_id" IS NOT NULL AND "revocation_reason" IS NOT NULL)
  );

CREATE INDEX "contributor_applications_claimed_basis_status_created_at_idx"
  ON "contributor_applications"("claimed_approval_basis", "status", "created_at");
CREATE INDEX "contributor_applications_invited_by_id_created_at_idx"
  ON "contributor_applications"("invited_by_id", "created_at");
CREATE INDEX "contributor_profiles_approval_basis_approved_at_idx"
  ON "contributor_profiles"("approval_basis", "approved_at");
CREATE INDEX "contributor_profiles_revoked_by_id_revoked_at_idx"
  ON "contributor_profiles"("revoked_by_id", "revoked_at");
CREATE INDEX "contributor_decisions_user_id_created_at_idx"
  ON "contributor_decisions"("user_id", "created_at");
CREATE INDEX "contributor_decisions_application_id_created_at_idx"
  ON "contributor_decisions"("application_id", "created_at");
CREATE INDEX "contributor_decisions_actor_id_created_at_idx"
  ON "contributor_decisions"("actor_id", "created_at");
CREATE INDEX "contributor_decisions_decision_created_at_idx"
  ON "contributor_decisions"("decision", "created_at");

ALTER TABLE "contributor_applications"
  ADD CONSTRAINT "contributor_applications_invited_by_id_fkey"
  FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "contributor_profiles"
  ADD CONSTRAINT "contributor_profiles_revoked_by_id_fkey"
  FOREIGN KEY ("revoked_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "contributor_decisions"
  ADD CONSTRAINT "contributor_decisions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "contributor_decisions_application_id_fkey"
  FOREIGN KEY ("application_id") REFERENCES "contributor_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "contributor_decisions_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
