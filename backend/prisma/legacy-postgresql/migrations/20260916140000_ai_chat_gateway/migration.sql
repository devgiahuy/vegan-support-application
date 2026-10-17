CREATE TYPE "chat_message_role" AS ENUM ('USER', 'ASSISTANT');
CREATE TYPE "chat_message_status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE "chat_feedback_value" AS ENUM ('UP', 'DOWN');
CREATE TYPE "ai_request_status" AS ENUM ('IN_PROGRESS', 'SUCCESS', 'FALLBACK', 'BLOCKED', 'FAILED', 'ABORTED');

CREATE TABLE "chat_sessions" (
  "id" UUID NOT NULL,
  "user_id" UUID,
  "guest_id_hash" CHAR(64),
  "title" VARCHAR(160) NOT NULL DEFAULT 'Cuộc trò chuyện dinh dưỡng',
  "expires_at" TIMESTAMPTZ(3),
  "deleted_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chat_sessions_exactly_one_owner" CHECK (("user_id" IS NOT NULL) <> ("guest_id_hash" IS NOT NULL)),
  CONSTRAINT "chat_sessions_guest_expiry" CHECK (
    ("guest_id_hash" IS NULL AND "expires_at" IS NULL)
    OR ("guest_id_hash" IS NOT NULL AND "expires_at" IS NOT NULL)
  )
);

CREATE TABLE "chat_messages" (
  "id" UUID NOT NULL,
  "session_id" UUID NOT NULL,
  "role" "chat_message_role" NOT NULL,
  "status" "chat_message_status" NOT NULL,
  "content" TEXT NOT NULL,
  "idempotency_key" VARCHAR(120),
  "payload_hash" CHAR(64),
  "request_message_id" UUID,
  "provider" VARCHAR(40),
  "model_id" VARCHAR(100),
  "provider_response_id" VARCHAR(160),
  "fallback" BOOLEAN NOT NULL DEFAULT false,
  "topic_codes" JSONB NOT NULL DEFAULT '[]',
  "completed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chat_messages_topic_codes_array" CHECK (jsonb_typeof("topic_codes") = 'array'),
  CONSTRAINT "chat_messages_payload_hash_hex" CHECK ("payload_hash" IS NULL OR "payload_hash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "chat_messages_role_shape" CHECK (
    (
      "role" = 'USER'
      AND "status" = 'COMPLETED'
      AND "idempotency_key" IS NOT NULL
      AND "payload_hash" IS NOT NULL
      AND "request_message_id" IS NULL
      AND "provider" IS NULL
      AND "model_id" IS NULL
      AND "fallback" = false
      AND "completed_at" IS NOT NULL
    )
    OR
    (
      "role" = 'ASSISTANT'
      AND "idempotency_key" IS NULL
      AND "payload_hash" IS NULL
      AND "request_message_id" IS NOT NULL
      AND (
        ("status" = 'PENDING' AND "completed_at" IS NULL)
        OR ("status" IN ('COMPLETED', 'FAILED') AND "completed_at" IS NOT NULL)
      )
    )
  )
);

CREATE TABLE "chat_feedback" (
  "message_id" UUID NOT NULL,
  "value" "chat_feedback_value" NOT NULL,
  "reason" VARCHAR(500),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "chat_feedback_pkey" PRIMARY KEY ("message_id")
);

CREATE TABLE "ai_request_logs" (
  "id" UUID NOT NULL,
  "session_id" UUID,
  "request_message_id" UUID NOT NULL,
  "user_id" UUID,
  "guest_id_hash" CHAR(64),
  "provider" VARCHAR(40) NOT NULL,
  "model_id" VARCHAR(100) NOT NULL,
  "status" "ai_request_status" NOT NULL,
  "provider_call_count" INTEGER NOT NULL DEFAULT 0,
  "latency_ms" INTEGER,
  "input_tokens" INTEGER,
  "output_tokens" INTEGER,
  "error_code" VARCHAR(100),
  "redacted_metadata" JSONB NOT NULL DEFAULT '{}',
  "started_at" TIMESTAMPTZ(3) NOT NULL,
  "completed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "ai_request_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_request_logs_owner" CHECK (NOT ("user_id" IS NOT NULL AND "guest_id_hash" IS NOT NULL)),
  CONSTRAINT "ai_request_logs_nonnegative" CHECK (
    "provider_call_count" >= 0
    AND ("latency_ms" IS NULL OR "latency_ms" >= 0)
    AND ("input_tokens" IS NULL OR "input_tokens" >= 0)
    AND ("output_tokens" IS NULL OR "output_tokens" >= 0)
  ),
  CONSTRAINT "ai_request_logs_metadata_object" CHECK (jsonb_typeof("redacted_metadata") = 'object'),
  CONSTRAINT "ai_request_logs_completion_shape" CHECK (
    ("status" = 'IN_PROGRESS' AND "completed_at" IS NULL)
    OR ("status" <> 'IN_PROGRESS' AND "completed_at" IS NOT NULL)
  )
);

