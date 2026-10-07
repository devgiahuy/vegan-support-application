CREATE TYPE "storage_reservation_status" AS ENUM ('RESERVED', 'COMMITTED', 'RELEASED', 'EXPIRED');
CREATE TYPE "media_asset_status" AS ENUM ('ACTIVE', 'DELETING', 'DELETED', 'PROVIDER_MISSING');
CREATE TYPE "media_resource_type" AS ENUM ('IMAGE', 'VIDEO');

CREATE TABLE "storage_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "quota_bytes" BIGINT NOT NULL,
    "reservation_ttl_seconds" INTEGER NOT NULL,
    "warning_percent" INTEGER NOT NULL DEFAULT 80,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "storage_policies_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "storage_policies_quota_check" CHECK ("quota_bytes" > 0),
    CONSTRAINT "storage_policies_ttl_check" CHECK ("reservation_ttl_seconds" BETWEEN 60 AND 86400),
    CONSTRAINT "storage_policies_warning_check" CHECK ("warning_percent" BETWEEN 1 AND 100),
    CONSTRAINT "storage_policies_version_check" CHECK ("version" > 0)
);

CREATE TABLE "storage_accounts" (
    "user_id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "used_bytes" BIGINT NOT NULL DEFAULT 0,
    "reserved_bytes" BIGINT NOT NULL DEFAULT 0,
    "quota_adjustment_bytes" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "storage_accounts_pkey" PRIMARY KEY ("user_id"),
    CONSTRAINT "storage_accounts_usage_check" CHECK ("used_bytes" >= 0 AND "reserved_bytes" >= 0)
);

CREATE TABLE "storage_reservations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(120) NOT NULL,
    "request_hash" CHAR(64) NOT NULL,
    "commit_hash" CHAR(64),
    "resource_type" "media_resource_type" NOT NULL,
    "kind" "media_kind" NOT NULL,
    "declared_mime_type" VARCHAR(100) NOT NULL,
    "declared_extension" VARCHAR(16) NOT NULL,
    "declared_bytes" BIGINT NOT NULL,
    "actual_bytes" BIGINT,
    "status" "storage_reservation_status" NOT NULL DEFAULT 'RESERVED',
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "committed_at" TIMESTAMPTZ(3),
    "released_at" TIMESTAMPTZ(3),
    "release_reason" VARCHAR(120),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "storage_reservations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "storage_reservations_bytes_check" CHECK (
        "declared_bytes" > 0 AND ("actual_bytes" IS NULL OR "actual_bytes" > 0)
    ),
    CONSTRAINT "storage_reservations_state_check" CHECK (
        ("status" = 'RESERVED' AND "actual_bytes" IS NULL AND "commit_hash" IS NULL AND "committed_at" IS NULL AND "released_at" IS NULL)
        OR
        ("status" = 'COMMITTED' AND "actual_bytes" IS NOT NULL AND "commit_hash" IS NOT NULL AND "committed_at" IS NOT NULL AND "released_at" IS NULL)
        OR
        ("status" IN ('RELEASED', 'EXPIRED') AND "actual_bytes" IS NULL AND "commit_hash" IS NULL AND "committed_at" IS NULL AND "released_at" IS NOT NULL)
    )
);

CREATE TABLE "media_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "reservation_id" UUID,
    "provider" "media_provider" NOT NULL DEFAULT 'CLOUDINARY',
    "resource_type" "media_resource_type" NOT NULL,
    "kind" "media_kind" NOT NULL,
    "public_id" VARCHAR(255) NOT NULL,
    "secure_url" VARCHAR(2048) NOT NULL,
    "mime_type" VARCHAR(100),
    "extension" VARCHAR(16),
    "bytes" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration_seconds" DECIMAL(10,2),
    "provider_version" BIGINT,
    "provider_etag" VARCHAR(128),
    "status" "media_asset_status" NOT NULL DEFAULT 'ACTIVE',
    "backfilled" BOOLEAN NOT NULL DEFAULT false,
    "reconciled_at" TIMESTAMPTZ(3),
    "deleted_at" TIMESTAMPTZ(3),
    "deleted_by_id" UUID,
    "deletion_idempotency_key" VARCHAR(120),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "media_assets_bytes_check" CHECK ("bytes" > 0 OR ("backfilled" = true AND "bytes" = 0)),
    CONSTRAINT "media_assets_dimensions_check" CHECK (
        ("width" IS NULL OR "width" > 0) AND
        ("height" IS NULL OR "height" > 0) AND
        ("duration_seconds" IS NULL OR "duration_seconds" > 0)
    ),
    CONSTRAINT "media_assets_deletion_check" CHECK (
        ("status" IN ('ACTIVE', 'DELETING') AND "deleted_at" IS NULL)
        OR
        ("status" IN ('DELETED', 'PROVIDER_MISSING') AND "deleted_at" IS NOT NULL)
    )
);

CREATE TABLE "storage_adjustments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(120) NOT NULL,
    "request_hash" CHAR(64) NOT NULL,
    "delta_bytes" BIGINT NOT NULL,
    "before_bytes" BIGINT NOT NULL,
    "after_bytes" BIGINT NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "storage_adjustments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "storage_adjustments_delta_check" CHECK ("delta_bytes" <> 0),
    CONSTRAINT "storage_adjustments_result_check" CHECK ("after_bytes" = "before_bytes" + "delta_bytes")
);

