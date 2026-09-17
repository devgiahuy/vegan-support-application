import {
  BaseMapper,
  pickField,
  safeArray,
  safeDate,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type {
  BookmarkedItemDto,
  CommentAuthorDto,
  CommunityBookmarkListResponseDto,
  CommunityBookmarkResponseDto,
  CommunityCommentDto,
  CommunityCommentListResponseDto,
  CommunityCommentResponseDto,
  CommunityRatingResponseDto,
  CommunitySummaryResponseDto,
  CommunityVoteResponseDto,
  CreateCommentRequestDto,
  UpdateCommentRequestDto,
} from '../types/community.dto';
import type {
  BookmarkedItem,
  CommentAuthor,
  CommunityComment,
  CommunityRating,
  CommunitySummary,
} from '../types/community.model';
import { CommentStatus } from '@/common/enums';

function emptyPageMeta() {
  return { page: 1, limit: 10, totalItems: 0, totalPages: 0 };
}

function toPageMeta(
  meta:
    | { page?: number; limit?: number; total?: number; totalPages?: number; total_pages?: number }
    | null
    | undefined,
  fallbackTotal: number
) {
  const page = safeNumber(pickField(meta, ['page'], 1));
  const limit = safeNumber(pickField(meta, ['limit'], 10));
  const totalItems = safeNumber(pickField(meta, ['total'], fallbackTotal));
  const totalPages = safeNumber(pickField(meta, ['totalPages', 'total_pages'], 1));
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * CommunityMapper: comments (ép 1 tầng), vote/summary, rating, bookmark.
 * Envelope `{success, data, meta}` đọc trực tiếp — cấm bọc `APIResponse<>` 2 tầng.
 */
export class CommunityMapper extends BaseMapper<CommunityCommentDto, CommunityComment> {
  toModel(dto: CommunityCommentDto | null | undefined): CommunityComment {
    const author = pickField(dto, ['author'], null) as CommentAuthorDto | null;
    const parentId = safeString(pickField(dto, ['parentId', 'parent_id'], ''));
    return {
      id: safeString(pickField(dto, ['id'], '')),
      postId: safeString(pickField(dto, ['postId', 'post_id'], '')),
      parentId: parentId.length > 0 ? parentId : null,
      content: safeString(pickField(dto, ['content'], ''), '') || null,
      status: safeEnum(pickField(dto, ['status'], 'VISIBLE'), CommentStatus, CommentStatus.VISIBLE),
      isPlaceholder: pickField<boolean>(dto, ['isPlaceholder', 'is_placeholder'], false),
      author:
        author && typeof author === 'object'
          ? {
              id: safeString(pickField(author, ['id'], '')),
              displayName:
                safeString(pickField(author, ['displayName', 'display_name'], '')) ||
                'Người dùng ẩn danh',
              avatarUrl: safeString(pickField(author, ['avatarUrl', 'avatar_url'], '')) || null,
            }
          : null,
      editedAt: safeDate(pickField(dto, ['editedAt', 'edited_at'], null)),
      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
      // Ép 1 tầng: reply không bao giờ mang replies theo (tầng 3+ bị cắt).
      replies: safeArray<CommunityCommentDto | null, CommunityComment>(
        pickField(dto, ['replies'], null) as (CommunityCommentDto | null)[] | null,
        (reply) => this.toReplyModel(reply)
      ).filter((reply) => reply.id.length > 0),
    };
  }

  /** Reply tầng 1 — cắt replies lồng sâu hơn. */
  private toReplyModel(dto: CommunityCommentDto | null | undefined): CommunityComment {
    const comment = this.toModel(dto);
    return { ...comment, replies: [] };
  }

  /** `GET /posts/:id/comments` — thread gốc + meta. */
  toThreadModel(
    dto: CommunityCommentListResponseDto | null | undefined
  ): PaginationResult<CommunityComment> {
    const rawItems = pickField(dto, ['data'], null) as (CommunityCommentDto | null)[] | null;
    const items = this.toModelList(
      safeArray<CommunityCommentDto | null, CommunityCommentDto | null>(rawItems, (item) => item)
    ).filter((item) => item.id.length > 0);
    const meta = pickField(dto, ['meta'], null) as CommunityCommentListResponseDto['meta'];
    return {
      items,
      metadata: meta
        ? toPageMeta(meta, items.length)
        : { ...emptyPageMeta(), totalItems: items.length },
    };
  }

  /** `POST/PATCH/DELETE /comments/*` → 1 bình luận. */
  toSingleComment(dto: CommunityCommentResponseDto | null | undefined): CommunityComment {
    const data = pickField(dto, ['data'], null) as CommunityCommentDto | null;
    return this.toModel(data);
  }

  /** `GET /posts/:id/community-summary` → aggregate + viewer (null-safe guest). */
  toSummaryModel(dto: CommunitySummaryResponseDto | null | undefined): CommunitySummary {
    const rawData = pickField(dto, ['data'], null);
    const data = (
      Array.isArray(rawData) ? rawData[0] : rawData
    ) as CommunitySummaryResponseDto['data'];

    const rawRating = pickField(data, ['rating'], null);
    // Nếu rating là mảng, lấy phần tử đầu tiên trong mảng để hiển thị
    const rating = (Array.isArray(rawRating) ? rawRating[0] : rawRating) as
      NonNullable<CommunitySummaryResponseDto['data']>['rating'] | null;

    const rawViewer = pickField(data, ['viewer'], null);
    const viewer = (Array.isArray(rawViewer) ? rawViewer[0] : rawViewer) as
      NonNullable<CommunitySummaryResponseDto['data']>['viewer'] | null;

    const rawViewerRating = pickField(viewer, ['rating'], null);
    // Nếu viewer.rating là mảng, lấy phần tử đầu tiên
    const viewerRating = (Array.isArray(rawViewerRating) ? rawViewerRating[0] : rawViewerRating) as
      NonNullable<NonNullable<CommunitySummaryResponseDto['data']>['viewer']>['rating'] | null;

    const avg = (val: unknown): number | null => {
      if (val === null || val === undefined) return null;
      const parsed = safeNumber(val, NaN);
      return Number.isNaN(parsed) ? null : parsed;
    };
    return {
      postId: safeString(pickField(data, ['postId', 'post_id'], '')),
      voteCount: safeNumber(pickField(data, ['voteCount', 'vote_count'], 0)),
      ratingCount: safeNumber(pickField(rating, ['count', 'total'], 0)),
      tasteAverage: avg(
        pickField(rating, ['tasteAverage', 'taste_average', 'average', 'taste', 'score'], null)
      ),
      difficultyAverage: avg(
        pickField(rating, ['difficultyAverage', 'difficulty_average', 'difficulty'], null)
      ),
      viewerVoted: pickField<boolean>(viewer, ['voted'], false),
      viewerBookmarked: pickField<boolean>(viewer, ['bookmarked'], false),
      viewerTaste: avg(pickField(viewerRating, ['taste', 'score'], null)),
      viewerDifficulty: avg(pickField(viewerRating, ['difficulty'], null)),
    };
  }

  /** `PUT/DELETE /posts/:id/vote` → idempotent. */
  toVoteModel(dto: CommunityVoteResponseDto | null | undefined): {
    postId: string;
    voted: boolean;
    voteCount: number;
  } {
    const data = pickField(dto, ['data'], null) as CommunityVoteResponseDto['data'];
    return {
      postId: safeString(pickField(data, ['postId'], '')),
      voted: pickField<boolean>(data, ['voted'], false),
      voteCount: safeNumber(pickField(data, ['voteCount'], 0)),
    };
  }

  /** `PUT /posts/:id/rating` → điểm user + aggregate (null khi thiếu). */
  toRatingModel(dto: CommunityRatingResponseDto | null | undefined): CommunityRating {
    const data = pickField(dto, ['data'], null) as CommunityRatingResponseDto['data'];
    const rating = pickField(data, ['rating'], null) as
      NonNullable<CommunityRatingResponseDto['data']>['rating'] | null;
    const aggregate = pickField(data, ['aggregate'], null) as
      NonNullable<CommunityRatingResponseDto['data']>['aggregate'] | null;
    const avg = (val: unknown): number | null => {
      if (val === null || val === undefined) return null;
      const parsed = safeNumber(val, NaN);
      return Number.isNaN(parsed) ? null : parsed;
    };
    return {
      postId: safeString(pickField(data, ['postId'], '')),
      taste: safeNumber(pickField(rating, ['taste'], 0)),
      difficulty: safeNumber(pickField(rating, ['difficulty'], 0)),
      aggregateCount: safeNumber(pickField(aggregate, ['count'], 0)),
      aggregateTasteAverage: avg(pickField(aggregate, ['tasteAverage'], null)),
      aggregateDifficultyAverage: avg(pickField(aggregate, ['difficultyAverage'], null)),
    };
  }

  toRatingDto(taste: number, difficulty: number): { taste: number; difficulty: number } {
    return { taste, difficulty };
  }

  /** `PUT/DELETE /posts/:id/bookmark` → toggle. */
  toBookmarkModel(dto: CommunityBookmarkResponseDto | null | undefined): {
    postId: string;
    bookmarked: boolean;
  } {
    const data = pickField(dto, ['data'], null) as CommunityBookmarkResponseDto['data'];
    return {
      postId: safeString(pickField(data, ['postId'], '')),
      bookmarked: pickField<boolean>(data, ['bookmarked'], false),
    };
  }

  /** `GET /users/me/bookmarks` → list + meta. */
  toBookmarksList(
    dto: CommunityBookmarkListResponseDto | null | undefined
  ): PaginationResult<BookmarkedItem> {
    const rawItems = pickField(dto, ['data'], null) as (BookmarkedItemDto | null)[] | null;
    const items = safeArray<BookmarkedItemDto | null, BookmarkedItem>(rawItems, (item) => ({
      postId: safeString(pickField(item, ['postId'], '')),
      type: safeString(pickField(item, ['type'], '')),
      slug: safeString(pickField(item, ['slug'], '')),
      title: safeString(pickField(item, ['title'], '')) || 'Nội dung đã lưu',
      excerpt: safeString(pickField(item, ['excerpt'], '')),
      coverImageUrl: safeString(pickField(item, ['coverImageUrl'], '')) || null,
      publishedAt: safeDate(pickField(item, ['publishedAt', 'published_at'], null)),
      bookmarkedAt: safeDate(pickField(item, ['bookmarkedAt', 'bookmarked_at'], null)),
    })).filter((item) => item.postId.length > 0);
    const meta = pickField(dto, ['meta'], null) as CommunityBookmarkListResponseDto['meta'];
    return {
      items,
      metadata: meta
        ? toPageMeta(meta, items.length)
        : { ...emptyPageMeta(), totalItems: items.length },
    };
  }

  toCreateDto(content: string, parentId?: string): CreateCommentRequestDto {
    return { content, ...(parentId ? { parentId } : {}) };
  }

  toUpdateDto(content: string): UpdateCommentRequestDto {
    return { content };
  }
}

export const communityMapper = new CommunityMapper();

export type { CommentAuthor };
