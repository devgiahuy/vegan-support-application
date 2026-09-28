import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';
import { aiVerificationApi } from '../api/ai-verification.api';
import type {
  AdminAiVerificationActionFormData,
  CreateAiVerificationFormData,
} from '../schemas/ai-verification.schema';
import { AI_ARTIFACT_QUERY_KEYS } from './ai-artifact.queries';

/**
 * Hook gửi đánh giá thẩm định & kiểm chứng của Contributor / Admin.
 */
export function useCreateAiVerificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      artifactId,
      data,
    }: {
      artifactId: string;
      data: CreateAiVerificationFormData;
    }) => aiVerificationApi.verify(artifactId, data),
    onSuccess: () => {
      toast.success('Đã gửi đánh giá kiểm chứng chuyên môn thành công!');
      void queryClient.invalidateQueries({
        queryKey: AI_ARTIFACT_QUERY_KEYS.all,
      });
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, 'Không thể gửi kiểm chứng. Vui lòng thử lại.');
      toast.error(message);
    },
  });
}

/**
 * Hook can thiệp quản trị của Admin: Ghi đè (OVERRIDE) hoặc Thu hồi (REVOKE).
 */
export function useAdminAiVerificationActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      verificationId,
      data,
    }: {
      verificationId: string;
      data: AdminAiVerificationActionFormData;
    }) => aiVerificationApi.adminAction(verificationId, data),
    onSuccess: (_, variables) => {
      toast.success(
        variables.data.action === 'OVERRIDE'
          ? 'Đã ghi đè kiểm chứng và cập nhật trạng thái mới thành công.'
          : 'Đã thu hồi bản kiểm chứng thành công.'
      );
      void queryClient.invalidateQueries({
        queryKey: AI_ARTIFACT_QUERY_KEYS.all,
      });
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(
        error,
        'Không thể thực hiện hành động can thiệp quản trị. Vui lòng thử lại.'
      );
      toast.error(message);
    },
  });
}
