'use client';

import React from 'react';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReanalyzeMealProgramMutation } from '../queries/meal-program.queries';

interface DownstreamInvalidationBannerProps {
  programId: string;
  isInvalidated: boolean;
}

export const DownstreamInvalidationBanner: React.FC<DownstreamInvalidationBannerProps> = ({
  programId,
  isInvalidated,
}) => {
  const reanalyzeMutation = useReanalyzeMealProgramMutation(programId);

  if (!isInvalidated) return null;

  const handleReanalyze = async () => {
    try {
      await reanalyzeMutation.mutateAsync();
      toast.success('Đã tính toán lại dữ liệu phân tích dinh dưỡng tích lũy!');
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Có lỗi khi phân tích lại. Vui lòng thử lại sau.';
      toast.error(errorMsg);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">
            Dữ liệu phân tích dinh dưỡng tích lũy cần được cập nhật
          </p>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
            Một tuần trong lộ trình vừa được chỉnh sửa hoặc tạo lại, khiến kết quả phân tích tích
            lũy và dự phóng mua sắm của các tuần tiếp sau không còn đồng bộ.
          </p>
        </div>
      </div>

      <Button
        size="sm"
        onClick={handleReanalyze}
        disabled={reanalyzeMutation.isPending}
        className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 self-end sm:self-center h-8 text-xs font-medium"
      >
        {reanalyzeMutation.isPending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Đang cập nhật...
          </>
        ) : (
          <>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Cập nhật phân tích ngay
          </>
        )}
      </Button>
    </div>
  );
};
