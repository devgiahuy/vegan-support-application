'use client';

import * as React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { MealWarning } from '../types/meal-analysis.model';

interface MealAnalysisBadgeProps {
  warnings: MealWarning[];
  onClick?: (warnings: MealWarning[]) => void;
  className?: string;
}

/**
 * Huy hiệu cảnh báo dinh dưỡng/tương thích hiển thị gọn trên từng ô bữa ăn (slot) trong lịch tuần.
 */
export function MealAnalysisBadge({ warnings, onClick, className = '' }: MealAnalysisBadgeProps) {
  if (warnings.length === 0) return null;

  const hasDanger = warnings.some((w) => w.severity === 'DANGER');
  const count = warnings.length;

  const badgeContent = (
    <button
      type="button"
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(warnings);
        }
      }}
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium transition-transform hover:scale-105 ${
        hasDanger
          ? 'bg-destructive/15 text-destructive border border-destructive/30'
          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
      } ${className}`}
      aria-label={`${count} cảnh báo dinh dưỡng`}
    >
      {hasDanger ? (
        <AlertCircle className="size-3 shrink-0" />
      ) : (
        <AlertTriangle className="size-3 shrink-0" />
      )}
      <span>{count}</span>
    </button>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <p className="font-semibold">
            {hasDanger ? 'Phát hiện nguy cơ dinh dưỡng' : 'Cần lưu ý dinh dưỡng'} ({count}):
          </p>
          <ul className="mt-1 list-disc pl-3 space-y-0.5 text-[11px] text-muted-foreground">
            {warnings.slice(0, 3).map((w) => (
              <li key={w.id}>{w.title}</li>
            ))}
            {count > 3 && <li>Và {count - 3} lưu ý khác...</li>}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
