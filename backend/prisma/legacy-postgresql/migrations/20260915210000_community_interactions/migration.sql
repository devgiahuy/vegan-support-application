CREATE TYPE "comment_status" AS ENUM ('VISIBLE', 'HIDDEN', 'DELETED');
CREATE TYPE "community_action" AS ENUM ('COMMENT_CREATE', 'COMMENT_EDIT', 'VOTE', 'RATING', 'BOOKMARK');

CREATE TABLE "comments" (
  "id" UUID NOT NULL,
  "post_id" UUID NOT NULL,
  "author_id" UUID NOT NULL,
  "parent_id" UUID,
  "content" VARCHAR(2000) NOT NULL,
  "status" "comment_status" NOT NULL DEFAULT 'VISIBLE',
  "edited_at" TIMESTAMPTZ(3),
  "deleted_at" TIMESTAMPTZ(3),
  "hidden_at" TIMESTAMPTZ(3),
  "hidden_by_id" UUID,
  "hidden_reason" VARCHAR(1000),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "comments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "comments_content_not_blank" CHECK (length(btrim("content")) > 0),
  CONSTRAINT "comments_parent_not_self" CHECK ("parent_id" IS NULL OR "parent_id" <> "id")
);

CREATE TABLE "post_votes" (
  "user_id" UUID NOT NULL,
  "post_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "post_votes_pkey" PRIMARY KEY ("user_id", "post_id")
);

CREATE TABLE "post_ratings" (
  "user_id" UUID NOT NULL,
  "post_id" UUID NOT NULL,
  "taste" INTEGER NOT NULL,
  "difficulty" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "post_ratings_pkey" PRIMARY KEY ("user_id", "post_id"),
  CONSTRAINT "post_ratings_taste_range" CHECK ("taste" BETWEEN 1 AND 5),
  CONSTRAINT "post_ratings_difficulty_range" CHECK ("difficulty" BETWEEN 1 AND 5)
);

CREATE TABLE "post_bookmarks" (
  "user_id" UUID NOT NULL,
  "post_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "post_bookmarks_pkey" PRIMARY KEY ("user_id", "post_id")
);

CREATE TABLE "community_rate_limit_buckets" (
  "user_id" UUID NOT NULL,
  "action" "community_action" NOT NULL,
  "window_start" TIMESTAMPTZ(0) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "community_rate_limit_buckets_pkey" PRIMARY KEY ("user_id", "action", "window_start"),
  CONSTRAINT "community_rate_limit_count_positive" CHECK ("count" > 0)
);

CREATE INDEX "comments_post_id_status_created_at_id_idx" ON "comments"("post_id", "status", "created_at", "id");
CREATE INDEX "comments_parent_id_status_created_at_id_idx" ON "comments"("parent_id", "status", "created_at", "id");
CREATE INDEX "comments_author_id_status_created_at_idx" ON "comments"("author_id", "status", "created_at");
CREATE INDEX "post_votes_post_id_created_at_idx" ON "post_votes"("post_id", "created_at");
CREATE INDEX "post_ratings_post_id_active_idx" ON "post_ratings"("post_id", "active");
CREATE INDEX "post_bookmarks_post_id_created_at_idx" ON "post_bookmarks"("post_id", "created_at");
CREATE INDEX "post_bookmarks_user_id_created_at_post_id_idx" ON "post_bookmarks"("user_id", "created_at", "post_id");
CREATE INDEX "community_rate_limit_buckets_window_start_idx" ON "community_rate_limit_buckets"("window_start");

ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_hidden_by_id_fkey" FOREIGN KEY ("hidden_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_ratings" ADD CONSTRAINT "post_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_ratings" ADD CONSTRAINT "post_ratings_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_bookmarks" ADD CONSTRAINT "post_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_bookmarks" ADD CONSTRAINT "post_bookmarks_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_rate_limit_buckets" ADD CONSTRAINT "community_rate_limit_buckets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
