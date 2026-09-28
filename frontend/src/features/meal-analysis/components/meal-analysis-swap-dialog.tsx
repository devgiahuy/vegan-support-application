'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Check, Flame, RefreshCw, Sparkles, Utensils } from 'lucide-react';
import type { MealWarning, SwapSuggestion } from '../types/meal-analysis.model';

interface MealAnalysisSwapDialogProps {
  warning: MealWarning | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSwap: (planItemId: string, swap: SwapSuggestion) => Promise<void> | void;
  isSwapping?: boolean;
}

/**
 * Hộp thoại gợi ý đổi món ăn thay thế an toàn nhằm giải quyết cảnh báo dinh dưỡng.
 */
export function MealAnalysisSwapDialog({
  warning,
  open,
  onOpenChange,
  onSelectSwap,
  isSwapping = false,
}: MealAnalysisSwapDialogProps) {
  const [selectedSlotId, setSelectedSlotId] = React.useState<string>('');
  const [swappingId, setSwappingId] = React.useState<string | null>(null);

  // Khởi tạo slot được chọn khi warning thay đổi
  React.useEffect(() => {
    if (warning && warning.affectedItems.length > 0) {
      setSelectedSlotId(warning.affectedItems[0].planItemId);
    } else {
      setSelectedSlotId('');
    }
  }, [warning]);

  if (!warning) return null;

  const swaps = warning.suggestedSwaps;

  const handleApplySwap = async (swap: SwapSuggestion) => {
    if (!selectedSlotId) return;
    try {
      setSwappingId(swap.suggestedDishId);
      await onSelectSwap(selectedSlotId, swap);
      onOpenChange(false);
    } finally {
      setSwappingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-1.5 text-primary">
            <Sparkles className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Khắc phục dinh dưỡng
            </span>
          </div>
          <DialogTitle className="text-base font-semibold leading-snug">
            Gợi ý đổi món thay thế an toàn
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {warning.title} •{' '}
            {warning.suggestedAdjustment ?? 'Chọn một món ăn phù hợp bên dưới để thay thế.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Chọn ô bữa ăn cần đổi nếu có nhiều món liên quan */}
          {warning.affectedItems.length > 1 && (
            <div className="rounded-lg border bg-muted/30 p-2.5">
              <label className="text-xs font-medium text-foreground">
                Chọn món bạn muốn thay đổi trong bữa ăn:
              </label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {warning.affectedItems.map((item) => (
                  <button
                    key={item.planItemId}
                    type="button"
                    onClick={() => setSelectedSlotId(item.planItemId)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                      selectedSlotId === item.planItemId
                        ? 'border-primary bg-primary text-primary-foreground font-medium'
                        : 'border-border bg-card text-foreground hover:bg-muted'
                    }`}
                  >
                    <Utensils className="size-3" />
                    {item.dishName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Danh sách món gợi ý */}
          {swaps.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              Chưa có món thay thế tự động khả dụng. Bạn có thể sử dụng tính năng &quot;Đổi
              món&quot; thủ công trên lịch thực đơn.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {swaps.map((swap) => {
                const isCurrentSwapping = swappingId === swap.suggestedDishId;
                return (
                  <div
                    key={swap.suggestedDishId}
                    className="flex flex-col items-start justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/50 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">{swap.dishName}</h4>
                        <Badge variant="outline" className="text-[10px]">
                          {swap.dishType === 'CUSTOM_MEAL' ? 'Món cá nhân' : 'Công thức'}
                        </Badge>
                      </div>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Flame className="size-3 text-orange-500" />
                        {swap.calories} kcal • {swap.matchReason}
                      </p>
                      {swap.resolvesWarningCodes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <Check className="size-3" />
                            Khắc phục hoàn toàn cảnh báo này
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => void handleApplySwap(swap)}
                      disabled={isSwapping || isCurrentSwapping || !selectedSlotId}
                      className="shrink-0 gap-1 text-xs"
                    >
                      {isCurrentSwapping ? (
                        <>
                          <RefreshCw className="size-3.5 animate-spin" />
                          Đang đổi...
                        </>
                      ) : (
                        <>
                          Đổi món này
                          <ArrowRight className="size-3" />
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
