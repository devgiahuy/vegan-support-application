import { CommentStatus, CommunityAction, PostType, type Role } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type { CommentRecord, CommunityRepository } from './community.repository.js';
import type {
  BookmarkListQuery,
  CommentListQuery,
  CommentOutput,
  CreateCommentInput,
  RatingInput,
  UpdateCommentInput,
} from './community.schemas.js';

export interface CommunityActor {
  userId: string;
  role: Role;
}

const rateLimits: Record<CommunityAction, number> = {
  COMMENT_CREATE: 6,
  COMMENT_EDIT: 12,
  VOTE: 60,
  RATING: 30,
  BOOKMARK: 60,
};

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) };
}

function roundedAverage(value: number | null): number | null {
  return value === null ? null : Math.round(value * 100) / 100;
}

function commentOutput(comment: CommentRecord): CommentOutput {
  const visible = comment.status === CommentStatus.VISIBLE;
  return {
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId,
    content: visible ? comment.content : null,
    status: comment.status,
    isPlaceholder: !visible,
    author: visible
      ? {
          id: comment.author.id,
          displayName: comment.author.displayName,
          avatarUrl: comment.author.avatarUrl,
        }
      : null,
    editedAt: visible ? (comment.editedAt?.toISOString() ?? null) : null,
    createdAt: comment.createdAt.toISOString(),
    replies: comment.replies.map((reply) => ({
      id: reply.id,
      postId: reply.postId,
      parentId: reply.parentId as string,
      content: reply.content,
      status: CommentStatus.VISIBLE,
      isPlaceholder: false,
      author: {
        id: reply.author.id,
        displayName: reply.author.displayName,
        avatarUrl: reply.author.avatarUrl,
      },
      editedAt: reply.editedAt?.toISOString() ?? null,
      createdAt: reply.createdAt.toISOString(),
    })),
  };
}

export class CommunityService {
  constructor(private readonly repository: CommunityRepository) {}

  async listComments(postId: string, query: CommentListQuery) {
    await this.requirePublishedPost(postId);
    const result = await this.repository.listComments(postId, query);
    return {
      data: result.records.map(commentOutput),
      meta: pagination(query.page, query.limit, result.total),
    };
  }

  async createComment(
    actor: CommunityActor,
    postId: string,
    input: CreateCommentInput,
  ): Promise<CommentOutput> {
    await this.requirePublishedPost(postId);
    if (input.parentId) {
      const parent = await this.repository.findComment(input.parentId);
      if (
        !parent ||
        parent.postId !== postId ||
        parent.parentId !== null ||
        parent.status !== CommentStatus.VISIBLE
      ) {
        throw new AppError({
          statusCode: 400,
          code: 'INVALID_COMMENT_PARENT',
          message: 'Reply chỉ được gắn vào comment gốc đang hiển thị của cùng post',
        });
      }
    }
    await this.consumeRateLimit(actor.userId, CommunityAction.COMMENT_CREATE);
    return commentOutput(await this.repository.createComment(actor.userId, postId, input));
  }

  async updateComment(
    actor: CommunityActor,
    commentId: string,
    input: UpdateCommentInput,
  ): Promise<CommentOutput> {
    const comment = await this.requireOwnedComment(actor.userId, commentId);
    if (comment.status !== CommentStatus.VISIBLE) throw this.commentNotEditable();
    await this.consumeRateLimit(actor.userId, CommunityAction.COMMENT_EDIT);
    const updated = await this.repository.updateVisibleComment(commentId, input.content);
    if (!updated) throw this.commentNotEditable();
    return commentOutput(updated);
  }

  async deleteComment(actor: CommunityActor, commentId: string): Promise<CommentOutput> {
    const comment = await this.requireOwnedComment(actor.userId, commentId);
    if (comment.status === CommentStatus.HIDDEN) throw this.commentNotEditable();
    if (comment.status === CommentStatus.DELETED) return commentOutput(comment);
    await this.consumeRateLimit(actor.userId, CommunityAction.COMMENT_EDIT);
    const deleted = await this.repository.softDeleteVisibleComment(commentId);
    if (!deleted) throw this.commentNotEditable();
    return commentOutput(deleted);
  }

  async putVote(actor: CommunityActor, postId: string) {
    await this.requirePublishedPost(postId);
    await this.consumeRateLimit(actor.userId, CommunityAction.VOTE);
    const voteCount = await this.repository.putVote(actor.userId, postId);
    return { postId, voted: true, voteCount };
  }

  async deleteVote(actor: CommunityActor, postId: string) {
    await this.requirePublishedPost(postId);
    await this.consumeRateLimit(actor.userId, CommunityAction.VOTE);
    const voteCount = await this.repository.deleteVote(actor.userId, postId);
    return { postId, voted: false, voteCount };
  }

