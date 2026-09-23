'use client';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface VersionConflictModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReload: () => void;
}

export const VersionConflictModal: React.FC<VersionConflictModalProps> = ({
  open,
  onOpenChange,
  onReload,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto sm:mx-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl">Xung đột dữ liệu lộ trình</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
            Lộ trình này đã được chỉnh sửa hoặc cập nhật từ một thiết bị hoặc phiên làm việc khác.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground leading-relaxed">
          Để đảm bảo tính nhất quán và không ghi đè mất mát dữ liệu, vui lòng tải lại trang để nạp
          phiên bản mới nhất của lộ trình.
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onReload();
            }}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Tải lại dữ liệu mới nhất
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
