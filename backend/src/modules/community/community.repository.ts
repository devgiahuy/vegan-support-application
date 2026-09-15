import {
  CommentStatus,
  MediaKind,
  PostStatus,
  PostType,
  type CommunityAction,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';
import type {
  BookmarkListQuery,
  CommentListQuery,
  CreateCommentInput,
  RatingInput,
} from './community.schemas.js';

const commentInclude = {
  author: { select: { id: true, displayName: true, avatarUrl: true } },
  replies: {
    where: { status: CommentStatus.VISIBLE },
    include: { author: { select: { id: true, displayName: true, avatarUrl: true } } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.CommentInclude;

export type CommentRecord = Prisma.CommentGetPayload<{ include: typeof commentInclude }>;

const publishedPostWhere = {
  status: PostStatus.PUBLISHED,
  deletedAt: null,
  publishedRevisionId: { not: null },
} satisfies Prisma.PostWhereInput;

export class CommunityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findPublishedPost(id: string): Promise<{ id: string; type: PostType } | null> {
    return this.prisma.post.findFirst({
      where: { id, ...publishedPostWhere },
      select: { id: true, type: true },
    });
  }

  async consumeRateLimit(
    userId: string,
    action: CommunityAction,
    windowStart: Date,
    limit: number,
  ): Promise<boolean> {
    const result = await this.prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "community_rate_limit_buckets" ("user_id", "action", "window_start", "count")
      VALUES (${userId}::uuid, CAST(${action} AS "community_action"), ${windowStart}, 1)
      ON CONFLICT ("user_id", "action", "window_start")
      DO UPDATE SET "count" = "community_rate_limit_buckets"."count" + 1
      WHERE "community_rate_limit_buckets"."count" < ${limit}
      RETURNING "count"
    `;
    return result.length === 1;
  }

  async listComments(
    postId: string,
    query: CommentListQuery,
  ): Promise<{ records: CommentRecord[]; total: number }> {
    const where: Prisma.CommentWhereInput = {
      postId,
      parentId: null,
      OR: [
        { status: CommentStatus.VISIBLE },
        {
          status: { in: [CommentStatus.DELETED, CommentStatus.HIDDEN] },
          replies: { some: { status: CommentStatus.VISIBLE } },
        },
      ],
    };
    const direction = query.order === 'oldest' ? 'asc' : 'desc';
    const [records, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        include: commentInclude,
        orderBy: [{ createdAt: direction }, { id: direction }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.comment.count({ where }),
    ]);
    return { records, total };
  }

  findComment(id: string): Promise<CommentRecord | null> {
    return this.prisma.comment.findUnique({ where: { id }, include: commentInclude });
  }

  createComment(userId: string, postId: string, input: CreateCommentInput): Promise<CommentRecord> {
    return this.prisma.comment.create({
      data: {
        authorId: userId,
        postId,
        content: input.content,
        ...(input.parentId ? { parentId: input.parentId } : {}),
      },
      include: commentInclude,
    });
  }

  async updateVisibleComment(id: string, content: string): Promise<CommentRecord | null> {
    const result = await this.prisma.comment.updateMany({
      where: { id, status: CommentStatus.VISIBLE },
      data: { content, editedAt: new Date() },
    });
    return result.count === 1 ? this.findComment(id) : null;
  }

  async softDeleteVisibleComment(id: string): Promise<CommentRecord | null> {
    const result = await this.prisma.comment.updateMany({
      where: { id, status: CommentStatus.VISIBLE },
      data: { status: CommentStatus.DELETED, deletedAt: new Date() },
    });
    return result.count === 1 ? this.findComment(id) : null;
  }

  async putVote(userId: string, postId: string): Promise<number> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.postVote.upsert({
        where: { userId_postId: { userId, postId } },
        update: {},
        create: { userId, postId },
      });
      return transaction.postVote.count({ where: { postId } });
    });
  }

  async deleteVote(userId: string, postId: string): Promise<number> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.postVote.deleteMany({ where: { userId, postId } });
      return transaction.postVote.count({ where: { postId } });
    });
  }

  async putRating(userId: string, postId: string, input: RatingInput) {
    return this.prisma.$transaction(async (transaction) => {
      const rating = await transaction.postRating.upsert({
        where: { userId_postId: { userId, postId } },
        update: { taste: input.taste, difficulty: input.difficulty, active: true },
        create: { userId, postId, taste: input.taste, difficulty: input.difficulty },
        select: { taste: true, difficulty: true },
      });
      const aggregate = await transaction.postRating.aggregate({
        where: { postId, active: true },
        _count: { _all: true },
        _avg: { taste: true, difficulty: true },
      });
      return { rating, aggregate };
    });
  }

  async putBookmark(userId: string, postId: string): Promise<void> {
    await this.prisma.postBookmark.upsert({
      where: { userId_postId: { userId, postId } },
      update: {},
      create: { userId, postId },
    });
  }

  async deleteBookmark(userId: string, postId: string): Promise<void> {
    await this.prisma.postBookmark.deleteMany({ where: { userId, postId } });
  }

  async getSummary(postId: string, userId?: string) {
    const [voteCount, rating, viewerVote, viewerBookmark, viewerRating] = await Promise.all([
      this.prisma.postVote.count({ where: { postId } }),
      this.prisma.postRating.aggregate({
        where: { postId, active: true },
        _count: { _all: true },
        _avg: { taste: true, difficulty: true },
      }),
      userId
        ? this.prisma.postVote.findUnique({ where: { userId_postId: { userId, postId } } })
        : null,
      userId
        ? this.prisma.postBookmark.findUnique({ where: { userId_postId: { userId, postId } } })
        : null,
      userId
        ? this.prisma.postRating.findFirst({
            where: { userId, postId, active: true },
            select: { taste: true, difficulty: true },
          })
        : null,
    ]);
    return { voteCount, rating, viewerVote, viewerBookmark, viewerRating };
  }

  async listBookmarks(userId: string, query: BookmarkListQuery) {
    const where: Prisma.PostBookmarkWhereInput = {
      userId,
      post: {
        ...publishedPostWhere,
        type: query.type ? query.type : { in: [PostType.RECIPE, PostType.VIDEO] },
      },
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.postBookmark.findMany({
        where,
        include: {
          post: {
            include: {
              publishedRevision: {
                include: {
                  media: {
                    where: { kind: MediaKind.COVER_IMAGE },
                    orderBy: { position: 'asc' },
                    take: 1,
                  },
                },
              },
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { postId: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.postBookmark.count({ where }),
    ]);
    return { records, total };
  }
}
