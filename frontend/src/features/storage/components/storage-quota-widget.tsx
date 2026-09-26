'use client';

import * as React from 'react';
import { HardDrive, AlertTriangle, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useStorageUsageQuery } from '../queries/storage.queries';

interface StorageQuotaWidgetProps {
  variant?: 'compact' | 'full';
  className?: string;
  showWarningBanner?: boolean;
}

export function StorageQuotaWidget({
  variant = 'full',
  className,
  showWarningBanner = true,
}: StorageQuotaWidgetProps) {
  const { data, isLoading, isError, error } = useStorageUsageQuery();

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 p-3 text-sm text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Đang kiểm tra dung lượng...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={cn('p-3 text-xs text-rose-500 bg-rose-50 rounded-md', className)}>
        Không thể tải thông tin dung lượng.
      </div>
    );
  }

  const { usage, policy } = data;
  const {
    usedFormatted,
    limitFormatted,
    remainingFormatted,
    percentUsed,
    isWarning,
    isCritical,
    overQuota,
  } = usage;

  // Quyết định màu sắc thanh tiến trình dựa trên 3 cấp độ
  const progressColorClass = isCritical
    ? '[&>div]:bg-rose-500'
    : isWarning
      ? '[&>div]:bg-amber-500'
      : '[&>div]:bg-emerald-500';

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-1.5', className)}>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5" />
            Dung lượng
          </span>
          <span
            className={cn(
              'font-semibold',
              isCritical
                ? 'text-rose-600 dark:text-rose-400'
                : isWarning
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-foreground'
            )}
          >
            {usedFormatted} / {limitFormatted} ({percentUsed}%)
          </span>
        </div>
        <Progress value={percentUsed} className={cn('h-1.5', progressColorClass)} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'space-y-4 rounded-xl border bg-card p-5 text-card-foreground shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'rounded-lg p-2',
              isCritical
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                : isWarning
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
            )}
          >
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold leading-none tracking-tight">Hạn ngạch lưu trữ</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Chính sách áp dụng: {policy.name || 'Mặc định'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div
            className={cn(
              'text-lg font-bold',
              isCritical
                ? 'text-rose-600 dark:text-rose-400'
                : isWarning
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
            )}
          >
            {percentUsed}%
          </div>
          <span className="text-xs text-muted-foreground">Đã sử dụng</span>
        </div>
      </div>

      <div className="space-y-2">
        <Progress value={percentUsed} className={cn('h-2.5', progressColorClass)} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Đã dùng: {usedFormatted}</span>
          <span>Còn trống: {remainingFormatted}</span>
          <span>Hạn mức: {limitFormatted}</span>
        </div>
      </div>

      {showWarningBanner && isCritical && (
        <Alert
          variant="destructive"
          className="border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200"
        >
          <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <AlertTitle className="font-semibold">Dung lượng đã đạt hạn mức tối đa</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            {overQuota
              ? 'Tài khoản của bạn đã vượt quá giới hạn lưu trữ. Vui lòng xóa bớt ảnh hoặc video không còn sử dụng để tiếp tục tải lên.'
              : 'Bạn đã dùng hết 100% dung lượng khả dụng. Không thể tải thêm file mới.'}
          </AlertDescription>
        </Alert>
      )}

      {showWarningBanner && isWarning && !isCritical && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="font-semibold">Dung lượng sắp đầy</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            Bạn đã sử dụng hơn {usage.warningPercent}% dung lượng tài khoản. Hãy chủ động quản lý
            các tệp tin để tránh gián đoạn trải nghiệm.
          </AlertDescription>
        </Alert>
      )}

      {!isWarning && !isCritical && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>Dung lượng lưu trữ của bạn đang trong trạng thái tối ưu.</span>
        </div>
      )}
    </div>
  );
}
