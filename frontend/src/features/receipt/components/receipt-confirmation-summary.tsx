'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, PackagePlus, PlusCircle, RefreshCw } from 'lucide-react';
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
import type { ReceiptConfirmationDiff } from '../types/receipt.model';

interface ReceiptConfirmationSummaryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diff: ReceiptConfirmationDiff | null;
}

export function ReceiptConfirmationSummary({
  open,
  onOpenChange,
  diff,
}: ReceiptConfirmationSummaryProps) {
  const router = useRouter();

  if (!diff) return null;

  const { pantryChanges } = diff;
  const createdCount = pantryChanges.filter((c) => c.action === 'CREATED').length;
  const updatedCount = pantryChanges.filter((c) => c.action === 'UPDATED').length;

  const handleGoToPantry = () => {
    onOpenChange(false);
    router.push('/pantry');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg rounded-3xl p-6">
        <DialogHeader className="text-center sm:text-left space-y-2">
          <div className="mx-auto sm:mx-0 flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Nhập Tủ Bếp Thành Công!
          </DialogTitle>
          <DialogDescription className="text-sm">
            Đã áp dụng các mặt hàng hợp lệ từ hóa đơn vào kho Tủ bếp gia đình của bạn.
          </DialogDescription>
        </DialogHeader>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600">
              <PlusCircle className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Thêm mới</div>
              <div className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                {createdCount} món
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Cộng dồn số lượng</div>
              <div className="text-base font-bold text-blue-700 dark:text-blue-300">
                {updatedCount} món
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách các mặt hàng đã thay đổi */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Chi tiết mặt hàng ({pantryChanges.length})
          </div>

          <div className="space-y-2">
            {pantryChanges.map((change, idx) => (
              <div
                key={`${change.candidateId}-${idx}`}
                className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {change.pantryItem.displayName}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Số lượng:{' '}
                    <span className="font-medium">{change.pantryItem.formattedQuantity}</span>
                  </div>
                </div>

                <Badge
                  variant={change.action === 'CREATED' ? 'default' : 'secondary'}
                  className={`text-[10px] rounded-lg px-2 py-0.5 ${
                    change.action === 'CREATED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {change.actionLabel}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="pt-3 flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl w-full sm:w-auto"
          >
            Ở lại trang này
          </Button>

          <Button
            type="button"
            onClick={handleGoToPantry}
            className="rounded-xl w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Đến Tủ bếp của tôi
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
