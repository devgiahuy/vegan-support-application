import { useEffect } from 'react';
import { billingErrorMessage } from '@/features/billing/lib/billing-errors';
import { BILLING_QUERY_KEYS } from '@/features/billing/queries/billing.queries';
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ingredientRecognitionApi } from '../api/ingredient-recognition.api';
import type { RecognitionJob, UpdateCandidateInput } from '../types/ingredient-recognition.model';
import { PANTRY_QUERY_KEYS } from '@/features/pantry/queries/pantry.queries';

export const INGREDIENT_RECOGNITION_QUERY_KEYS = {
  all: ['ingredient-recognition'] as const,
  jobs: () => [...INGREDIENT_RECOGNITION_QUERY_KEYS.all, 'jobs'] as const,
  jobDetail: (id: string) => [...INGREDIENT_RECOGNITION_QUERY_KEYS.jobs(), 'detail', id] as const,
};

/**
 * Hook truy vấn chi tiết tác vụ nhận diện thực phẩm tủ lạnh với polling tự động
 */
export function useRecognitionJobQuery(
  jobId: string | null | undefined,
  options?: Omit<UseQueryOptions<RecognitionJob, Error, RecognitionJob>, 'queryKey' | 'queryFn'>
) {
  const allowanceClient = useQueryClient();
  const result = useQuery({
    queryKey: INGREDIENT_RECOGNITION_QUERY_KEYS.jobDetail(jobId || ''),
    queryFn: () => {
      if (!jobId) throw new Error('ID tác vụ không hợp lệ');
      return ingredientRecognitionApi.getJob(jobId);
    },
    enabled: Boolean(jobId) && (options?.enabled ?? true),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'QUEUED' || data.status === 'PROCESSING')) {
        return 2000; // Polling 2s/lần khi đang phân tích
      }
      return false;
    },
    ...options,
  });
  const status = result.data?.status;
  const resultId = result.data?.id;
  useEffect(() => {
    if (status && !['QUEUED', 'PROCESSING'].includes(status))
      void allowanceClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
  }, [status, resultId, allowanceClient]);
  return result;
}

/**
 * Mutation khởi tạo tác vụ nhận diện mới
 */
export function useCreateRecognitionJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      imageAssetIds,
      idempotencyKey,
    }: {
      imageAssetIds: string[];
      idempotencyKey?: string;
    }) => ingredientRecognitionApi.createJob(imageAssetIds, idempotencyKey),
    onSuccess: (job) => {
      void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
      queryClient.setQueryData(INGREDIENT_RECOGNITION_QUERY_KEYS.jobDetail(job.id), job);
    },
  });
}

/**
 * Mutation cập nhật thông tin hoặc loại bỏ ứng viên
 */
export function useUpdateCandidateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      candidateId,
      input,
    }: {
      jobId: string;
      candidateId: string;
      input: UpdateCandidateInput;
    }) => ingredientRecognitionApi.updateCandidate(jobId, candidateId, input),
    onSuccess: (updatedJob) => {
      void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
      queryClient.setQueryData(
        INGREDIENT_RECOGNITION_QUERY_KEYS.jobDetail(updatedJob.id),
        updatedJob
      );
      toast.success('Đã cập nhật thông tin nguyên liệu');
    },
  });
}

/**
 * Mutation xác nhận ứng viên và áp dụng diff vào Tủ bếp
 */
export function useConfirmRecognitionJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      candidates,
      idempotencyKey,
    }: {
      jobId: string;
      candidates: { id: string; expectedVersion: number }[];
      idempotencyKey?: string;
    }) => ingredientRecognitionApi.confirmJob(jobId, candidates, idempotencyKey),
    onSuccess: (diff) => {
      // Cập nhật chi tiết job đã hoàn tất
      void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
      queryClient.setQueryData(INGREDIENT_RECOGNITION_QUERY_KEYS.jobDetail(diff.job.id), diff.job);
      // Invalidate toàn bộ cache của Tủ bếp để đồng bộ ngay lập tức
      queryClient.invalidateQueries({ queryKey: PANTRY_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
      toast.success(`Đã thêm ${diff.pantryChanges.length} nguyên liệu vào Tủ bếp gia đình!`);
    },
  });
}

/**
 * Mutation hủy bỏ tác vụ nhận diện
 */
export function useCancelRecognitionJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => ingredientRecognitionApi.cancelJob(jobId),
    onSuccess: (cancelledJob) => {
      void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
      queryClient.setQueryData(
        INGREDIENT_RECOGNITION_QUERY_KEYS.jobDetail(cancelledJob.id),
        cancelledJob
      );
      toast.info('Đã hủy tác vụ nhận diện tủ lạnh');
    },
  });
}

/**
 * Mutation thử lại tác vụ nhận diện khi lỗi
 */
export function useRetryRecognitionJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, idempotencyKey }: { jobId: string; idempotencyKey?: string }) =>
      ingredientRecognitionApi.retryJob(jobId, idempotencyKey),
    onSuccess: (retriedJob) => {
      void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
      queryClient.setQueryData(
        INGREDIENT_RECOGNITION_QUERY_KEYS.jobDetail(retriedJob.id),
        retriedJob
      );
      toast.info('Đã xếp hàng thử lại nhận diện hình ảnh');
    },
  });
}

/**
 * Mutation bổ sung ảnh vào tác vụ nhận diện thực phẩm tủ lạnh
 */
export function useAddFridgeImagesMutation(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { imageAssetIds: string[] }) =>
      ingredientRecognitionApi.addImages(jobId, payload),
    onSuccess: (updatedJob) => {
      queryClient.setQueryData(
        INGREDIENT_RECOGNITION_QUERY_KEYS.jobDetail(updatedJob.id),
        updatedJob
      );
      void queryClient.invalidateQueries({
        queryKey: INGREDIENT_RECOGNITION_QUERY_KEYS.jobDetail(updatedJob.id),
      });
      toast.success('Đã thêm ảnh bổ sung, đang phân tích...');
    },
    onError: (error: unknown) => {
      toast.error(billingErrorMessage(error));
    },
  });
}
