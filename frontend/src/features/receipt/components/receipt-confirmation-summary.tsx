'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, PlusCircle, RefreshCw, Camera } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ReceiptConfirmationDiff } from '../types/receipt.model';

interface ReceiptConfirmationSummaryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diff: ReceiptConfirmationDiff | null;
  onScanAnother?: () => void;
}

export function ReceiptConfirmationSummary({
  open,
  onOpenChange,
  diff,
  onScanAnother,
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
      <DialogContent className="box-border flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg min-w-0 flex-col gap-4 overflow-hidden rounded-3xl p-4 sm:p-6">
        <DialogHeader className="w-full min-w-0 max-w-full shrink-0 gap-2 text-center sm:text-left">
          <div className="mx-auto sm:mx-0 flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <DialogTitle className="text-balance text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Nhập Tủ Bếp Thành Công!
          </DialogTitle>
          <DialogDescription className="w-full min-w-0 max-w-full break-words text-pretty text-sm">
            Đã áp dụng các mặt hàng hợp lệ từ hóa đơn vào kho Tủ bếp gia đình của bạn.
          </DialogDescription>
        </DialogHeader>

        {diff.duplicateCandidates.length > 0 && (
          <Alert className="min-w-0 shrink-0">
            <AlertTitle>Đã bỏ qua dòng trùng hóa đơn</AlertTitle>
            <AlertDescription>
              {diff.duplicateCandidates.length} dòng đã có trong một hóa đơn được xác nhận trước đó
              nên không được cộng thêm vào Tủ bếp.
            </AlertDescription>
          </Alert>
        )}

        {/* Thống kê nhanh */}
        <div className="grid w-full min-w-0 max-w-full shrink-0 grid-cols-1 gap-2 py-2 lg:grid-cols-[repeat(2,minmax(0,1fr))] sm:gap-3">
          <div className="flex w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-2.5 dark:border-emerald-800/40 dark:bg-emerald-950/30 sm:gap-3 sm:p-3.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50">
              <PlusCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="break-words text-[11px] leading-snug text-muted-foreground sm:text-xs">
                Thêm mới
              </div>
              <div className="tabular-nums text-base font-bold text-emerald-700 dark:text-emerald-300">
                {createdCount} món
              </div>
            </div>
          </div>

          <div className="flex w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-2xl border border-blue-200/60 bg-blue-50/60 p-2.5 dark:border-blue-800/40 dark:bg-blue-950/30 sm:gap-3 sm:p-3.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/50">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="break-words text-[11px] leading-snug text-muted-foreground sm:text-xs">
                Cộng dồn số lượng
              </div>
              <div className="tabular-nums text-base font-bold text-blue-700 dark:text-blue-300">
                {updatedCount} món
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách các mặt hàng đã thay đổi */}
        <div className="flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Chi tiết mặt hàng ({pantryChanges.length})
          </div>

          <div className="flex flex-col gap-2">
            {pantryChanges.map((change, idx) => (
              <div
                key={`${change.candidateId}-${idx}`}
                className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900/30"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="break-words font-semibold text-neutral-900 dark:text-neutral-100">
                    {change.pantryItem.displayName}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Số lượng:{' '}
                    <span className="font-medium">{change.pantryItem.formattedQuantity}</span>
                  </div>
                </div>

                <Badge
                  variant={change.action === 'CREATED' ? 'default' : 'secondary'}
                  className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] ${
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

        <DialogFooter className="w-full shrink-0 flex-col gap-2 border-t pt-3 sm:flex-col">
          <div className="flex w-full min-w-0 items-center gap-2">
            {onScanAnother && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onScanAnother();
                }}
                className="min-w-0 flex-1 rounded-xl px-2 sm:px-3"
              >
                <Camera className="mr-1.5 size-4 shrink-0" />
                <span className="truncate">Quét thêm hóa đơn khác</span>
              </Button>
            )}

            <Button
              type="button"
              variant={onScanAnother ? 'ghost' : 'outline'}
              onClick={() => onOpenChange(false)}
              className="shrink-0 rounded-xl px-3 text-muted-foreground"
            >
              Đóng
            </Button>
          </div>

          <Button
            type="button"
            onClick={handleGoToPantry}
            className="w-full min-w-0 rounded-xl bg-emerald-600 font-medium text-white hover:bg-emerald-700"
          >
            Đến Tủ bếp của tôi
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
