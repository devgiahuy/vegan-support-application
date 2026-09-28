-- Phase 18 prerequisite correction: Phase 17 created this column as VARCHAR while
-- Prisma's canonical schema models it as an enum. Preserve all existing values.
CREATE TYPE "nutrition_coverage" AS ENUM ('COMPLETE', 'PARTIAL', 'UNAVAILABLE');

ALTER TABLE "custom_meals"
  ALTER COLUMN "nutrition_coverage" DROP DEFAULT,
  ALTER COLUMN "nutrition_coverage" TYPE "nutrition_coverage"
    USING "nutrition_coverage"::"nutrition_coverage",
  ALTER COLUMN "nutrition_coverage" SET DEFAULT 'UNAVAILABLE';
