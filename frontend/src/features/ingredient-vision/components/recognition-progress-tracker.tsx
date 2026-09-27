'use client';

import React from 'react';
import { Loader2, Sparkles, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RecognitionJob } from '../types/ingredient-recognition.model';

interface RecognitionProgressTrackerProps {
  job: RecognitionJob;
  onCancel?: () => void;
  onRetry?: () => void;
  isCancelling?: boolean;
  isRetrying?: boolean;
}

export function RecognitionProgressTracker({
  job,
  onCancel,
  onRetry,
  isCancelling = false,
  isRetrying = false,
}: RecognitionProgressTrackerProps) {
  const { progress, status, statusLabel, issue, canRetry } = job;
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
              <Sparkles className="h-6 w-6" />
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {statusLabel}
            </h3>
            <p className="text-sm text-muted-foreground">
              {job.isProcessing
                ? `Đang phân tích hình ảnh và nhận diện thực phẩm (${progress.completedImages}/${progress.totalImages} ảnh)...`
                : job.isReadyForReview
                  ? 'Hoàn thành phân tích! Vui lòng rà soát lại các ứng viên bên dưới.'
                  : issue?.message || 'Tiến trình nhận diện thực phẩm.'}
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
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5"
            >
              {isCancelling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              <span>Hủy tác vụ</span>
            </Button>
          )}

          {canRetry && onRetry && (
            <Button
              type="button"
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5"
            >
              {isRetrying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              <span>Thử lại</span>
            </Button>
          )}
        </div>
      </div>

      {/* GPU-composited 60 FPS Progress bar using scaleX */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium text-muted-foreground">
          <span>Tiến độ xử lý hình ảnh</span>
          <span>{percent}%</span>
        </div>

        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className={`h-full w-full transition-transform duration-300 ease-out will-change-transform ${
              job.isFailed ? 'bg-destructive' : 'bg-emerald-600'
            }`}
            style={{
              transformOrigin: 'left',
              transform: `scaleX(${percent / 100})`,
            }}
          />
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {issue && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-xs uppercase tracking-wider">{issue.code}</div>
            <div className="mt-0.5 text-xs text-destructive/90">{issue.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
