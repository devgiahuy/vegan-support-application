CREATE TYPE "user_role" AS ENUM ('MEMBER', 'CONTRIBUTOR', 'ADMIN');
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'LOCKED', 'BANNED', 'DELETED');
CREATE TYPE "contributor_type" AS ENUM ('EXPERIENCED_PRACTITIONER', 'NUTRITION_EXPERT');
CREATE TYPE "contributor_application_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "contributor_application_source" AS ENUM ('REGISTRATION', 'PROFILE');

CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(320) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'MEMBER',
    "status" "user_status" NOT NULL DEFAULT 'ACTIVE',
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(3),
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "family_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "revoke_reason" VARCHAR(50),
    "replaced_by_id" UUID,
    "device_info" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(3),
    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contributor_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "requested_type" "contributor_type" NOT NULL,
    "experience" TEXT NOT NULL,
    "reference_links" JSONB NOT NULL DEFAULT '[]',
    "source" "contributor_application_source" NOT NULL DEFAULT 'REGISTRATION',
    "status" "contributor_application_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contributor_applications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "refresh_sessions_token_hash_key" ON "refresh_sessions"("token_hash");
CREATE UNIQUE INDEX "refresh_sessions_replaced_by_id_key" ON "refresh_sessions"("replaced_by_id");
CREATE INDEX "refresh_sessions_user_id_revoked_at_idx" ON "refresh_sessions"("user_id", "revoked_at");
CREATE INDEX "refresh_sessions_family_id_idx" ON "refresh_sessions"("family_id");
CREATE INDEX "contributor_applications_user_id_created_at_idx" ON "contributor_applications"("user_id", "created_at");
CREATE UNIQUE INDEX "contributor_applications_one_pending_per_user"
    ON "contributor_applications"("user_id") WHERE "status" = 'PENDING';

ALTER TABLE "refresh_sessions"
    ADD CONSTRAINT "refresh_sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "refresh_sessions"
    ADD CONSTRAINT "refresh_sessions_replaced_by_id_fkey"
    FOREIGN KEY ("replaced_by_id") REFERENCES "refresh_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "contributor_applications"
    ADD CONSTRAINT "contributor_applications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
