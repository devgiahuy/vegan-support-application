import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getNextPageNumber } from '@/lib/pagination';
import {
  videoApi,
  type CreateVideoInput,
  type UpdateVideoInput,
  type VideoQueryParams,
} from '../api/video.api';

export const VIDEO_QUERY_KEYS = {
  all: ['videos'] as const,
  list: (params?: VideoQueryParams) => [...VIDEO_QUERY_KEYS.all, 'list', params] as const,
  detail: (idOrSlug: string) => [...VIDEO_QUERY_KEYS.all, 'detail', idOrSlug] as const,
  related: (id: string) => [...VIDEO_QUERY_KEYS.all, 'related', id] as const,
};

export function useVideosQuery(params?: VideoQueryParams) {
  return useQuery({
    queryKey: VIDEO_QUERY_KEYS.list(params),
    queryFn: () => videoApi.getVideos(params),
    staleTime: 60 * 1000,
  });
}

/** Danh sách video phân trang kiểu "Tải thêm" (màn Video). `params` không chứa `page`. */
export function useInfiniteVideosQuery(params?: Omit<VideoQueryParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: [...VIDEO_QUERY_KEYS.all, 'infinite', params ?? {}] as const,
    queryFn: ({ pageParam }) => videoApi.getVideos({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: getNextPageNumber,
    staleTime: 60 * 1000,
  });
}

export function useVideoDetailQuery(idOrSlug: string) {
  return useQuery({
    queryKey: VIDEO_QUERY_KEYS.detail(idOrSlug),
    queryFn: () => videoApi.getVideoDetail(idOrSlug),
    enabled: Boolean(idOrSlug),
    staleTime: 60 * 1000,
  });
}

export function useRelatedVideosQuery(id: string) {
  return useQuery({
    queryKey: VIDEO_QUERY_KEYS.related(id),
    queryFn: () => videoApi.getRelatedVideos(id),
    enabled: id.length > 0,
    staleTime: 60 * 1000,
  });
}

export function useCreateVideoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateVideoInput) => videoApi.createVideo(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEYS.all });
    },
  });
}

export function useUpdateVideoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; input: UpdateVideoInput }) => videoApi.updateVideo(vars.id, vars.input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VIDEO_QUERY_KEYS.all });
    },
  });
}
