'use client';

import * as React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Layers,
  ShieldCheck,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MealWarning, MealWarningScope } from '../types/meal-analysis.model';

interface MealAnalysisCardProps {
  warning: MealWarning;
  onViewDetails?: (warning: MealWarning) => void;
  onViewSwaps?: (warning: MealWarning) => void;
  className?: string;
}

const SCOPE_CONFIG: Record<MealWarningScope, { label: string; className: string }> = {
  SAME_DISH: {
    label: 'Cùng món ăn',
    className: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
  },
  SAME_MEAL: {
    label: 'Cùng bữa ăn',
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  },
  SAME_DAY: {
    label: 'Toàn bộ ngày',
    className: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
  },
};

const GRADE_COLOR: Record<string, string> = {
  GRADE_A: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  GRADE_B: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  GRADE_C: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  GRADE_D: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20',
};

/**
 * Thẻ hiển thị một cảnh báo phân tích dinh dưỡng hoặc tương thích thực phẩm.
 */
export function MealAnalysisCard({
  warning,
  onViewDetails,
  onViewSwaps,
  className = '',
}: MealAnalysisCardProps) {
  const isDanger = warning.severity === 'DANGER';
  const scopeConfig = SCOPE_CONFIG[warning.scope] ?? SCOPE_CONFIG.SAME_MEAL;
  const gradeColor = GRADE_COLOR[warning.evidenceGrade] ?? GRADE_COLOR.GRADE_B;

  const hasMetrics = warning.measuredValue !== null && warning.limitValue !== null;
  const percentOfLimit =
    hasMetrics && warning.limitValue! > 0
      ? Math.round((warning.measuredValue! / warning.limitValue!) * 100)
      : null;

  return (
    <div
      className={`rounded-lg border p-4 transition-all ${
        isDanger
          ? 'border-destructive/40 bg-card hover:border-destructive/60'
          : 'border-amber-500/30 bg-card hover:border-amber-500/50'
      } ${className}`}
    >
      {/* Tiêu đề & Badges */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div
            className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
              isDanger
                ? 'bg-destructive/10 text-destructive'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            {isDanger ? <AlertCircle className="size-4" /> : <AlertTriangle className="size-4" />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{warning.title}</h4>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
              <Badge variant="outline" className={scopeConfig.className}>
                <Layers className="mr-1 size-3" />
                {scopeConfig.label}
              </Badge>
              <Badge variant="outline" className={gradeColor}>
                <ShieldCheck className="mr-1 size-3" />
                {warning.evidenceGradeLabel}
              </Badge>
              {warning.targetDate && (
                <span className="text-muted-foreground">• Ngày: {warning.targetDate}</span>
              )}
            </div>
          </div>
        </div>

        {isDanger ? (
          <Badge variant="destructive" className="text-[11px] font-medium">
            Nguy cơ cao
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-medium"
          >
            Cần lưu ý
          </Badge>
        )}
      </div>

      {/* Giải thích khoa học */}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{warning.explanation}</p>

      {/* So sánh định lượng nếu có */}
      {hasMetrics && (
        <div className="mt-3 rounded-md bg-muted/50 p-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">Mức tiêu thụ đo được:</span>
            <span
              className={`font-semibold ${isDanger ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'}`}
            >
              {warning.measuredValue} {warning.unit} / {warning.limitValue} {warning.unit} (ngưỡng
              an toàn)
            </span>
          </div>
          {percentOfLimit !== null && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full rounded-full transition-all ${
                    percentOfLimit > 100 ? 'bg-destructive' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(percentOfLimit, 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {percentOfLimit}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Danh sách món ăn / thành phần bị ảnh hưởng */}
      {warning.affectedItems.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Utensils className="size-3.5 shrink-0" />
          <span className="font-medium text-foreground">Thành phần liên quan:</span>
          {warning.affectedItems.map((item, idx) => (
            <span
              key={`${item.planItemId}-${idx}`}
              className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
            >
              {item.dishName}
              {item.ingredientName ? ` (${item.ingredientName})` : ''}
            </span>
          ))}
        </div>
      )}

      {/* Gợi ý điều chỉnh & Nút hành động */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
        {warning.suggestedAdjustment ? (
          <p className="max-w-[70%] text-[11px] italic text-muted-foreground">
            💡 {warning.suggestedAdjustment}
          </p>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {onViewDetails && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(warning)}
              className="h-8 gap-1 px-2.5 text-xs"
            >
              <BookOpen className="size-3.5" />
              Chi tiết
            </Button>
          )}

          {warning.suggestedSwaps.length > 0 && onViewSwaps && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onViewSwaps(warning)}
              className="h-8 gap-1 px-2.5 text-xs text-primary hover:text-primary"
            >
              <Sparkles className="size-3.5" />
              Gợi ý đổi món ({warning.suggestedSwaps.length})
              <ArrowRight className="size-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
