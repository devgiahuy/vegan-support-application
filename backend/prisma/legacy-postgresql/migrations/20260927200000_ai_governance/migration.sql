CREATE TABLE "ai_governance_events" (
  "id" UUID NOT NULL,
  "capability" VARCHAR(40) NOT NULL,
  "provider" VARCHAR(80) NOT NULL,
  "model_id" VARCHAR(100),
  "template_version" VARCHAR(80),
  "correlation_id" VARCHAR(128) NOT NULL,
  "status" VARCHAR(30) NOT NULL,
  "error_class" VARCHAR(60),
  "safety_outcome" VARCHAR(40) NOT NULL,
  "latency_ms" INTEGER,
  "input_tokens" INTEGER,
  "output_tokens" INTEGER,
  "cost_micros" BIGINT,
  "confidence" DECIMAL(5,4),
  "coverage" DECIMAL(5,4),
  "started_at" TIMESTAMPTZ(3) NOT NULL,
  "completed_at" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_governance_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ai_governance_events_created_at_id_idx" ON "ai_governance_events"("created_at", "id");
CREATE INDEX "ai_governance_events_capability_status_created_at_idx" ON "ai_governance_events"("capability", "status", "created_at");
CREATE INDEX "ai_governance_events_provider_created_at_idx" ON "ai_governance_events"("provider", "created_at");

CREATE TABLE "ai_capability_controls" (
  "capability" VARCHAR(40) NOT NULL,
  "provider" VARCHAR(80) NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_capability_controls_pkey" PRIMARY KEY ("capability", "provider")
);

CREATE TABLE "ai_capability_control_audit" (
  "id" UUID NOT NULL,
  "capability" VARCHAR(40) NOT NULL,
  "provider" VARCHAR(80) NOT NULL,
  "enabled" BOOLEAN NOT NULL,
  "version" INTEGER NOT NULL,
  "actor_id" UUID NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_capability_control_audit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ai_capability_control_audit_capability_provider_created_at_idx" ON "ai_capability_control_audit"("capability", "provider", "created_at");