CREATE UNIQUE INDEX "storage_policies_code_key" ON "storage_policies"("code");
CREATE UNIQUE INDEX "storage_policies_one_default" ON "storage_policies"("is_default") WHERE "is_default" = true;
CREATE INDEX "storage_policies_active_is_default_code_idx" ON "storage_policies"("active", "is_default", "code");
CREATE INDEX "storage_accounts_policy_id_used_bytes_idx" ON "storage_accounts"("policy_id", "used_bytes");
CREATE UNIQUE INDEX "storage_reservations_user_id_idempotency_key_key" ON "storage_reservations"("user_id", "idempotency_key");
CREATE INDEX "storage_reservations_status_expires_at_idx" ON "storage_reservations"("status", "expires_at");
CREATE INDEX "storage_reservations_user_id_status_created_at_idx" ON "storage_reservations"("user_id", "status", "created_at");
CREATE UNIQUE INDEX "media_assets_reservation_id_key" ON "media_assets"("reservation_id");
CREATE UNIQUE INDEX "media_assets_public_id_key" ON "media_assets"("public_id");
CREATE INDEX "media_assets_owner_id_status_created_at_idx" ON "media_assets"("owner_id", "status", "created_at");
CREATE INDEX "media_assets_status_reconciled_at_idx" ON "media_assets"("status", "reconciled_at");
CREATE UNIQUE INDEX "storage_adjustments_actor_id_idempotency_key_key" ON "storage_adjustments"("actor_id", "idempotency_key");
CREATE INDEX "storage_adjustments_user_id_created_at_id_idx" ON "storage_adjustments"("user_id", "created_at", "id");
CREATE INDEX "storage_adjustments_actor_id_created_at_idx" ON "storage_adjustments"("actor_id", "created_at");

ALTER TABLE "storage_policies" ADD CONSTRAINT "storage_policies_updated_by_id_fkey"
    FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "storage_accounts" ADD CONSTRAINT "storage_accounts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "storage_accounts" ADD CONSTRAINT "storage_accounts_policy_id_fkey"
    FOREIGN KEY ("policy_id") REFERENCES "storage_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "storage_reservations" ADD CONSTRAINT "storage_reservations_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "storage_accounts"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_id_user_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_id_account_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "storage_accounts"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_reservation_id_fkey"
    FOREIGN KEY ("reservation_id") REFERENCES "storage_reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_deleted_by_id_fkey"
    FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "storage_adjustments" ADD CONSTRAINT "storage_adjustments_user_id_account_fkey"
    FOREIGN KEY ("user_id") REFERENCES "storage_accounts"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "storage_adjustments" ADD CONSTRAINT "storage_adjustments_user_id_user_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "storage_adjustments" ADD CONSTRAINT "storage_adjustments_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "post_media" ADD COLUMN "asset_id" UUID;
CREATE INDEX "post_media_asset_id_idx" ON "post_media"("asset_id");
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_asset_id_fkey"
    FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "storage_policies" (
    "id", "code", "name", "quota_bytes", "reservation_ttl_seconds", "warning_percent", "active", "is_default"
) VALUES (
    '15000000-0000-4000-8000-000000000001',
    'MVP_DEFAULT',
    'MVP default storage',
    1073741824,
    900,
    80,
    true,
    true
);

INSERT INTO "storage_accounts" ("user_id", "policy_id")
SELECT "id", '15000000-0000-4000-8000-000000000001'::uuid
FROM "users";

WITH ranked_media AS (
    SELECT
        pm."public_id",
        pm."secure_url",
        pm."mime_type",
        pm."kind",
        pm."width",
        pm."height",
        pm."duration_seconds",
        p."author_id",
        COALESCE(MAX(pm."bytes") OVER (PARTITION BY pm."public_id"), 0) AS "accounted_bytes",
        ROW_NUMBER() OVER (
            PARTITION BY pm."public_id"
            ORDER BY pr."created_at", pm."id"
        ) AS "owner_rank"
    FROM "post_media" pm
    JOIN "post_revisions" pr ON pr."id" = pm."revision_id"
    JOIN "posts" p ON p."id" = pr."post_id"
    WHERE pm."provider" = 'CLOUDINARY' AND pm."public_id" IS NOT NULL
)
INSERT INTO "media_assets" (
    "owner_id", "provider", "resource_type", "kind", "public_id", "secure_url",
    "mime_type", "bytes", "width", "height", "duration_seconds", "backfilled"
)
SELECT
    "author_id",
    'CLOUDINARY',
    CASE WHEN "kind" = 'COVER_IMAGE' THEN 'IMAGE'::"media_resource_type" ELSE 'VIDEO'::"media_resource_type" END,
    "kind",
    "public_id",
    "secure_url",
    "mime_type",
    "accounted_bytes",
    "width",
    "height",
    "duration_seconds",
    true
FROM ranked_media
WHERE "owner_rank" = 1;

UPDATE "post_media" pm
SET "asset_id" = ma."id"
FROM "media_assets" ma
WHERE pm."provider" = 'CLOUDINARY' AND pm."public_id" = ma."public_id";

UPDATE "storage_accounts" sa
SET "used_bytes" = usage."bytes", "updated_at" = CURRENT_TIMESTAMP
FROM (
    SELECT "owner_id", SUM("bytes") AS "bytes"
    FROM "media_assets"
    WHERE "status" = 'ACTIVE'
    GROUP BY "owner_id"
) usage
WHERE sa."user_id" = usage."owner_id";
