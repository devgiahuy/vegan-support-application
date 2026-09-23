'use client';

import * as React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { MealPlanAnalysis } from '../types/meal-analysis.model';

interface MealAnalysisSummaryBarProps {
  analysis: MealPlanAnalysis | null | undefined;
  isLoading: boolean;
  onAnalyze: () => void;
  className?: string;
}

/**
 * Thanh tổng quan trạng thái phân tích khẩu phần & độ tương thích thực đơn.
 */
export function MealAnalysisSummaryBar({
  analysis,
  isLoading,
  onAnalyze,
  className = '',
}: MealAnalysisSummaryBarProps) {
  if (!analysis) {
    return (
      <div
        className={`flex flex-col items-start justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Phân tích Khẩu phần & Tương thích Dinh dưỡng
            </h3>
            <p className="text-xs text-muted-foreground">
              Kiểm tra vượt ngưỡng Natri, Sắt, Vitamin A và các cặp thực phẩm kỵ nhau trong thực đơn
              tuần.
            </p>
          </div>
        </div>
        <Button onClick={onAnalyze} disabled={isLoading} size="sm" className="shrink-0 gap-1.5">
          {isLoading ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              Đang phân tích...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Phân tích thực đơn
            </>
          )}
        </Button>
      </div>
    );
  }

  const { isStale, summary, formattedAnalyzedAt, hasIncompleteData, overallConfidence } = analysis;
  const hasDanger = summary.dangerCount > 0;
  const hasWarning = summary.warningCount > 0;
  const isClean = summary.totalWarnings === 0;

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isStale
          ? 'border-amber-500/40 bg-amber-500/5'
          : hasDanger
            ? 'border-destructive/30 bg-destructive/5'
            : hasWarning
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-emerald-500/30 bg-emerald-500/5'
      } ${className}`}
    >
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
              isStale
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : hasDanger
                  ? 'bg-destructive/10 text-destructive'
                  : hasWarning
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isStale ? (
              <RefreshCw className="size-5" />
            ) : hasDanger ? (
              <AlertCircle className="size-5" />
            ) : hasWarning ? (
              <AlertTriangle className="size-5" />
            ) : (
              <CheckCircle2 className="size-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {isStale
                  ? 'Thực đơn đã thay đổi — Cần phân tích lại'
                  : hasDanger
                    ? `Phát hiện ${summary.dangerCount} nguy cơ vượt ngưỡng an toàn`
                    : hasWarning
                      ? `Có ${summary.warningCount} điểm cần lưu ý về dinh dưỡng`
                      : 'Thực đơn đạt chuẩn an toàn dinh dưỡng'}
              </h3>
              {isStale && (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 text-amber-600 dark:text-amber-400"
                >
                  Hết hiệu lực
                </Badge>
              )}
              {!isStale && hasIncompleteData && (
                <Badge variant="secondary" className="text-xs">
                  Dữ liệu chưa đầy đủ
                </Badge>
              )}
              {!isStale && (
                <span className="text-xs text-muted-foreground">
                  (Độ tin cậy: {Math.round(overallConfidence * 100)}%)
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isStale
                ? 'Một hoặc nhiều món ăn vừa được chỉnh sửa. Vui lòng bấm phân tích lại để làm tươi kết quả kiểm tra.'
                : `Phân tích lúc ${formattedAnalyzedAt} • Tổng cộng ${summary.totalWarnings} cảnh báo (${summary.dangerCount} nguy cơ, ${summary.warningCount} chú ý).`}
            </p>
          </div>
        </div>

        <Button
          onClick={onAnalyze}
          disabled={isLoading}
          variant={isStale ? 'default' : 'outline'}
          size="sm"
          className="shrink-0 gap-1.5"
        >
          {isLoading ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              Đang kiểm tra...
            </>
          ) : (
            <>
              <RefreshCw className="size-4" />
              {isStale ? 'Phân tích lại ngay' : 'Phân tích lại'}
            </>
          )}
        </Button>
      </div>

      {/* Hiển thị số lượng nhanh các nhóm vi phạm nếu có */}
      {!isStale && !isClean && (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/50 pt-2.5 text-xs text-muted-foreground">
          {summary.dailyLimitViolations > 0 && (
            <span className="flex items-center gap-1 font-medium text-destructive">
              <span className="size-1.5 rounded-full bg-destructive" />
              {summary.dailyLimitViolations} vi phạm ngưỡng tối đa ngày
            </span>
          )}
          {summary.sameMealCount > 0 && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="size-1.5 rounded-full bg-amber-500" />
              {summary.sameMealCount} tương tác trong cùng bữa
            </span>
          )}
          {summary.sameDishCount > 0 && (
            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
              <span className="size-1.5 rounded-full bg-indigo-500" />
              {summary.sameDishCount} tương tác trong cùng món
            </span>
          )}
        </div>
      )}
    </div>
  );
}
