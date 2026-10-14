import * as React from 'react';
import { BatteryMedium, Sparkles, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { QuotaState } from '../types/chat.model';

/**
 * Hiển thị hạn mức sử dụng câu hỏi AI:
 * - variant 'pill': Huy hiệu nhỏ gọn gắn trên thanh Header/Top bar.
 * - variant 'banner': Thông báo cảnh báo khi hết lượt trong ngày.
 */
export function QuotaBanner({
  quota,
  variant = 'pill',
  className,
}: {
  quota: QuotaState | null;
  variant?: 'pill' | 'banner';
  className?: string;
}) {
  if (!quota) return null;

  if (quota.exhausted) {
    return (
      <Alert
        className={cn(
          'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200',
          className
        )}
      >
        <TriangleAlert className="size-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="font-semibold">Bạn đã dùng hết lượt hỏi hôm nay</AlertTitle>
        <AlertDescription className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/90">
          Hạn mức ({quota.used}/{quota.limit} câu hỏi) sẽ tự động cấp lại lúc {quota.resetAtLabel}.
          Lịch sử các cuộc hội thoại trước đó vẫn được lưu trữ và có thể xem lại bất kỳ lúc nào.
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 shadow-2xs',
          className
        )}
        title={`Đã dùng ${quota.used}/${quota.limit} lượt · Cấp lại lúc ${quota.resetAtLabel}`}
      >
        <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
        <span>
          Còn {quota.remaining}/{quota.limit} lượt
        </span>
      </div>
    );
  }

  return (
    <p className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <BatteryMedium className="size-3.5 text-emerald-500" />
      <span>
        Còn {quota.remaining}/{quota.limit} lượt hôm nay · cấp lại lúc {quota.resetAtLabel}
      </span>
    </p>
  );
}
