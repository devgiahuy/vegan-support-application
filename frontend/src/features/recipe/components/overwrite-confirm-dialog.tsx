'use client';

import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface OverwriteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function OverwriteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: OverwriteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <DialogHeader className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-lg sm:text-xl font-bold text-foreground">
            Thay thế nội dung biểu mẫu hiện tại?
          </DialogTitle>
          <DialogDescription className="text-center text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Biểu mẫu của bạn đã có một số thông tin được nhập trước đó. Việc áp dụng gợi ý từ AI sẽ
            ghi đè tiêu đề, định lượng nguyên liệu và các bước nấu hiện tại.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
          <p className="text-foreground/90">
            💡 Bạn vẫn có toàn quyền chỉnh sửa, thêm/bớt nguyên liệu hoặc các bước sau khi dữ liệu
            AI được nạp vào biểu mẫu.
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2.5 mt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full flex-1"
            onClick={() => onOpenChange(false)}
          >
            Hủy / Giữ nội dung cũ
          </Button>
          <Button
            type="button"
            className="rounded-full flex-1 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            <RefreshCw className="h-4 w-4" /> Xác nhận thay thế
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
