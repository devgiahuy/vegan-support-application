'use client';

import React from 'react';
import { toast } from 'sonner';
import { CheckCircle2, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUpdateMealProgramMutation } from '../queries/meal-program.queries';
import type { MealProgram } from '../types/meal-program.model';

interface ProgramConfirmDialogProps {
  program: MealProgram;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProgramConfirmDialog: React.FC<ProgramConfirmDialogProps> = ({
  program,
  open,
  onOpenChange,
}) => {
  const updateMutation = useUpdateMealProgramMutation(program.id);

  const handleConfirm = async () => {
    try {
      await updateMutation.mutateAsync({
        status: 'CONFIRMED',
        version: program.version,
      });

      toast.success(
        'Đã xác nhận tham gia lộ trình! Chúc bạn có một hành trình dinh dưỡng tuyệt vời.'
      );
      onOpenChange(false);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Có lỗi xảy ra khi xác nhận lộ trình. Vui lòng thử lại.';
      toast.error(errorMsg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto sm:mx-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl">Xác nhận tham gia lộ trình</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
            Bạn chuẩn bị chốt thực đơn cho <strong>{program.title}</strong> ({program.horizonWeeks}{' '}
            tuần).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs text-muted-foreground">
          <div className="flex gap-2.5 p-3 rounded-lg bg-muted/50 border">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Hệ thống sẽ lưu <strong>bản chụp dữ liệu tĩnh (Snapshot)</strong> cho từng tuần ăn.
              Lịch sử thực đơn của bạn sẽ được bảo vệ nguyên vẹn kể cả khi công thức gốc có bị tác
              giả chỉnh sửa hay xóa bỏ.
            </p>
          </div>

          <div className="flex gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Sau khi xác nhận, lộ trình sẽ chuyển sang chế độ theo dõi tiến độ hàng ngày. Bạn vẫn
              có thể tùy biến hoặc sinh lại từng tuần lẻ nếu có nhu cầu phát sinh sau này.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Xem lại thêm
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={updateMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xác nhận...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Đồng ý xác nhận
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
