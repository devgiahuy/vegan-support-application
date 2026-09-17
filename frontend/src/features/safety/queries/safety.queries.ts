import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorCode, toastApiError } from '@/lib/api-error';
import { safetyApi } from '../api/safety.api';
import { RECOMMENDATION_KEYS } from '@/features/recommendation/queries/recommendation.queries';
import type { ReportReasonCode, ReportTargetKind } from '@/common/enums';

export const SAFETY_KEYS = {
  all: ['safety'] as const,
  reports: () => [...SAFETY_KEYS.all, 'reports'] as const,
};

/** Gửi báo cáo vi phạm (fixture ở phase scaffold). */
export function useSubmitReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      targetKind: ReportTargetKind;
      targetId: string;
      reasonCode: ReportReasonCode;
      details?: string;
    }) => safetyApi.submitReport(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAFETY_KEYS.reports() });
      toast.success('Đã ghi nhận báo cáo.', {
        description: 'Đội kiểm duyệt sẽ xem xét trong thời gian sớm nhất.',
      });
    },
    onError: (err: unknown) => {
      const code = getApiErrorCode(err);
      if (code === 'SELF_REPORT_FORBIDDEN') {
        toast.error('Không thể báo cáo nội dung của chính mình.');
        return;
      }
      if (code === 'DUPLICATE_ACTIVE_REPORT') {
        toast.error('Báo cáo đang mở', { description: 'Bạn đã báo cáo mục này, hãy chờ xử lý.' });
        return;
      }
      toastApiError(err, 'Không thể gửi báo cáo');
    },
  });
}

/** Xóa toàn bộ lịch sử hành vi (fixture). Xong thì cold-start gợi ý. */
export function useDeleteBehaviorHistoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => safetyApi.deleteBehaviorHistory(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: RECOMMENDATION_KEYS.all });
      toast.success('Đã xóa lịch sử hành vi.', {
        description:
          result.deletedCount > 0
            ? `Đã xóa ${result.deletedCount} bản ghi. Gợi ý chuyển sang chế độ phổ biến.`
            : 'Tài khoản chưa có lịch sử nào được ghi nhận.',
      });
    },
    onError: (err: unknown) => toastApiError(err, 'Không thể xóa lịch sử'),
  });
}