  async putRating(actor: CommunityActor, postId: string, input: RatingInput) {
    const post = await this.requirePublishedPost(postId);
    if (post.type !== PostType.RECIPE) {
      throw new AppError({
        statusCode: 400,
        code: 'RATING_RECIPE_ONLY',
        message: 'Chỉ Recipe mới nhận taste và difficulty rating',
      });
    }
    await this.consumeRateLimit(actor.userId, CommunityAction.RATING);
    const result = await this.repository.putRating(actor.userId, postId, input);
    return {
      postId,
      rating: result.rating,
      aggregate: {
        count: result.aggregate._count._all,
        tasteAverage: roundedAverage(result.aggregate._avg.taste),
        difficultyAverage: roundedAverage(result.aggregate._avg.difficulty),
      },
    };
  }

  async putBookmark(actor: CommunityActor, postId: string) {
    await this.requireBookmarkablePost(postId);
    await this.consumeRateLimit(actor.userId, CommunityAction.BOOKMARK);
    await this.repository.putBookmark(actor.userId, postId);
    return { postId, bookmarked: true };
  }

  async deleteBookmark(actor: CommunityActor, postId: string) {
    await this.requireBookmarkablePost(postId);
    await this.consumeRateLimit(actor.userId, CommunityAction.BOOKMARK);
    await this.repository.deleteBookmark(actor.userId, postId);
    return { postId, bookmarked: false };
  }

  async getSummary(postId: string, actor?: CommunityActor) {
    const post = await this.requirePublishedPost(postId);
    const result = await this.repository.getSummary(postId, actor?.userId);
    return {
      postId,
      voteCount: result.voteCount,
      rating:
        post.type === PostType.RECIPE
          ? {
              count: result.rating._count._all,
              tasteAverage: roundedAverage(result.rating._avg.taste),
              difficultyAverage: roundedAverage(result.rating._avg.difficulty),
            }
          : null,
      viewer: actor
        ? {
            voted: result.viewerVote !== null,
            bookmarked: result.viewerBookmark !== null,
            rating: result.viewerRating,
          }
        : null,
    };
  }

  async listBookmarks(actor: CommunityActor, query: BookmarkListQuery) {
    const result = await this.repository.listBookmarks(actor.userId, query);
    return {
      data: result.records.flatMap((bookmark) => {
        const revision = bookmark.post.publishedRevision;
        const publishedAt = bookmark.post.publishedAt;
        if (!revision || !publishedAt) return [];
        return [
          {
            postId: bookmark.postId,
            type: bookmark.post.type as Extract<PostType, 'RECIPE' | 'VIDEO'>,
            slug: bookmark.post.slug,
            title: revision.title,
            excerpt: revision.excerpt,
            coverImageUrl: revision.media[0]?.secureUrl ?? null,
            publishedAt: publishedAt.toISOString(),
            bookmarkedAt: bookmark.createdAt.toISOString(),
          },
        ];
      }),
      meta: pagination(query.page, query.limit, result.total),
    };
  }

  private async requirePublishedPost(postId: string) {
    const post = await this.repository.findPublishedPost(postId);
    if (!post) {
      throw new AppError({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Không tìm thấy published content',
      });
    }
    return post;
  }

  private async requireBookmarkablePost(postId: string) {
    const post = await this.requirePublishedPost(postId);
    if (post.type !== PostType.RECIPE && post.type !== PostType.VIDEO) {
      throw new AppError({
        statusCode: 400,
        code: 'BOOKMARK_TYPE_NOT_SUPPORTED',
        message: 'Bookmark chỉ hỗ trợ Recipe và Video',
      });
    }
    return post;
  }

  private async requireOwnedComment(userId: string, commentId: string) {
    const comment = await this.repository.findComment(commentId);
    if (!comment) {
      throw new AppError({ statusCode: 404, code: 'NOT_FOUND', message: 'Không tìm thấy comment' });
    }
    if (comment.authorId !== userId) {
      throw new AppError({
        statusCode: 403,
        code: 'COMMENT_OWNER_REQUIRED',
        message: 'Chỉ chủ sở hữu comment được thực hiện thao tác này',
      });
    }
    return comment;
  }

  private async consumeRateLimit(userId: string, action: CommunityAction): Promise<void> {
    const now = new Date();
    const windowStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
    const allowed = await this.repository.consumeRateLimit(
      userId,
      action,
      windowStart,
      rateLimits[action],
    );
    if (!allowed) {
      const retryAfterSeconds = 60 - now.getUTCSeconds();
      throw new AppError({
        statusCode: 429,
        code: 'COMMUNITY_RATE_LIMITED',
        message: 'Bạn thao tác quá nhanh; vui lòng thử lại sau',
        fields: { retryAfterSeconds: [String(retryAfterSeconds)] },
      });
    }
  }

  private commentNotEditable(): AppError {
    return new AppError({
      statusCode: 409,
      code: 'COMMENT_NOT_EDITABLE',
      message: 'Comment đã bị xóa hoặc ẩn và không thể sửa/khôi phục bằng API người dùng',
    });
  }
}
