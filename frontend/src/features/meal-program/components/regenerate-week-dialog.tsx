'use client';

import React from 'react';
import { toast } from 'sonner';
import { RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRegenerateProgramWeekMutation } from '../queries/meal-program.queries';

interface RegenerateWeekDialogProps {
  programId: string;
  version: number;
  weekNumber: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RegenerateWeekDialog: React.FC<RegenerateWeekDialogProps> = ({
  programId,
  version,
  weekNumber,
  open,
  onOpenChange,
}) => {
  const regenerateMutation = useRegenerateProgramWeekMutation(programId);

  if (weekNumber === null) return null;

  const handleRegenerate = async () => {
    try {
      await regenerateMutation.mutateAsync({
        weekNumber,
        data: {
          version,
        },
      });

      toast.success(`Đã tạo lại thực đơn cho Tuần ${weekNumber} thành công!`);
      onOpenChange(false);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Có lỗi khi tạo lại tuần ăn. Vui lòng thử lại.';
      toast.error(errorMsg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto sm:mx-0">
            <RefreshCw className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl">Tạo lại thực đơn Tuần {weekNumber}</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
            Hệ thống sẽ tái tạo lại danh sách món ăn cho tuần này dựa trên các nguyên tắc ăn chay và
            dinh dưỡng chuẩn.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 text-amber-900 dark:text-amber-200 text-xs flex gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Cơ chế Vô hiệu hóa Hạ lưu (BL-11):</strong> Việc thay đổi thực đơn của Tuần{' '}
            {weekNumber} sẽ làm thay đổi dinh dưỡng tích lũy và danh sách mua sắm của các tuần tiếp
            sau. Hệ thống sẽ tự động gắn cờ yêu cầu phân tích lại cho các tuần sau.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={regenerateMutation.isPending}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerateMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {regenerateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang tạo lại...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Xác nhận tạo lại
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
