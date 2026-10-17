CREATE TYPE "restaurant_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "restaurant_source" AS ENUM ('MEMBER', 'ADMIN');

CREATE TABLE "restaurants" (
  "id" UUID NOT NULL,
  "name" VARCHAR(180) NOT NULL,
  "normalized_name" VARCHAR(180) NOT NULL,
  "address" VARCHAR(500) NOT NULL,
  "normalized_address" VARCHAR(500) NOT NULL,
  "latitude" DECIMAL(9,6) NOT NULL,
  "longitude" DECIMAL(9,6) NOT NULL,
  "categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "diet_tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "allergen_free_codes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "excluded_ingredients" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "source" "restaurant_source" NOT NULL,
  "status" "restaurant_status" NOT NULL DEFAULT 'PENDING',
  "submitter_id" UUID,
  "reviewer_id" UUID,
  "reviewed_at" TIMESTAMPTZ(3),
  "review_reason" VARCHAR(1000),
  "data_checked_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "restaurants_status_latitude_longitude_idx" ON "restaurants"("status", "latitude", "longitude");
CREATE INDEX "restaurants_normalized_name_normalized_address_idx" ON "restaurants"("normalized_name", "normalized_address");
CREATE INDEX "restaurants_submitter_id_status_idx" ON "restaurants"("submitter_id", "status");
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "restaurant_external_refs" (
  "id" UUID NOT NULL,
  "restaurant_id" UUID NOT NULL,
  "provider" VARCHAR(50) NOT NULL,
  "place_id" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "restaurant_external_refs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "restaurant_external_refs_provider_place_id_key" ON "restaurant_external_refs"("provider", "place_id");
CREATE INDEX "restaurant_external_refs_restaurant_id_idx" ON "restaurant_external_refs"("restaurant_id");
ALTER TABLE "restaurant_external_refs" ADD CONSTRAINT "restaurant_external_refs_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
