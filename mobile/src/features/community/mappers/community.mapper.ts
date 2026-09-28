import { BaseMapper, pickField, safeArray, safeDate, safeEnum, safeNumber, safeString } from '@/lib/mapper';
import { CommentStatus, PostType } from '@/common/enums';
import type { PaginationResult } from '@/types/api';
import type {
  BookmarkedItemDto,
  BookmarkListResponseDto,
  CommentAuthorDto,
  CommunityBookmarkResponseDto,
  CommunityCommentDto,
  CommunityCommentListResponseDto,
  CommunityCommentResponseDto,
  CommunityRatingResponseDto,
  CommunitySummaryResponseDto,
  CommunityVoteResponseDto,
  CurrentRatingDto,
  RatingAggregateDto,
} from '../types/community.dto';
import type {
  BookmarkedItem,
  CommunityComment,
  CommunitySummary,
  CurrentRating,
  RatingAggregate,
} from '../types/community.model';

function toRatingAggregate(dto: RatingAggregateDto | null | undefined): RatingAggregate | null {
  if (!dto || typeof dto !== 'object') return null;
  return {
    count: safeNumber(pickField(dto, ['count'], 0)),
    tasteAverage: dto.tasteAverage == null ? null : safeNumber(dto.tasteAverage),
    difficultyAverage: dto.difficultyAverage == null ? null : safeNumber(dto.difficultyAverage),
  };
}

function toCurrentRating(dto: CurrentRatingDto | null | undefined): CurrentRating | null {
  if (!dto || typeof dto !== 'object' || dto.taste == null || dto.difficulty == null) return null;
  return { taste: safeNumber(dto.taste), difficulty: safeNumber(dto.difficulty) };
}

export class CommunityMapper extends BaseMapper<CommunityCommentDto, CommunityComment> {
  toModel(dto: CommunityCommentDto | null | undefined): CommunityComment {
    const author = pickField<CommentAuthorDto | null>(dto, ['author'], null);
    const parentId = safeString(pickField(dto, ['parentId'], ''));

    return {
      id: safeString(pickField(dto, ['id'], '')),
      postId: safeString(pickField(dto, ['postId'], '')),
      parentId: parentId || null,
      content: safeString(pickField(dto, ['content'], ''), '') || null,
      status: safeEnum(pickField(dto, ['status'], 'VISIBLE'), CommentStatus, CommentStatus.VISIBLE),
      isPlaceholder: Boolean(pickField(dto, ['isPlaceholder'], false)),
      author:
        author && typeof author === 'object'
          ? {
              id: safeString(pickField(author, ['id'], '')),
              displayName: safeString(pickField(author, ['displayName'], 'Người dùng')),
              avatarUrl: safeString(pickField(author, ['avatarUrl'], '')) || null,
            }
          : null,
      editedAt: safeDate(pickField(dto, ['editedAt'], null)),
      createdAt: safeDate(pickField(dto, ['createdAt'], null)),
      replies: safeArray<CommunityCommentDto | null, CommunityComment>(
        pickField(dto, ['replies'], []) as (CommunityCommentDto | null)[] | null,
        (reply) => ({ ...this.toModel(reply), replies: [] })
      ).filter((reply) => reply.id.length > 0),
    };
  }

