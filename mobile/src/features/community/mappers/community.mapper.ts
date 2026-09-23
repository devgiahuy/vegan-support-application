import { BaseMapper, pickField, safeArray, safeDate, safeEnum, safeNumber, safeString } from '@/lib/mapper';
import { CommentStatus } from '@/common/enums';
import type { PaginationResult } from '@/types/api';
import type {
  CommentAuthorDto,
  CommunityBookmarkResponseDto,
  CommunityCommentDto,
  CommunityCommentListResponseDto,
  CommunityCommentResponseDto,
  CommunitySummaryResponseDto,
  CommunityVoteResponseDto,
} from '../types/community.dto';
import type { CommunityComment, CommunitySummary } from '../types/community.model';

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
}

export const communityMapper = new CommunityMapper();
