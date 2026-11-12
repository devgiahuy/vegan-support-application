import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage, toastApiError } from '@/lib/api-error';
import { PostStatus } from '@/common/enums';
import { getPostStatusLabel, parsePostStatus } from '@/features/post/mappers/post.mapper';
import { POST_QUERY_KEYS } from '@/features/post/queries/post.queries';
import { reviewApi } from '@/features/review/api/review.api';
import { CONTENT_REVIEW_KEYS } from '@/features/review/queries/review.queries';
import type { SubmitPostResult } from '@/features/review/types/content-review.model';
import { videoApi, VideoQueryParams } from '../api/video.api';
import type { Video } from '../types/video.model';

export const VIDEO_QUERY_KEYS = {
  all: ['videos'] as const,
  lists: () => [...VIDEO_QUERY_KEYS.all, 'list'] as const,
  list: (params?: VideoQueryParams) => [...VIDEO_QUERY_KEYS.lists(), params] as const,
  details: () => [...VIDEO_QUERY_KEYS.all, 'detail'] as const,
  detail: (idOrSlug: string) => [...VIDEO_QUERY_KEYS.details(), idOrSlug] as const,
};

/**
 * Hook truy vấn danh sách video hướng dẫn nấu chay
 */
export function useVideosQuery(params?: VideoQueryParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: VIDEO_QUERY_KEYS.list(params),
    queryFn: () => videoApi.getVideos(params),
    staleTime: 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook truy vấn chi tiết một video
 */
export function useVideoDetailQuery(idOrSlug: string) {
  return useQuery({
    queryKey: VIDEO_QUERY_KEYS.detail(idOrSlug),
    queryFn: () => videoApi.getVideoDetail(idOrSlug),
    enabled: Boolean(idOrSlug),
    staleTime: 60 * 1000,
  });
}

/**
 * Lưu xong nhưng gửi xuất bản / kiểm duyệt thất bại: video vẫn được lưu ở dạng bản nháp.
 */
export class VideoSubmitForReviewError extends Error {
  constructor(
    readonly video: Video,
    readonly reason: unknown
  ) {
    super(
      `Đã lưu bản nháp video nhưng chưa gửi xuất bản được: ${getApiErrorMessage(reason, 'vui lòng thử gửi lại.')}`
    );
    this.name = 'VideoSubmitForReviewError';
  }
}

/** Backend luôn lưu revision mới ở dạng DRAFT; gửi/xuất bản ngay bằng `POST /posts/:id/submit`. */
export async function submitSavedVideo(saved: Video): Promise<Video> {
  const expectedVersion = saved.version ?? saved.revisionVersion;
  let submitted: SubmitPostResult;
  try {
    if (!saved.id || !saved.revisionId || expectedVersion === undefined) {
      throw new Error('Phản hồi lưu video thiếu thông tin phiên bản.');
    }
    submitted = await reviewApi.submitPost(saved.id, {
      revisionId: saved.revisionId,
      expectedVersion,
    });
  } catch (err) {
    throw new VideoSubmitForReviewError(saved, err);
  }

  const nextPostStatus = parsePostStatus(submitted.postStatus);
  const nextRevisionStatus = parsePostStatus(submitted.revisionStatus);

  return {
    ...saved,
    status: nextPostStatus,
    statusLabel: getPostStatusLabel(nextPostStatus),
    version: submitted.version || saved.version,
    revisionId: submitted.revisionId || saved.revisionId,
    revisionVersion: submitted.revisionVersion || saved.revisionVersion,
    revisionStatus: nextRevisionStatus,
    publishedRevisionVersion: submitted.publishedRevisionVersion ?? saved.publishedRevisionVersion,
    publishedAt: submitted.publishedAt ?? saved.publishedAt,
    formattedPublishedAt: submitted.publishedAt
      ? submitted.formattedPublishedAt
      : saved.formattedPublishedAt,
  };
}

/**
 * Hook tạo mới video (chỉ lưu bản nháp DRAFT)
 */
export function useCreateVideoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (video: Partial<Video>) => videoApi.createVideo(video),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.mineRoot() });
      toast.success('Đã lưu bản nháp video!', {
        description: 'Bạn có thể gửi xuất bản hoặc kiểm duyệt từ trang chi tiết video.',
      });
    },
    onError: (err: unknown) => {
      toastApiError(err, 'Không thể tạo video', 'Vui lòng kiểm tra lại thông tin.');
    },
  });
}

/**
 * Hook tạo video rồi nộp xuất bản / kiểm duyệt ngay (`POST /posts` -> `POST /posts/:id/submit`).
 */
export function useCreateAndSubmitVideoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (video: Partial<Video>) =>
      submitSavedVideo(await videoApi.createVideo(video)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: CONTENT_REVIEW_KEYS.all });
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.mineRoot() });

      const effectiveStatus = data.revisionStatus ?? data.status;
      if (effectiveStatus === PostStatus.PUBLISHED) {
        toast.success('Đã xuất bản video công khai!', {
          description: 'Video của bạn đã được duyệt tự động và hiển thị trong kho Video.',
        });
      } else if (
        effectiveStatus === PostStatus.FLAGGED ||
        effectiveStatus === PostStatus.QUARANTINED
      ) {
        toast.warning('Video cần được kiểm duyệt bổ sung', {
          description: 'Hệ thống đã chuyển video tới Quản trị viên để rà soát trước khi công khai.',
        });
      } else {
        toast.success('Đăng tải video thành công!', {
          description: 'Video đã được gửi vào hàng chờ kiểm duyệt trước khi xuất bản.',
        });
      }
    },
    onError: (err: unknown) => {
      if (err instanceof VideoSubmitForReviewError) {
        queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEYS.detail(err.video.id) });
        queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.mineRoot() });
        toast.warning('Video đã được lưu nháp nhưng chưa gửi xuất bản được', {
          description: getApiErrorMessage(
            err.reason,
            'Bạn có thể gửi lại từ trang chi tiết video.'
          ),
        });
        return;
      }
      toastApiError(err, 'Không thể tạo video', 'Vui lòng kiểm tra lại thông tin.');
    },
  });
}

/**
 * Hook cập nhật video
 */
export function useUpdateVideoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, video }: { id: string; video: Partial<Video> }) =>
      videoApi.updateVideo(id, video),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEYS.lists() });
      toast.success('Đã cập nhật video thành công!');
    },
    onError: (err: unknown) => {
      toastApiError(err, 'Lỗi khi cập nhật video');
    },
  });
}

/**
 * Hook xóa video (backend yêu cầu `expectedVersion`)
 */
export function useDeleteVideoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, expectedVersion }: { id: string; expectedVersion?: number }) =>
      videoApi.deleteVideo(id, expectedVersion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEYS.lists() });
      toast.success('Đã xóa video thành công.');
    },
    onError: (err: unknown) => {
      toastApiError(err, 'Không thể xóa video');
    },
  });
}
