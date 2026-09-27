-- Moderation decisions outside publication review notify only the affected owner.
-- The dispatcher still controls all client-visible fields.
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
    WHEN 'MODERATION_OUTCOME' THEN v_title := 'Tài khoản hoặc nội dung của bạn đã được xử lý';
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

CREATE FUNCTION notification_on_moderation_action() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_owner UUID;
BEGIN
  -- Publication approval/rejection and report resolution have their own
  -- destination-specific notifications. Avoid two notices for one decision.
  IF NEW."decision"::text IN ('APPROVE', 'REJECT', 'NO_VIOLATION') THEN RETURN NEW; END IF;
  CASE NEW."target_type"::text
    WHEN 'POST' THEN SELECT "author_id" INTO v_owner FROM "posts" WHERE "id" = NEW."target_id";
    WHEN 'COMMENT' THEN SELECT "author_id" INTO v_owner FROM "comments" WHERE "id" = NEW."target_id";
    WHEN 'USER' THEN v_owner := NEW."target_id";
    ELSE RETURN NEW;
  END CASE;
  PERFORM notification_emit(v_owner, 'MODERATION_OUTCOME', NEW."id");
  RETURN NEW;
END;
$$;
CREATE TRIGGER notification_moderation_action AFTER INSERT ON "moderation_actions" FOR EACH ROW EXECUTE FUNCTION notification_on_moderation_action();