  toThreadModel(dto: CommunityCommentListResponseDto | null | undefined): PaginationResult<CommunityComment> {
    const items = this.toModelList(pickField(dto, ['data'], [])).filter((item) => item.id.length > 0);
    const meta = pickField<CommunityCommentListResponseDto['meta']>(dto, ['meta'], null);
    const page = safeNumber(meta?.page, 1);
    const limit = safeNumber(meta?.limit, 20);
    const totalPages = safeNumber(meta?.totalPages, 1);

    return {
      items,
      metadata: {
        page,
        limit,
        totalItems: safeNumber(meta?.total, items.length),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  toSingleComment(dto: CommunityCommentResponseDto | null | undefined): CommunityComment {
    return this.toModel(pickField(dto, ['data'], null));
  }

  toSummaryModel(dto: CommunitySummaryResponseDto | null | undefined): CommunitySummary {
    const data = pickField<CommunitySummaryResponseDto['data']>(dto, ['data'], null);
    const viewer = pickField<NonNullable<CommunitySummaryResponseDto['data']>['viewer']>(data, ['viewer'], null);
    return {
      postId: safeString(pickField(data, ['postId'], '')),
      voteCount: safeNumber(pickField(data, ['voteCount'], 0)),
      viewerVoted: Boolean(pickField(viewer, ['voted'], false)),
      viewerBookmarked: Boolean(pickField(viewer, ['bookmarked'], false)),
      rating: toRatingAggregate(pickField(data, ['rating'], null)),
      viewerRating: toCurrentRating(pickField(viewer, ['rating'], null)),
    };
  }

  toVoteModel(dto: CommunityVoteResponseDto | null | undefined) {
    const data = pickField<CommunityVoteResponseDto['data']>(dto, ['data'], null);
    return {
      postId: safeString(pickField(data, ['postId'], '')),
      voted: Boolean(pickField(data, ['voted'], false)),
      voteCount: safeNumber(pickField(data, ['voteCount'], 0)),
    };
  }

  toBookmarkModel(dto: CommunityBookmarkResponseDto | null | undefined) {
    const data = pickField<CommunityBookmarkResponseDto['data']>(dto, ['data'], null);
    return {
      postId: safeString(pickField(data, ['postId'], '')),
      bookmarked: Boolean(pickField(data, ['bookmarked'], false)),
    };
  }

  /** `PUT /posts/:id/rating` → đánh giá vừa lưu + tổng hợp mới. Chỉ Recipe. */
  toRatingResultModel(dto: CommunityRatingResponseDto | null | undefined): {
    postId: string;
    rating: CurrentRating | null;
    aggregate: RatingAggregate | null;
  } {
    const data = pickField<CommunityRatingResponseDto['data']>(dto, ['data'], null);
    return {
      postId: safeString(pickField(data, ['postId'], '')),
      rating: toCurrentRating(pickField(data, ['rating'], null)),
      aggregate: toRatingAggregate(pickField(data, ['aggregate'], null)),
    };
  }

  toBookmarkedItem(dto: BookmarkedItemDto | null | undefined): BookmarkedItem {
    return {
      postId: safeString(pickField(dto, ['postId'], '')),
      type: safeEnum(pickField(dto, ['type'], 'RECIPE'), PostType, PostType.RECIPE) as 'RECIPE' | 'VIDEO',
      slug: safeString(pickField(dto, ['slug'], '')),
      title: safeString(pickField(dto, ['title'], 'Nội dung đã lưu')),
      excerpt: safeString(pickField(dto, ['excerpt'], '')) || null,
      coverImageUrl: safeString(pickField(dto, ['coverImageUrl'], '')) || null,
      publishedAt: safeDate(pickField(dto, ['publishedAt'], null)),
      bookmarkedAt: safeDate(pickField(dto, ['bookmarkedAt'], null)),
    };
  }

  toBookmarkListModel(dto: BookmarkListResponseDto | null | undefined): PaginationResult<BookmarkedItem> {
    const items = safeArray<BookmarkedItemDto | null, BookmarkedItem>(
      pickField(dto, ['data'], []),
      (item) => this.toBookmarkedItem(item)
    ).filter((item) => item.postId.length > 0);
    const meta = pickField<BookmarkListResponseDto['meta']>(dto, ['meta'], null);
    const page = safeNumber(meta?.page, 1);
    const limit = safeNumber(meta?.limit, 20);
    const totalPages = safeNumber(meta?.totalPages, 1);
    return {
      items,
      metadata: {
        page,
        limit,
        totalItems: safeNumber(meta?.total, items.length),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}

export const communityMapper = new CommunityMapper();
