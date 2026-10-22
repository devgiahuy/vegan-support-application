import { billingErrorMessage } from '@/features/billing/lib/billing-errors';
import { useEffect } from 'react';
import { BILLING_QUERY_KEYS } from '@/features/billing/queries/billing.queries';
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { receiptApi } from '../api/receipt.api';
import type {
  ConfirmReceiptJobInput,
  CreateReceiptJobInput,
  ReceiptConfirmationDiff,
  ReceiptJob,
  UpdateReceiptCandidateInput,
} from '../types/receipt.model';
import { PANTRY_QUERY_KEYS } from '@/features/pantry/queries/pantry.queries';

export const RECEIPT_QUERY_KEYS = {
  all: ['receipt-jobs'] as const,
  jobs: () => [...RECEIPT_QUERY_KEYS.all, 'jobs'] as const,
  jobDetail: (id: string) => [...RECEIPT_QUERY_KEYS.jobs(), 'detail', id] as const,
};

/**
 * Hook truy vấn chi tiết tác vụ bóc tách hóa đơn với polling tự động
 */
export function useReceiptJobQuery(
  jobId: string | null | undefined,
  options?: Omit<UseQueryOptions<ReceiptJob, Error, ReceiptJob>, 'queryKey' | 'queryFn'>
) {
  const allowanceClient = useQueryClient();
  const result = useQuery({
    queryKey: RECEIPT_QUERY_KEYS.jobDetail(jobId || ''),
    queryFn: () => {
      if (!jobId) throw new Error('ID tác vụ hóa đơn không hợp lệ');
      return receiptApi.getJob(jobId);
    },
    enabled: Boolean(jobId) && (options?.enabled ?? true),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'QUEUED' || data.status === 'PROCESSING')) {
        return 2000; // Polling 2s/lần khi AI đang OCR bóc tách
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
 * Mutation khởi tạo tác vụ bóc tách hóa đơn
 */
export function useCreateReceiptJobMutation() {
  const queryClient = useQueryClient();

  return useMutation<ReceiptJob, Error, CreateReceiptJobInput>({
    mutationFn: (input) => receiptApi.createJob(input),
    onSuccess: (newJob) => {
      void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
      queryClient.setQueryData(RECEIPT_QUERY_KEYS.jobDetail(newJob.id), newJob);
      toast.success('Bắt đầu bóc tách hóa đơn thành công!');
    },
  });
}

/**
 * Mutation chỉnh sửa ứng viên dòng hàng hoặc loại bỏ
 */
export function useUpdateReceiptCandidateMutation(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    ReceiptJob,
    Error,
    { candidateId: string; input: UpdateReceiptCandidateInput }
  >({
    mutationFn: ({ candidateId, input }) => receiptApi.updateCandidate(jobId, candidateId, input),
    onSuccess: (updatedJob) => {
      void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
      queryClient.setQueryData(RECEIPT_QUERY_KEYS.jobDetail(jobId), updatedJob);
      toast.success('Cập nhật dòng hàng thành công!');
    },
    onError: (error: unknown) => {
      toast.error(billingErrorMessage(error));
    },
  });
}

/**
 * Mutation xác nhận nhập các dòng hàng đã chọn vào Tủ bếp
 */
export function useConfirmReceiptJobMutation(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation<ReceiptConfirmationDiff, Error, ConfirmReceiptJobInput>({
    mutationFn: (input) => receiptApi.confirmJob(jobId, input),
    onSuccess: (diff) => {
      // Cập nhật cache job detail
      void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
      queryClient.setQueryData(RECEIPT_QUERY_KEYS.jobDetail(jobId), diff.job);
      // Invalidate toàn bộ cache Tủ bếp để số dư cập nhật tức thì
      queryClient.invalidateQueries({ queryKey: PANTRY_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
      toast.success(`Đã thêm ${diff.pantryChanges.length} mặt hàng vào Tủ bếp thành công!`);
    },
    onError: (error: unknown) => {
      toast.error(billingErrorMessage(error));
    },
  });
}

/**
 * Mutation hủy bỏ tác vụ hóa đơn
 */
export function useCancelReceiptJobMutation(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation<ReceiptJob, Error, void>({
    mutationFn: () => receiptApi.cancelJob(jobId),
    onSuccess: (updatedJob) => {
      void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
      queryClient.setQueryData(RECEIPT_QUERY_KEYS.jobDetail(jobId), updatedJob);
      toast.info('Đã hủy tác vụ bóc tách hóa đơn.');
    },
    onError: (error: unknown) => {
      toast.error(billingErrorMessage(error));
    },
  });
}

/**
 * Mutation thử lại tác vụ bóc tách khi bị lỗi
 */
export function useRetryReceiptJobMutation(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation<ReceiptJob, Error, string | undefined>({
    mutationFn: (idempotencyKey) => receiptApi.retryJob(jobId, idempotencyKey),
    onSuccess: (updatedJob) => {
      void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
      queryClient.setQueryData(RECEIPT_QUERY_KEYS.jobDetail(jobId), updatedJob);
      toast.info('Đang gửi lại yêu cầu bóc tách...');
    },
    onError: (error: unknown) => {
      toast.error(billingErrorMessage(error));
    },
  });
}

/**
 * Mutation bổ sung ảnh vào tác vụ bóc tách hóa đơn
 */
export function useAddReceiptImagesMutation(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation<ReceiptJob, Error, { imageAssetIds: string[] }>({
    mutationFn: (payload) => receiptApi.addImages(jobId, payload),
    onSuccess: (updatedJob) => {
      queryClient.setQueryData(RECEIPT_QUERY_KEYS.jobDetail(jobId), updatedJob);
      void queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.jobDetail(jobId) });
      toast.success('Đã thêm ảnh bổ sung, đang tiến hành phân tích...');
    },
    onError: (error: unknown) => {
      toast.error(billingErrorMessage(error));
    },
  });
}
