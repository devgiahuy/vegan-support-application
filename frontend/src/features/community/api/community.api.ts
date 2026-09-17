import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { PaginationResult } from '@/types/api';
import type {
  CommunityBookmarkListResponseDto,
  CommunityBookmarkResponseDto,
  CommunityCommentDto,
  CommunityCommentListResponseDto,
  CommunityCommentResponseDto,
  CommunityRatingResponseDto,
  CommunitySummaryResponseDto,
  CommunityVoteResponseDto,
} from '../types/community.dto';
import type {
  BookmarkedItem,
  CommunityComment,
  CommunityQueryParams,
  CommunityRating,
  CommunitySummary,
} from '../types/community.model';
import { communityMapper } from '../mappers/community.mapper';
import {
  bookmarkFixture,
  bookmarksListFixture,
  ratingFixture,
} from '../__fixtures__/bookmark-fixtures';
import { commentThreadFixture, createdCommentFixture } from '../__fixtures__/comment-fixtures';
import { communitySummaryFixture, voteFixture } from '../__fixtures__/vote-fixtures';

/**
 * Cờ bật/tắt fixture.
 * Đặt `false` để gọi API Backend thật (Phase 06 Community Interactions).
 * Đặt `true` nếu cần chạy mô phỏng không có Backend.
 */
export const USE_FIXTURES = false;

const SIMULATED_DELAY_MS = 300;

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// Kho trong bộ nhớ cho chế độ fixture
let threadStore: (CommunityCommentDto | null)[] = clone(commentThreadFixture.data ?? []);
let voteCount: number = Number(communitySummaryFixture.data?.voteCount ?? 0);
let viewerVoted = communitySummaryFixture.data?.viewer?.voted ?? false;
let viewerBookmarked = communitySummaryFixture.data?.viewer?.bookmarked ?? false;
let bookmarksStore = clone(bookmarksListFixture.data ?? []);

export function __resetCommunityFixtures(): void {
  threadStore = clone(commentThreadFixture.data ?? []);
  voteCount = Number(communitySummaryFixture.data?.voteCount ?? 0);
  viewerVoted = communitySummaryFixture.data?.viewer?.voted ?? false;
  viewerBookmarked = communitySummaryFixture.data?.viewer?.bookmarked ?? false;
  bookmarksStore = clone(bookmarksListFixture.data ?? []);
}

