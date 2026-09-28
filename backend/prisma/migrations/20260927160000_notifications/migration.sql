CREATE TABLE "notifications" (
  "id" UUID NOT NULL,
  "owner_id" UUID NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "summary" VARCHAR(300),
  "link" VARCHAR(300),
  "payload_version" INTEGER NOT NULL DEFAULT 1,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "dedupe_key" VARCHAR(180) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "read_at" TIMESTAMPTZ(3),
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notifications_payload_version_check" CHECK ("payload_version" = 1)
);
CREATE UNIQUE INDEX "notifications_dedupe_key_key" ON "notifications"("dedupe_key");
CREATE INDEX "notifications_owner_id_created_at_id_idx" ON "notifications"("owner_id", "created_at" DESC, "id" DESC);
CREATE INDEX "notifications_owner_id_read_at_created_at_idx" ON "notifications"("owner_id", "read_at", "created_at" DESC);
CREATE INDEX "notifications_expires_at_idx" ON "notifications"("expires_at");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- This function is the sole event dispatcher. Domain triggers call it within their
-- existing transaction. It constructs every public field from a fixed allowlist;
-- free-text review reasons, AI prompts, profiles and image data never enter it.
CREATE FUNCTION notification_emit(p_owner UUID, p_type TEXT, p_source UUID, p_variant TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_title TEXT;
  v_summary TEXT := NULL;
  v_link TEXT := NULL;
  v_payload JSONB := jsonb_build_object('sourceId', p_source);
  v_key TEXT := p_type || ':' || p_source::text;
BEGIN
  IF p_owner IS NULL THEN RETURN; END IF;
  CASE p_type
    WHEN 'POST_APPROVED' THEN v_title := 'Bài viết đã được duyệt'; v_link := '/recipes/' || p_source; v_key := v_key || ':' || p_variant;
    WHEN 'POST_REJECTED' THEN v_title := 'Bài viết chưa được duyệt'; v_key := v_key || ':' || p_variant;
    WHEN 'VIDEO_APPROVED' THEN v_title := 'Video đã được duyệt'; v_link := '/videos/' || p_source; v_key := v_key || ':' || p_variant;
    WHEN 'VIDEO_REJECTED' THEN v_title := 'Video chưa được duyệt'; v_key := v_key || ':' || p_variant;
    WHEN 'CONTRIBUTOR_APPROVED' THEN v_title := 'Đơn Contributor đã được duyệt';
    WHEN 'CONTRIBUTOR_REJECTED' THEN v_title := 'Đơn Contributor chưa được duyệt';
    WHEN 'CONTRIBUTOR_REVOKED' THEN v_title := 'Quyền Contributor đã bị thu hồi';
    WHEN 'REPORT_RESOLVED' THEN v_title := 'Báo cáo của bạn đã được xử lý';
    WHEN 'AI_VERIFICATION_CREATED' THEN v_title := 'Nội dung AI của bạn có đánh giá mới';
    WHEN 'AI_VERIFICATION_CHANGED' THEN v_title := 'Đánh giá nội dung AI đã thay đổi'; v_key := v_key || ':' || p_variant;
    WHEN 'RESTAURANT_APPROVED' THEN v_title := 'Địa điểm bạn gửi đã được duyệt'; v_link := '/restaurants/' || p_source;
    WHEN 'RESTAURANT_REJECTED' THEN v_title := 'Địa điểm bạn gửi chưa được duyệt';
    WHEN 'STORAGE_QUOTA_WARNING' THEN
      IF p_variant NOT IN ('80', '95', '100') THEN RAISE EXCEPTION 'Invalid quota threshold'; END IF;
      v_title := 'Dung lượng lưu trữ sắp đạt giới hạn';
      v_summary := 'Mức sử dụng đã đạt ' || p_variant || '% hạn mức.';
      v_payload := jsonb_build_object('thresholdPercent', p_variant::integer);
      v_key := v_key || ':' || p_variant || ':' || to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM');
    ELSE RAISE EXCEPTION 'Unsupported notification event %', p_type;
  END CASE;
  INSERT INTO "notifications" ("id", "owner_id", "type", "title", "summary", "link", "payload", "dedupe_key", "expires_at")
  VALUES (gen_random_uuid(), p_owner, p_type, v_title, v_summary, v_link, v_payload, v_key, CURRENT_TIMESTAMP + INTERVAL '90 days')
  ON CONFLICT ("dedupe_key") DO NOTHING;
END;
$$;

CREATE FUNCTION notification_on_revision() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_owner UUID; v_type TEXT; v_post_type TEXT;
BEGIN
  IF NEW."status" IS DISTINCT FROM OLD."status" AND NEW."status"::text IN ('PUBLISHED', 'REJECTED') AND NEW."reviewed_at" IS NOT NULL THEN
    SELECT "author_id", "type"::text INTO v_owner, v_post_type FROM "posts" WHERE "id" = NEW."post_id";
    v_type := CASE WHEN v_post_type = 'VIDEO' THEN 'VIDEO_' ELSE 'POST_' END || CASE WHEN NEW."status"::text = 'PUBLISHED' THEN 'APPROVED' ELSE 'REJECTED' END;
    PERFORM notification_emit(v_owner, v_type, NEW."post_id", NEW."id"::text);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER notification_revision_decision AFTER UPDATE OF "status" ON "post_revisions" FOR EACH ROW EXECUTE FUNCTION notification_on_revision();

CREATE FUNCTION notification_on_contributor_decision() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  PERFORM notification_emit(NEW."user_id", 'CONTRIBUTOR_' || NEW."decision"::text, NEW."id");
  RETURN NEW;
END;
$$;
CREATE TRIGGER notification_contributor_decision AFTER INSERT ON "contributor_decisions" FOR EACH ROW EXECUTE FUNCTION notification_on_contributor_decision();

CREATE FUNCTION notification_on_report() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."status"::text = 'OPEN' AND NEW."status"::text = 'RESOLVED' THEN
    PERFORM notification_emit(NEW."reporter_id", 'REPORT_RESOLVED', NEW."id");
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER notification_report_decision AFTER UPDATE OF "status" ON "reports" FOR EACH ROW EXECUTE FUNCTION notification_on_report();

CREATE FUNCTION notification_on_verification() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_owner UUID;
BEGIN
  SELECT "owner_id" INTO v_owner FROM "ai_artifacts" WHERE "id" = NEW."artifact_id";
  IF TG_OP = 'INSERT' THEN
    PERFORM notification_emit(v_owner, 'AI_VERIFICATION_CREATED', NEW."id");
  ELSIF NEW."status" IS DISTINCT FROM OLD."status" THEN
    PERFORM notification_emit(v_owner, 'AI_VERIFICATION_CHANGED', NEW."id", NEW."version"::text);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER notification_verification_created AFTER INSERT ON "ai_verifications" FOR EACH ROW EXECUTE FUNCTION notification_on_verification();
CREATE TRIGGER notification_verification_changed AFTER UPDATE OF "status" ON "ai_verifications" FOR EACH ROW EXECUTE FUNCTION notification_on_verification();

CREATE FUNCTION notification_on_restaurant() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."status"::text = 'PENDING' AND NEW."status"::text IN ('APPROVED', 'REJECTED') THEN
    PERFORM notification_emit(NEW."submitter_id", 'RESTAURANT_' || NEW."status"::text, NEW."id");
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER notification_restaurant_decision AFTER UPDATE OF "status" ON "restaurants" FOR EACH ROW EXECUTE FUNCTION notification_on_restaurant();

CREATE FUNCTION notification_on_storage() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_quota BIGINT; v_warning INTEGER; v_before NUMERIC; v_after NUMERIC; v_threshold INTEGER;
BEGIN
  SELECT "quota_bytes" + NEW."quota_adjustment_bytes", "warning_percent" INTO v_quota, v_warning
  FROM "storage_policies" WHERE "id" = NEW."policy_id";
  IF v_quota <= 0 THEN RETURN NEW; END IF;
  v_before := CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE 100.0 * (OLD."used_bytes" + OLD."reserved_bytes") / v_quota END;
  v_after := 100.0 * (NEW."used_bytes" + NEW."reserved_bytes") / v_quota;
  FOREACH v_threshold IN ARRAY ARRAY[80, 95, 100] LOOP
    IF v_threshold >= v_warning AND v_before < v_threshold AND v_after >= v_threshold THEN
      PERFORM notification_emit(NEW."user_id", 'STORAGE_QUOTA_WARNING', NEW."user_id", v_threshold::text);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
CREATE TRIGGER notification_storage_warning AFTER INSERT OR UPDATE OF "used_bytes", "reserved_bytes", "quota_adjustment_bytes", "policy_id" ON "storage_accounts" FOR EACH ROW EXECUTE FUNCTION notification_on_storage();
