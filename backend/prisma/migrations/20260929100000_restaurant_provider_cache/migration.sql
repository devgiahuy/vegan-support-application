CREATE TABLE "restaurant_provider_places" (
  "id" UUID NOT NULL,
  "provider" VARCHAR(50) NOT NULL,
  "place_id" VARCHAR(255) NOT NULL,
  "name" VARCHAR(180) NOT NULL,
  "address" VARCHAR(500) NOT NULL,
  "latitude" DECIMAL(9,6) NOT NULL,
  "longitude" DECIMAL(9,6) NOT NULL,
  "categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "rating" DECIMAL(3,1),
  "review_count" INTEGER,
  "price" VARCHAR(50),
  "open_state" VARCHAR(100),
  "operating_hours" JSONB,
  "phone" VARCHAR(80),
  "website" VARCHAR(1000),
  "thumbnail_url" VARCHAR(1000),
  "maps_url" VARCHAR(1000),
  "attribution" VARCHAR(500) NOT NULL,
  "fetched_at" TIMESTAMPTZ(3) NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "restaurant_provider_places_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "restaurant_provider_places_provider_place_id_key" ON "restaurant_provider_places"("provider", "place_id");
CREATE INDEX "restaurant_provider_places_provider_latitude_longitude_idx" ON "restaurant_provider_places"("provider", "latitude", "longitude");
CREATE INDEX "restaurant_provider_places_expires_at_idx" ON "restaurant_provider_places"("expires_at");