CREATE TABLE "ai_quota_buckets" (
  "subject_key" CHAR(64) NOT NULL,
  "usage_date" DATE NOT NULL,
  "successful_count" INTEGER NOT NULL DEFAULT 0,
  "quota_limit" INTEGER NOT NULL,
  "reservation_key" VARCHAR(160),
  "reservation_expires_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "ai_quota_buckets_pkey" PRIMARY KEY ("subject_key", "usage_date"),
  CONSTRAINT "ai_quota_buckets_counts" CHECK ("successful_count" >= 0 AND "quota_limit" > 0 AND "successful_count" <= "quota_limit"),
  CONSTRAINT "ai_quota_buckets_reservation_shape" CHECK (("reservation_key" IS NULL) = ("reservation_expires_at" IS NULL))
);

CREATE TABLE "ai_rate_limit_buckets" (
  "key_hash" CHAR(64) NOT NULL,
  "window_start" TIMESTAMPTZ(3) NOT NULL,
  "count" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "ai_rate_limit_buckets_pkey" PRIMARY KEY ("key_hash", "window_start"),
  CONSTRAINT "ai_rate_limit_buckets_positive_count" CHECK ("count" > 0)
);

CREATE INDEX "chat_sessions_user_id_deleted_at_updated_at_idx" ON "chat_sessions"("user_id", "deleted_at", "updated_at");
CREATE INDEX "chat_sessions_guest_id_hash_expires_at_deleted_at_idx" ON "chat_sessions"("guest_id_hash", "expires_at", "deleted_at");
CREATE INDEX "chat_sessions_expires_at_idx" ON "chat_sessions"("expires_at");
CREATE UNIQUE INDEX "chat_messages_request_message_id_key" ON "chat_messages"("request_message_id");
CREATE UNIQUE INDEX "chat_messages_session_id_idempotency_key_key" ON "chat_messages"("session_id", "idempotency_key");
CREATE INDEX "chat_messages_session_id_created_at_id_idx" ON "chat_messages"("session_id", "created_at", "id");
CREATE INDEX "chat_messages_status_updated_at_idx" ON "chat_messages"("status", "updated_at");
CREATE INDEX "chat_feedback_value_updated_at_idx" ON "chat_feedback"("value", "updated_at");
CREATE UNIQUE INDEX "ai_request_logs_request_message_id_key" ON "ai_request_logs"("request_message_id");
CREATE INDEX "ai_request_logs_status_created_at_idx" ON "ai_request_logs"("status", "created_at");
CREATE INDEX "ai_request_logs_provider_model_id_created_at_idx" ON "ai_request_logs"("provider", "model_id", "created_at");
CREATE INDEX "ai_request_logs_user_id_created_at_idx" ON "ai_request_logs"("user_id", "created_at");
CREATE INDEX "ai_request_logs_guest_id_hash_created_at_idx" ON "ai_request_logs"("guest_id_hash", "created_at");
CREATE INDEX "ai_quota_buckets_usage_date_updated_at_idx" ON "ai_quota_buckets"("usage_date", "updated_at");
CREATE INDEX "ai_rate_limit_buckets_window_start_idx" ON "ai_rate_limit_buckets"("window_start");

ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_request_message_id_fkey" FOREIGN KEY ("request_message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_feedback" ADD CONSTRAINT "chat_feedback_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_request_logs" ADD CONSTRAINT "ai_request_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_request_logs" ADD CONSTRAINT "ai_request_logs_request_message_id_fkey" FOREIGN KEY ("request_message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_request_logs" ADD CONSTRAINT "ai_request_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
