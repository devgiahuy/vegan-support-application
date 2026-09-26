import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '../api/community.api';
import type { CommunityQueryParams } from '../types/community.model';

export const COMMUNITY_QUERY_KEYS = {
  all: ['community'] as const,
  thread: (postId: string, params?: CommunityQueryParams) =>
    [...COMMUNITY_QUERY_KEYS.all, 'thread', postId, params ?? {}] as const,
  summary: (postId: string) => [...COMMUNITY_QUERY_KEYS.all, 'summary', postId] as const,
  bookmarks: (params?: { page?: number; limit?: number; type?: 'RECIPE' | 'VIDEO' }) =>
    [...COMMUNITY_QUERY_KEYS.all, 'bookmarks', params ?? {}] as const,
};

function invalidatePost(queryClient: ReturnType<typeof useQueryClient>, postId: string) {
  void queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.summary(postId) });
  void queryClient.invalidateQueries({ queryKey: [...COMMUNITY_QUERY_KEYS.all, 'thread', postId] });
}

export function useCommunitySummaryQuery(postId: string) {
  return useQuery({
    queryKey: COMMUNITY_QUERY_KEYS.summary(postId),
    queryFn: () => communityApi.getSummary(postId),
    enabled: postId.length > 0,
    staleTime: 30 * 1000,
  });
}

export function useCommentThreadQuery(postId: string, params?: CommunityQueryParams) {
  return useQuery({
    queryKey: COMMUNITY_QUERY_KEYS.thread(postId, params),
    queryFn: () => communityApi.getThread({ ...params, postId }),
    enabled: postId.length > 0,
    staleTime: 30 * 1000,
  });
}

export function useCreateCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { postId: string; content: string; parentId?: string }) =>
      communityApi.createComment(vars.postId, vars.content, vars.parentId),
    onSuccess: (_, vars) => invalidatePost(queryClient, vars.postId),
  });
}

/** Sửa bình luận của chính mình — `postId` chỉ dùng để invalidate cache đúng thread. */
export function useUpdateCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { commentId: string; postId: string; content: string }) =>
      communityApi.updateComment(vars.commentId, vars.content),
    onSuccess: (_, vars) => invalidatePost(queryClient, vars.postId),
  });
}

/** Xoá (ẩn mềm) bình luận của chính mình. */
export function useDeleteCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { commentId: string; postId: string }) => communityApi.deleteComment(vars.commentId),
    onSuccess: (_, vars) => invalidatePost(queryClient, vars.postId),
  });
}

export function useVoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { postId: string; voted: boolean }) =>
      vars.voted ? communityApi.putVote(vars.postId) : communityApi.deleteVote(vars.postId),
    onSuccess: (_, vars) => invalidatePost(queryClient, vars.postId),
  });
}

export function useBookmarkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { postId: string; bookmarked: boolean }) =>
      vars.bookmarked ? communityApi.putBookmark(vars.postId) : communityApi.deleteBookmark(vars.postId),
    onSuccess: (_, vars) => {
      invalidatePost(queryClient, vars.postId);
      void queryClient.invalidateQueries({ queryKey: [...COMMUNITY_QUERY_KEYS.all, 'bookmarks'] });
    },
  });
}

/** Đánh giá khẩu vị/độ khó — chỉ Recipe. */
export function useRatingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { postId: string; taste: number; difficulty: number }) =>
      communityApi.putRating(vars.postId, vars.taste, vars.difficulty),
    onSuccess: (_, vars) => invalidatePost(queryClient, vars.postId),
  });
}

/** `GET /users/me/bookmarks` — màn "Đã lưu" ở Hồ sơ. */
export function useMyBookmarksQuery(params?: { page?: number; limit?: number; type?: 'RECIPE' | 'VIDEO' }) {
  return useQuery({
    queryKey: COMMUNITY_QUERY_KEYS.bookmarks(params),
    queryFn: () => communityApi.getMyBookmarks(params),
    staleTime: 30 * 1000,
  });
}
