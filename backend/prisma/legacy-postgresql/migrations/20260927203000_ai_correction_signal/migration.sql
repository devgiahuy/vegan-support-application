ALTER TABLE "recognition_candidates" ADD COLUMN "edited_by_user" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "receipt_candidates" ADD COLUMN "edited_by_user" BOOLEAN NOT NULL DEFAULT false;

UPDATE "recognition_candidates" SET "edited_by_user" = true
WHERE "status" = 'EDITED'::"recognition_candidate_status"
   OR ("status" = 'CONFIRMED'::"recognition_candidate_status" AND "version" > 1);

UPDATE "receipt_candidates" SET "edited_by_user" = true
WHERE "status" = 'EDITED'::"receipt_candidate_status"
   OR ("status" = 'CONFIRMED'::"receipt_candidate_status" AND "version" > 1);
