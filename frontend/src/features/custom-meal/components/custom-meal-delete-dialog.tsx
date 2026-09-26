'use client';

import React from 'react';
import { AlertTriangle, Calendar, Trash2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CustomMealDeleteCheckResult } from '../types/custom-meal.model';

interface CustomMealDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealName: string;
  onConfirmDelete: () => Promise<void>;
  isDeleting?: boolean;
  deleteCheckResult?: CustomMealDeleteCheckResult | null;
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: 'Bữa sáng',
  LUNCH: 'Bữa trưa',
  DINNER: 'Bữa tối',
  SNACK: 'Bữa phụ',
};

export const CustomMealDeleteDialog: React.FC<CustomMealDeleteDialogProps> = ({
  open,
  onOpenChange,
  mealName,
  onConfirmDelete,
  isDeleting = false,
  deleteCheckResult,
}) => {
  const isInUse = deleteCheckResult ? !deleteCheckResult.canDelete : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {isInUse ? (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            ) : (
              <Trash2 className="w-5 h-5 text-destructive" />
            )}
            {isInUse ? 'Không thể xóa món ăn' : 'Xác nhận xóa món ăn'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            {isInUse ? (
              <span>
                Món ăn <strong className="text-foreground">"{mealName}"</strong> đang được sử dụng
                trong các thực đơn tuần. Để bảo vệ tính toàn vẹn dữ liệu thực đơn, bạn cần gỡ món ăn
                này khỏi thực đơn trước khi thực hiện xóa.
              </span>
            ) : (
              <span>
                Bạn có chắc chắn muốn xóa món ăn{' '}
                <strong className="text-foreground">"{mealName}"</strong>? Thao tác này sẽ xóa vĩnh
                viễn thông tin món ăn và giải phóng dung lượng ảnh liên quan.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Danh sách thực đơn tuần đang sử dụng món này */}
        {isInUse && deleteCheckResult && deleteCheckResult.usages.length > 0 && (
          <div className="space-y-2 py-2">
            <span className="text-xs font-semibold text-foreground">Đang được dùng trong:</span>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {deleteCheckResult.usages.map((u, i) => (
                <div
                  key={u.planItemId || i}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-medium text-foreground">{u.planTitle}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span>{u.date}</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {MEAL_TYPE_LABELS[u.mealType] || u.mealType}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {isInUse ? 'Đã hiểu' : 'Hủy bỏ'}
          </Button>

          {!isInUse && (
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirmDelete}
              disabled={isDeleting}
              className="gap-1.5"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa món ăn'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
