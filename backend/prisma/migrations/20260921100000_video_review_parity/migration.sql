ALTER TABLE "posts"
    ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE "post_revisions"
    ADD COLUMN "submitted_at" TIMESTAMPTZ(3),
    ALTER COLUMN "status" SET DEFAULT 'DRAFT';

UPDATE "post_revisions"
SET "submitted_at" = "created_at"
WHERE "status" IN ('PENDING_REVIEW', 'FLAGGED', 'QUARANTINED', 'PUBLISHED', 'REJECTED');

CREATE INDEX "post_revisions_post_id_submitted_at_idx"
    ON "post_revisions"("post_id", "submitted_at" DESC)
    WHERE "submitted_at" IS NOT NULL;
