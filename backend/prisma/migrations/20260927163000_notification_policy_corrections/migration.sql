-- Blog decisions use the article route; recipes and videos use their own routes.
CREATE OR REPLACE FUNCTION notification_on_revision() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_owner UUID; v_type TEXT; v_post_type TEXT;
BEGIN
  IF NEW."status" IS DISTINCT FROM OLD."status" AND NEW."status"::text IN ('PUBLISHED', 'REJECTED') AND NEW."reviewed_at" IS NOT NULL THEN
    SELECT "author_id", "type"::text INTO v_owner, v_post_type FROM "posts" WHERE "id" = NEW."post_id";
    v_type := CASE WHEN v_post_type = 'VIDEO' THEN 'VIDEO_' ELSE 'POST_' END || CASE WHEN NEW."status"::text = 'PUBLISHED' THEN 'APPROVED' ELSE 'REJECTED' END;
    PERFORM notification_emit(v_owner, v_type, NEW."post_id", NEW."id"::text);
    IF v_post_type = 'BLOG' AND v_type = 'POST_APPROVED' THEN
      UPDATE "notifications" SET "link" = '/articles/' || NEW."post_id"
      WHERE "dedupe_key" = v_type || ':' || NEW."post_id"::text || ':' || NEW."id"::text AND "owner_id" = v_owner;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Use the active policy's warning threshold, plus 95% and 100% milestones.
CREATE OR REPLACE FUNCTION notification_on_storage() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_quota BIGINT; v_warning INTEGER; v_before NUMERIC; v_after NUMERIC; v_threshold INTEGER;
BEGIN
  SELECT "quota_bytes" + NEW."quota_adjustment_bytes", "warning_percent" INTO v_quota, v_warning
  FROM "storage_policies" WHERE "id" = NEW."policy_id";
  IF v_quota <= 0 THEN RETURN NEW; END IF;
  v_before := CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE 100.0 * (OLD."used_bytes" + OLD."reserved_bytes") / v_quota END;
  v_after := 100.0 * (NEW."used_bytes" + NEW."reserved_bytes") / v_quota;
  FOREACH v_threshold IN ARRAY ARRAY[v_warning, 95, 100] LOOP
    IF v_threshold BETWEEN 1 AND 100 AND v_before < v_threshold AND v_after >= v_threshold THEN
      PERFORM notification_emit(NEW."user_id", 'STORAGE_QUOTA_WARNING', NEW."user_id", v_threshold::text);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notification_emit(p_owner UUID, p_type TEXT, p_source UUID, p_variant TEXT DEFAULT NULL)
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
      IF p_variant !~ '^[0-9]{1,3}$' OR p_variant::integer NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid quota threshold'; END IF;
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
