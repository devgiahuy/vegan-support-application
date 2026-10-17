CREATE TYPE "behavior_event_type" AS ENUM (
  'SEARCH', 'VIEW_RECIPE', 'BOOKMARK', 'RATE', 'CHAT_TOPIC',
  'ACCEPT_MEAL', 'SWAP_MEAL', 'REJECT_MEAL'
);

CREATE TABLE "personalization_preferences" (
  "user_id" UUID NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "consent_version" VARCHAR(80) NOT NULL,
  "consented_at" TIMESTAMPTZ(3),
  "disabled_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "personalization_preferences_pkey" PRIMARY KEY ("user_id"),
  CONSTRAINT "personalization_preference_state_consistent" CHECK (
    ("enabled" = true AND "consented_at" IS NOT NULL AND "disabled_at" IS NULL)
    OR
    ("enabled" = false AND "disabled_at" IS NOT NULL)
  )
);

CREATE TABLE "behavior_events" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "type" "behavior_event_type" NOT NULL,
  "entity_id" UUID,
  "idempotency_key" VARCHAR(120) NOT NULL,
  "dedupe_key" VARCHAR(255),
  "payload_hash" CHAR(64) NOT NULL,
  "consent_version" VARCHAR(80) NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "occurred_at" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "behavior_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "behavior_events_idempotency_key_not_blank" CHECK (length(btrim("idempotency_key")) > 0),
  CONSTRAINT "behavior_events_payload_hash_hex" CHECK ("payload_hash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "behavior_events_metadata_object" CHECK (jsonb_typeof("metadata") = 'object'),
  CONSTRAINT "behavior_events_entity_shape" CHECK (
    ("type" IN ('SEARCH', 'CHAT_TOPIC') AND "entity_id" IS NULL)
    OR
    ("type" IN ('VIEW_RECIPE', 'BOOKMARK', 'RATE', 'ACCEPT_MEAL', 'SWAP_MEAL', 'REJECT_MEAL') AND "entity_id" IS NOT NULL)
  )
);

CREATE UNIQUE INDEX "behavior_events_dedupe_key_key" ON "behavior_events"("dedupe_key");
CREATE UNIQUE INDEX "behavior_events_user_id_idempotency_key_key" ON "behavior_events"("user_id", "idempotency_key");
CREATE INDEX "personalization_preferences_enabled_updated_at_idx" ON "personalization_preferences"("enabled", "updated_at");
CREATE INDEX "behavior_events_user_id_occurred_at_type_idx" ON "behavior_events"("user_id", "occurred_at", "type");
CREATE INDEX "behavior_events_user_id_entity_id_occurred_at_idx" ON "behavior_events"("user_id", "entity_id", "occurred_at");
CREATE INDEX "behavior_events_occurred_at_idx" ON "behavior_events"("occurred_at");

ALTER TABLE "personalization_preferences"
  ADD CONSTRAINT "personalization_preferences_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "behavior_events"
  ADD CONSTRAINT "behavior_events_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
