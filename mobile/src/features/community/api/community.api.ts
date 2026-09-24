import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { communityMapper } from '../mappers/community.mapper';
import type {
  BookmarkListResponseDto,
  CommunityBookmarkResponseDto,
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
  CommunitySummary,
} from '../types/community.model';
import type { PaginationResult } from '@/types/api';

export const communityApi = {
  getThread: async (params: CommunityQueryParams & { postId: string }): Promise<PaginationResult<CommunityComment>> => {
    const res = await api.get<CommunityCommentListResponseDto>(API_ENDPOINTS.COMMUNITY.COMMENTS(params.postId), {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        order: params.order ?? 'oldest',
      },
      silent: true,
    });
    return communityMapper.toThreadModel(res.data);
  },

  createComment: async (postId: string, content: string, parentId?: string): Promise<CommunityComment> => {
    const res = await api.post<CommunityCommentResponseDto>(
      API_ENDPOINTS.COMMUNITY.COMMENTS(postId),
      { content, ...(parentId ? { parentId } : {}) },
      { silent: true }
    );
    return communityMapper.toSingleComment(res.data);
  },

  getSummary: async (postId: string): Promise<CommunitySummary> => {
    const res = await api.get<CommunitySummaryResponseDto>(API_ENDPOINTS.COMMUNITY.SUMMARY(postId), {
      silent: true,
    });
    return communityMapper.toSummaryModel(res.data);
  },

  putVote: async (postId: string) => {
    const res = await api.put<CommunityVoteResponseDto>(API_ENDPOINTS.COMMUNITY.VOTE(postId), {}, { silent: true });
    return communityMapper.toVoteModel(res.data);
  },

  deleteVote: async (postId: string) => {
    const res = await api.delete<CommunityVoteResponseDto>(API_ENDPOINTS.COMMUNITY.VOTE(postId), { silent: true });
    return communityMapper.toVoteModel(res.data);
  },

  putBookmark: async (postId: string) => {
    const res = await api.put<CommunityBookmarkResponseDto>(
      API_ENDPOINTS.COMMUNITY.BOOKMARK(postId),
      {},
      { silent: true }
    );
    return communityMapper.toBookmarkModel(res.data);
  },

  deleteBookmark: async (postId: string) => {
    const res = await api.delete<CommunityBookmarkResponseDto>(API_ENDPOINTS.COMMUNITY.BOOKMARK(postId), {
      silent: true,
    });
    return communityMapper.toBookmarkModel(res.data);
  },

  /** `PUT /posts/:id/rating` — chỉ Recipe (taste/difficulty 1-5). */
  putRating: async (postId: string, taste: number, difficulty: number) => {
    const res = await api.put<CommunityRatingResponseDto>(
      API_ENDPOINTS.COMMUNITY.RATING(postId),
      { taste, difficulty },
      { silent: true }
    );
    return communityMapper.toRatingResultModel(res.data);
  },

  /** `GET /users/me/bookmarks` — danh sách Recipe/Video đã lưu của user hiện tại. */
  getMyBookmarks: async (params?: {
    page?: number;
    limit?: number;
    type?: 'RECIPE' | 'VIDEO';
  }): Promise<PaginationResult<BookmarkedItem>> => {
    const res = await api.get<BookmarkListResponseDto>(API_ENDPOINTS.COMMUNITY.MY_BOOKMARKS, {
      params: { page: params?.page ?? 1, limit: params?.limit ?? 20, type: params?.type },
    });
    return communityMapper.toBookmarkListModel(res.data);
  },
};