export const communityApi = {
  /** `GET /posts/:id/comments` */
  getThread: async (
    params: CommunityQueryParams & { postId: string }
  ): Promise<PaginationResult<CommunityComment>> => {
    if (!USE_FIXTURES) {
      const res = await api.get<CommunityCommentListResponseDto>(
        API_ENDPOINTS.COMMUNITY.COMMENTS(params.postId),
        {
          params: {
            page: params.page ?? 1,
            limit: params.limit ?? 20,
            order: params.order ?? 'oldest',
          },
          silent: true,
        }
      );
      return communityMapper.toThreadModel(res.data);
    }
    await delay();
    const source = clone(threadStore);
    return communityMapper.toThreadModel({
      success: true,
      data: source,
      meta: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        total: source.length,
        totalPages: 1,
      },
    });
  },

  /** `POST /posts/:id/comments` */
  createComment: async (
    postId: string,
    content: string,
    parentId?: string
  ): Promise<CommunityComment> => {
    if (!USE_FIXTURES) {
      const res = await api.post<CommunityCommentResponseDto>(
        API_ENDPOINTS.COMMUNITY.COMMENTS(postId),
        { content, ...(parentId ? { parentId } : {}) },
        { showErrorToast: true }
      );
      return communityMapper.toSingleComment(res.data);
    }
    await delay();
    const created = communityMapper.toSingleComment(
      createdCommentFixture(content, parentId ?? null)
    );
    const raw: CommunityCommentDto = {
      id: created.id,
      postId,
      parentId: created.parentId,
      content: created.content,
      status: 'VISIBLE',
      author: { id: 'me', displayName: 'Bạn' },
      replies: [],
    };
    if (!created.parentId) {
      threadStore = [raw, ...threadStore];
    } else {
      threadStore = threadStore.map((item) =>
        item && item.id === created.parentId
          ? { ...item, replies: [...(item.replies ?? []), raw] }
          : item
      );
    }
    return { ...created, postId };
  },

  /** `PATCH /comments/:id` */
  updateComment: async (id: string, content: string): Promise<CommunityComment> => {
    if (!USE_FIXTURES) {
      const res = await api.patch<CommunityCommentResponseDto>(
        API_ENDPOINTS.COMMUNITY.COMMENT(id),
        { content },
        { showErrorToast: true }
      );
      return communityMapper.toSingleComment(res.data);
    }
    await delay();
    const patch = (list: (CommunityCommentDto | null)[]): (CommunityCommentDto | null)[] =>
      list.map((item) =>
        item && item.id === id
          ? { ...item, content, editedAt: new Date().toISOString() }
          : item
            ? { ...item, replies: patch(item.replies ?? []) }
            : item
      );
    threadStore = patch(threadStore);
    return communityMapper.toSingleComment({
      success: true,
      data: { id, content, status: 'VISIBLE', editedAt: new Date().toISOString() },
      meta: null,
    });
  },

  /** `DELETE /comments/:id` */
  deleteComment: async (id: string): Promise<CommunityComment> => {
    if (!USE_FIXTURES) {
      const res = await api.delete<CommunityCommentResponseDto>(
        API_ENDPOINTS.COMMUNITY.COMMENT(id),
        { showErrorToast: true }
      );
      return communityMapper.toSingleComment(res.data);
    }
    await delay();
    const remove = (list: (CommunityCommentDto | null)[]): (CommunityCommentDto | null)[] =>
      list
        .filter((item) => item?.id !== id)
        .map((item) => (item ? { ...item, replies: remove(item.replies ?? []) } : item));
    threadStore = remove(threadStore);
    return communityMapper.toSingleComment({
      success: true,
      data: { id, status: 'DELETED' },
      meta: null,
    });
  },

  /** `GET /posts/:id/community-summary` */
  getSummary: async (postId: string): Promise<CommunitySummary> => {
    if (!USE_FIXTURES) {
      const res = await api.get<CommunitySummaryResponseDto>(
        API_ENDPOINTS.COMMUNITY.SUMMARY(postId),
        { silent: true }
      );
      return communityMapper.toSummaryModel(res.data);
    }
    await delay();
    return communityMapper.toSummaryModel({
      success: true,
      data: {
        ...(communitySummaryFixture.data ?? {}),
        postId,
        voteCount,
        viewer: {
          voted: viewerVoted,
          bookmarked: viewerBookmarked,
          rating: { taste: 5, difficulty: 2 },
        },
      },
      meta: null,
    });
  },

  /** `PUT /posts/:id/vote` */
  putVote: async (
    postId: string
  ): Promise<{ postId: string; voted: boolean; voteCount: number }> => {
    if (!USE_FIXTURES) {
      const res = await api.put<CommunityVoteResponseDto>(
        API_ENDPOINTS.COMMUNITY.VOTE(postId),
        {},
        { showErrorToast: true }
      );
      return communityMapper.toVoteModel(res.data);
    }
    await delay();
    void postId;
    if (!viewerVoted) {
      viewerVoted = true;
      voteCount += 1;
    }
    return communityMapper.toVoteModel(voteFixture(true, voteCount));
  },

  /** `DELETE /posts/:id/vote` */
  deleteVote: async (
    postId: string
  ): Promise<{ postId: string; voted: boolean; voteCount: number }> => {
    if (!USE_FIXTURES) {
      const res = await api.delete<CommunityVoteResponseDto>(API_ENDPOINTS.COMMUNITY.VOTE(postId), {
        showErrorToast: true,
      });
      return communityMapper.toVoteModel(res.data);
    }
    await delay();
    if (viewerVoted) {
      viewerVoted = false;
      voteCount = Math.max(0, voteCount - 1);
    }
    void postId;
    return communityMapper.toVoteModel(voteFixture(false, voteCount));
  },

  /** `PUT /posts/:id/rating` */
  putRating: async (
    postId: string,
    taste: number,
    difficulty: number
  ): Promise<CommunityRating> => {
    if (!USE_FIXTURES) {
      const res = await api.put<CommunityRatingResponseDto>(
        API_ENDPOINTS.COMMUNITY.RATING(postId),
        { taste, difficulty },
        { showErrorToast: true }
      );
      return communityMapper.toRatingModel(res.data);
    }
    await delay();
    return communityMapper.toRatingModel({
      success: true,
      data: {
        postId,
        rating: { taste, difficulty },
        aggregate: ratingFixture.data?.aggregate ?? null,
      },
      meta: null,
    });
  },

  /** `PUT /posts/:id/bookmark` */
  putBookmark: async (postId: string): Promise<{ postId: string; bookmarked: boolean }> => {
    if (!USE_FIXTURES) {
      const res = await api.put<CommunityBookmarkResponseDto>(
        API_ENDPOINTS.COMMUNITY.BOOKMARK(postId),
        {},
        { showErrorToast: true }
      );
      return communityMapper.toBookmarkModel(res.data);
    }
    await delay();
    void postId;
    viewerBookmarked = true;
    return communityMapper.toBookmarkModel(bookmarkFixture(true));
  },

  /** `DELETE /posts/:id/bookmark` */
  deleteBookmark: async (postId: string): Promise<{ postId: string; bookmarked: boolean }> => {
    if (!USE_FIXTURES) {
      const res = await api.delete<CommunityBookmarkResponseDto>(
        API_ENDPOINTS.COMMUNITY.BOOKMARK(postId),
        { showErrorToast: true }
      );
      return communityMapper.toBookmarkModel(res.data);
    }
    await delay();
    viewerBookmarked = false;
    void postId;
    return communityMapper.toBookmarkModel(bookmarkFixture(false));
  },

  /** `GET /users/me/bookmarks` */
  getBookmarks: async (
    params?: CommunityQueryParams
  ): Promise<PaginationResult<BookmarkedItem>> => {
    if (!USE_FIXTURES) {
      const res = await api.get<CommunityBookmarkListResponseDto>(
        API_ENDPOINTS.COMMUNITY.MY_BOOKMARKS,
        { params, silent: true }
      );
      return communityMapper.toBookmarksList(res.data);
    }
    await delay();
    void params;
    return communityMapper.toBookmarksList({
      success: true,
      data: clone(bookmarksStore),
      meta: { page: 1, limit: 10, total: bookmarksStore.length, totalPages: 1 },
    });
  },
};
