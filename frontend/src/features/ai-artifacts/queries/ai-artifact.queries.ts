import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';
import { aiArtifactApi } from '../api/ai-artifact.api';
import type {
  CreateAiArtifactFormData,
  SubmitAiArtifactFormData,
  UpdateAiArtifactVisibilityFormData,
} from '../schemas/ai-artifact.schema';
import type { AiArtifact, PublicAiArtifactsQuery } from '../types/ai-artifact.model';

export const AI_ARTIFACT_QUERY_KEYS = {
  all: ['ai-artifacts'] as const,
  publicLists: () => [...AI_ARTIFACT_QUERY_KEYS.all, 'public'] as const,
  publicList: (query?: PublicAiArtifactsQuery) =>
    [...AI_ARTIFACT_QUERY_KEYS.publicLists(), query ?? {}] as const,
  details: () => [...AI_ARTIFACT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...AI_ARTIFACT_QUERY_KEYS.details(), id] as const,
};

/**
 * Hook truy vấn danh sách AI Artifacts công khai theo bộ lọc và phân trang.
 */
export function usePublicAiArtifactsQuery(query?: PublicAiArtifactsQuery) {
  return useQuery({
    queryKey: AI_ARTIFACT_QUERY_KEYS.publicList(query),
    queryFn: () => aiArtifactApi.listPublic(query),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook lưu kết quả phân tích AI thành AI Artifact bất biến.
 */
export function useCreateAiArtifactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAiArtifactFormData) => aiArtifactApi.create(data),
    onSuccess: (createdArtifact: AiArtifact) => {
      toast.success('Đã lưu tri thức AI thành công!');
      void queryClient.invalidateQueries({
        queryKey: AI_ARTIFACT_QUERY_KEYS.all,
      });
      return createdArtifact;
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, 'Không thể lưu tri thức AI. Vui lòng thử lại.');
      toast.error(message);
    },
  });
}

/**
 * Hook cập nhật chế độ hiển thị (PUBLIC / PRIVATE).
 */
export function useUpdateAiArtifactVisibilityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAiArtifactVisibilityFormData }) =>
      aiArtifactApi.updateVisibility(id, data),
    onSuccess: (updatedArtifact: AiArtifact) => {
      toast.success(
        updatedArtifact.isPublic
          ? 'Đã bật chia sẻ công khai.'
          : 'Đã thu hồi quyền chia sẻ về riêng tư.'
      );
      void queryClient.invalidateQueries({
        queryKey: AI_ARTIFACT_QUERY_KEYS.all,
      });
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(
        error,
        'Không thể cập nhật quyền chia sẻ. Vui lòng thử lại.'
      );
      toast.error(message);
    },
  });
}

/**
 * Hook gửi artifact để Người đóng góp (Contributor) thẩm định.
 */
export function useSubmitAiArtifactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubmitAiArtifactFormData }) =>
      aiArtifactApi.submit(id, data),
    onSuccess: () => {
      toast.success('Đã gửi bài thẩm định tới cộng đồng Người đóng góp thành công!');
      void queryClient.invalidateQueries({
        queryKey: AI_ARTIFACT_QUERY_KEYS.all,
      });
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, 'Không thể gửi thẩm định. Vui lòng thử lại.');
      toast.error(message);
    },
  });
}
