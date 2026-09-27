'use client';

import React from 'react';
import { Loader2, Sparkles, AlertTriangle, RefreshCw, XCircle, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReceiptJob } from '../types/receipt.model';

interface ReceiptProgressTrackerProps {
  job: ReceiptJob;
  onCancel?: () => void;
  onRetry?: () => void;
  isCancelling?: boolean;
  isRetrying?: boolean;
}

export function ReceiptProgressTracker({
  job,
  onCancel,
  onRetry,
  isCancelling = false,
  isRetrying = false,
}: ReceiptProgressTrackerProps) {
  const { progress, statusLabel, issue, canRetry } = job;
  const percent = progress.percent;

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            {job.isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin will-change-transform" />
            ) : job.isFailed ? (
              <AlertTriangle className="h-6 w-6 text-destructive" />
            ) : (
              <Receipt className="h-6 w-6" />
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {statusLabel}
            </h3>
            <p className="text-sm text-muted-foreground">
              {job.isProcessing
                ? `Đang nhận diện ký tự và bóc tách các dòng sản phẩm (${progress.completedImages}/${progress.totalImages} ảnh)...`
                : job.isReadyForReview
                  ? 'Bóc tách hoàn tất! Vui lòng đối chiếu với ảnh hóa đơn bên trái và kiểm duyệt danh sách sản phẩm.'
                  : issue?.message || 'Tiến trình xử lý hóa đơn.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {job.isProcessing && onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isCancelling}
              className="rounded-xl text-neutral-600 hover:text-destructive"
            >
              {isCancelling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
              )}
              Hủy bóc tách
            </Button>
          )}

          {canRetry && onRetry && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isRetrying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              )}
              Thử lại tác vụ
            </Button>
          )}
        </div>
      </div>

      {/* Thanh tiến trình */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
          <span>Tiến trình xử lý ảnh</span>
          <span>
            {percent}% ({progress.completedImages}/{progress.totalImages} ảnh)
          </span>
        </div>

        <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className={`h-full transition-all duration-500 ease-out will-change-transform ${
              job.isFailed
                ? 'bg-destructive'
                : job.status === 'PARTIAL_FAILED'
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Cảnh báo lỗi nếu có */}
      {issue && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Mã lỗi: {issue.code}</div>
            <div className="text-xs opacity-90 mt-0.5">{issue.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
