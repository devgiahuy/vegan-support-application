import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastApiError } from '@/lib/api-error';
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
 * Hook tạo mới video
 */
export function useCreateVideoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (video: Partial<Video>) => videoApi.createVideo(video),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEYS.lists() });
      toast.success('Đã tải lên video thành công!', {
        description:
          data.status === 'PUBLISHED'
            ? 'Video của bạn đã được xuất bản công khai.'
            : 'Video đã được gửi vào hàng chờ duyệt.',
      });
    },
    onError: (err: unknown) => {
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
