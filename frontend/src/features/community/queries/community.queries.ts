import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorCode, toastApiError } from '@/lib/api-error';
import { communityApi } from '../api/community.api';
import type { CommunityQueryParams } from '../types/community.model';

export const COMMUNITY_KEYS = {
  all: ['community'] as const,
  thread: (postId: string, params?: CommunityQueryParams) =>
    [...COMMUNITY_KEYS.all, 'thread', postId, params ?? {}] as const,
  summary: (postId: string) => [...COMMUNITY_KEYS.all, 'summary', postId] as const,
  bookmarks: (params?: CommunityQueryParams) =>
    [...COMMUNITY_KEYS.all, 'bookmarks', params ?? {}] as const,
};

function invalidatePost(queryClient: ReturnType<typeof useQueryClient>, postId: string) {
  queryClient.invalidateQueries({ queryKey: [...COMMUNITY_KEYS.all, 'thread', postId] });
  queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.summary(postId) });
}

/** Thread bình luận 1 post (fixture ở phase scaffold). */
export function useCommentThreadQuery(postId: string, params?: CommunityQueryParams) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.thread(postId, params),
    queryFn: () => communityApi.getThread({ ...params, postId }),
    staleTime: 30 * 1000,
    enabled: postId.length > 0,
  });
}

/** Tóm tắt aggregate + viewer (fixture). */
export function useCommunitySummaryQuery(postId: string) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.summary(postId),
    queryFn: () => communityApi.getSummary(postId),
    staleTime: 30 * 1000,
    enabled: postId.length > 0,
  });
}

/** Danh sách đã lưu của current user (fixture). */
export function useBookmarksQuery(params?: CommunityQueryParams) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.bookmarks(params),
    queryFn: () => communityApi.getBookmarks(params),
    staleTime: 60 * 1000,
  });
}

/** Gửi bình luận / reply (giữ draft ở form khi lỗi). */
export function useCreateCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { postId: string; content: string; parentId?: string }) =>
      communityApi.createComment(vars.postId, vars.content, vars.parentId),
    onSuccess: (_, vars) => {
      invalidatePost(queryClient, vars.postId);
      toast.success('Đã gửi bình luận.');
    },
    onError: (err: unknown) => {
      if (getApiErrorCode(err) === 'COMMUNITY_RATE_LIMITED') {
        toast.error('Bạn thao tác quá nhanh', {
          description: 'Vui lòng chờ giây lát rồi thử lại.',
        });
        return;
      }
      toastApiError(err, 'Không thể gửi bình luận');
    },
  });
}

/** Sửa bình luận của chính mình. */
export function useUpdateCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { postId: string; commentId: string; content: string }) =>
      communityApi.updateComment(vars.commentId, vars.content),
    onSuccess: (_, vars) => {
      invalidatePost(queryClient, vars.postId);
      toast.success('Đã cập nhật bình luận.');
    },
    onError: (err: unknown) => toastApiError(err, 'Không thể sửa bình luận'),
  });
}

/** Xóa mềm bình luận của chính mình. */
export function useDeleteCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { postId: string; commentId: string }) =>
      communityApi.deleteComment(vars.commentId),
    onSuccess: (_, vars) => {
      invalidatePost(queryClient, vars.postId);
      toast.success('Đã xóa bình luận.');
    },
    onError: (err: unknown) => toastApiError(err, 'Không thể xóa bình luận'),
  });
}

/** Upvote / gỡ (idempotent, optimistic). */
export function useVoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { postId: string; voted: boolean }) =>
      vars.voted ? communityApi.putVote(vars.postId) : communityApi.deleteVote(vars.postId),
    onSuccess: (_, vars) => invalidatePost(queryClient, vars.postId),
    onError: (err: unknown) => {
      if (getApiErrorCode(err) === 'COMMUNITY_RATE_LIMITED') {
        toast.error('Bạn thao tác quá nhanh', {
          description: 'Vui lòng chờ giây lát rồi thử lại.',
        });
        return;
      }
      toastApiError(err, 'Không thể bình chọn');
    },
  });
}

/** Chấm vị + khó cho recipe. */
export function useRatingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { postId: string; taste: number; difficulty: number }) =>
      communityApi.putRating(vars.postId, vars.taste, vars.difficulty),
    onSuccess: (rating) => {
      invalidatePost(queryClient, rating.postId);
      toast.success('Đã ghi nhận đánh giá của bạn.');
    },
    onError: (err: unknown) => toastApiError(err, 'Không thể gửi đánh giá'),
  });
}

/** Lưu / gỡ lưu (recipe/video). */
export function useBookmarkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { postId: string; bookmarked: boolean }) =>
      vars.bookmarked
        ? communityApi.putBookmark(vars.postId)
        : communityApi.deleteBookmark(vars.postId),
    onSuccess: (_, vars) => {
      invalidatePost(queryClient, vars.postId);
      queryClient.invalidateQueries({ queryKey: [...COMMUNITY_KEYS.all, 'bookmarks'] });
      toast.success(vars.bookmarked ? 'Đã lưu.' : 'Đã gỡ lưu.');
    },
    onError: (err: unknown) => toastApiError(err, 'Không thể lưu nội dung'),
  });
}
