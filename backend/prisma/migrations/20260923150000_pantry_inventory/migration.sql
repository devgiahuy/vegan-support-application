CREATE TYPE "pantry_item_source" AS ENUM ('MANUAL', 'FRIDGE_RECOGNITION', 'RECEIPT');
CREATE TYPE "pantry_confirmation_status" AS ENUM ('PENDING', 'CONFIRMED');
CREATE TYPE "pantry_conversion_status" AS ENUM ('CONVERTED', 'UNKNOWN');
CREATE TYPE "pantry_adjustment_type" AS ENUM (
    'CREATE', 'UPDATE', 'CONSUME', 'RESTORE', 'ADJUST', 'MERGE_IN', 'MERGE_OUT', 'DELETE'
);

CREATE TABLE "pantry_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "ingredient_id" UUID,
    "unmatched_text" VARCHAR(160),
    "normalized_unmatched_text" VARCHAR(160),
    "quantity" DECIMAL(14,4) NOT NULL,
    "unit" VARCHAR(40) NOT NULL,
    "normalized_grams" DECIMAL(16,4),
    "conversion_status" "pantry_conversion_status" NOT NULL,
    "conversion_source" VARCHAR(80),
    "conversion_version" VARCHAR(120),
    "conversion_confidence" DECIMAL(5,4),
    "source" "pantry_item_source" NOT NULL,
    "source_reference_id" UUID,
    "confidence" DECIMAL(5,4) NOT NULL DEFAULT 1,
    "confirmation_status" "pantry_confirmation_status" NOT NULL DEFAULT 'CONFIRMED',
    "purchased_at" DATE,
    "opened_at" DATE,
    "expires_at" DATE,
    "freshness_note" VARCHAR(1000),
    "version" INTEGER NOT NULL DEFAULT 1,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pantry_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pantry_items_identity_check" CHECK (
        ("ingredient_id" IS NOT NULL AND "unmatched_text" IS NULL AND "normalized_unmatched_text" IS NULL)
        OR
        ("ingredient_id" IS NULL AND "unmatched_text" IS NOT NULL AND "normalized_unmatched_text" IS NOT NULL)
    ),
    CONSTRAINT "pantry_items_quantity_check" CHECK ("quantity" >= 0),
    CONSTRAINT "pantry_items_confidence_check" CHECK ("confidence" BETWEEN 0 AND 1),
    CONSTRAINT "pantry_items_conversion_check" CHECK (
        ("conversion_status" = 'CONVERTED' AND "normalized_grams" IS NOT NULL AND "normalized_grams" >= 0
            AND "conversion_source" IS NOT NULL AND "conversion_version" IS NOT NULL AND "conversion_confidence" IS NOT NULL)
        OR
        ("conversion_status" = 'UNKNOWN' AND "normalized_grams" IS NULL
            AND "conversion_source" IS NULL AND "conversion_version" IS NULL AND "conversion_confidence" IS NULL)
    ),
    CONSTRAINT "pantry_items_conversion_confidence_check" CHECK (
        "conversion_confidence" IS NULL OR "conversion_confidence" BETWEEN 0 AND 1
    ),
    CONSTRAINT "pantry_items_dates_check" CHECK (
        ("opened_at" IS NULL OR "purchased_at" IS NULL OR "opened_at" >= "purchased_at")
        AND ("expires_at" IS NULL OR "purchased_at" IS NULL OR "expires_at" >= "purchased_at")
    ),
    CONSTRAINT "pantry_items_version_check" CHECK ("version" > 0),
    CONSTRAINT "pantry_items_future_source_check" CHECK (
        ("source" = 'MANUAL' AND "source_reference_id" IS NULL AND "confirmation_status" = 'CONFIRMED')
        OR ("source" <> 'MANUAL' AND "source_reference_id" IS NOT NULL)
    )
);

CREATE TABLE "pantry_adjustments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "pantry_item_id" UUID NOT NULL,
    "type" "pantry_adjustment_type" NOT NULL,
    "idempotency_key" VARCHAR(160) NOT NULL,
    "request_hash" CHAR(64) NOT NULL,
    "input_quantity" DECIMAL(14,4) NOT NULL,
    "input_unit" VARCHAR(40) NOT NULL,
    "applied_delta_quantity" DECIMAL(14,4) NOT NULL,
    "normalized_delta_grams" DECIMAL(16,4),
    "before_quantity" DECIMAL(14,4) NOT NULL,
    "after_quantity" DECIMAL(14,4) NOT NULL,
    "before_grams" DECIMAL(16,4),
    "after_grams" DECIMAL(16,4),
    "version_before" INTEGER NOT NULL,
    "version_after" INTEGER NOT NULL,
    "reason" VARCHAR(1000),
    "merged_from_item_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pantry_adjustments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pantry_adjustments_result_check" CHECK (
        "after_quantity" = "before_quantity" + "applied_delta_quantity" AND "after_quantity" >= 0
    ),
    CONSTRAINT "pantry_adjustments_grams_check" CHECK (
        ("before_grams" IS NULL AND "after_grams" IS NULL AND "normalized_delta_grams" IS NULL)
        OR
        ("before_grams" IS NOT NULL AND "after_grams" IS NOT NULL AND "normalized_delta_grams" IS NOT NULL
            AND "after_grams" = "before_grams" + "normalized_delta_grams" AND "after_grams" >= 0)
    ),
    CONSTRAINT "pantry_adjustments_version_check" CHECK (
        "version_before" >= 0 AND "version_after" = "version_before" + 1
    )
);

CREATE INDEX "pantry_items_owner_id_deleted_at_confirmation_status_updated_at_idx"
    ON "pantry_items"("owner_id", "deleted_at", "confirmation_status", "updated_at");
CREATE INDEX "pantry_items_owner_id_ingredient_id_deleted_at_idx"
    ON "pantry_items"("owner_id", "ingredient_id", "deleted_at");
CREATE INDEX "pantry_items_owner_id_normalized_unmatched_text_deleted_at_idx"
    ON "pantry_items"("owner_id", "normalized_unmatched_text", "deleted_at");
CREATE INDEX "pantry_items_owner_id_expires_at_deleted_at_idx"
    ON "pantry_items"("owner_id", "expires_at", "deleted_at");
CREATE UNIQUE INDEX "pantry_adjustments_owner_id_idempotency_key_key"
    ON "pantry_adjustments"("owner_id", "idempotency_key");
CREATE INDEX "pantry_adjustments_pantry_item_id_created_at_id_idx"
    ON "pantry_adjustments"("pantry_item_id", "created_at", "id");
CREATE INDEX "pantry_adjustments_owner_id_created_at_id_idx"
    ON "pantry_adjustments"("owner_id", "created_at", "id");

ALTER TABLE "pantry_items" ADD CONSTRAINT "pantry_items_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pantry_items" ADD CONSTRAINT "pantry_items_ingredient_id_fkey"
    FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pantry_adjustments" ADD CONSTRAINT "pantry_adjustments_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pantry_adjustments" ADD CONSTRAINT "pantry_adjustments_pantry_item_id_fkey"
    FOREIGN KEY ("pantry_item_id") REFERENCES "pantry_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pantry_adjustments" ADD CONSTRAINT "pantry_adjustments_merged_from_item_id_fkey"
    FOREIGN KEY ("merged_from_item_id") REFERENCES "pantry_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
