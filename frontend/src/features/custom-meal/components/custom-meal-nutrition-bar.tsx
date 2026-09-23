'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Flame, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface CustomMealNutritionBarProps {
  coverageRatio: number; // 0.0 đến 1.0
  calculatedCalories: number | null;
  calculatedProtein?: number | null;
  calculatedCarbs?: number | null;
  calculatedFat?: number | null;
  userCalories?: number | null;
  unmatchedCount: number;
  totalIngredientCount: number;
}

export const CustomMealNutritionBar: React.FC<CustomMealNutritionBarProps> = ({
  coverageRatio,
  calculatedCalories,
  calculatedProtein,
  calculatedCarbs,
  calculatedFat,
  userCalories,
  unmatchedCount,
  totalIngredientCount,
}) => {
  const percent = Math.round(coverageRatio * 100);
  const isFullyCovered = percent === 100 && totalIngredientCount > 0;
  const isPartiallyCovered = percent > 0 && percent < 100;
  const hasNoCalculated = calculatedCalories === null || percent === 0;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <h4 className="text-sm font-semibold text-foreground">Tổng hợp Dinh dưỡng</h4>
        </div>

        {isFullyCovered && (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-xs"
          >
            <CheckCircle2 className="w-3 h-3" />
            Bao phủ 100%
          </Badge>
        )}

        {isPartiallyCovered && (
          <Badge
            variant="secondary"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-xs"
          >
            <AlertTriangle className="w-3 h-3" />
            Bao phủ {percent}%
          </Badge>
        )}

        {hasNoCalculated && (
          <Badge variant="outline" className="text-muted-foreground gap-1 text-xs">
            <Info className="w-3 h-3" />
            Tự ước tính
          </Badge>
        )}
      </div>

      {/* Thông số dinh dưỡng chính */}
      <div className="grid grid-cols-4 gap-2 text-center py-1">
        <div className="rounded-lg bg-muted/40 p-2">
          <span className="text-[11px] text-muted-foreground block">Năng lượng</span>
          <span className="text-sm font-bold text-foreground">
            {calculatedCalories !== null
              ? `${Math.round(calculatedCalories)} kcal`
              : userCalories !== null && userCalories !== undefined
                ? `${Math.round(userCalories)} kcal (ước tính)`
                : '--'}
          </span>
        </div>
        <div className="rounded-lg bg-muted/40 p-2">
          <span className="text-[11px] text-muted-foreground block">Đạm (Protein)</span>
          <span className="text-sm font-bold text-foreground">
            {calculatedProtein !== undefined && calculatedProtein !== null
              ? `${calculatedProtein.toFixed(1)} g`
              : '--'}
          </span>
        </div>
        <div className="rounded-lg bg-muted/40 p-2">
          <span className="text-[11px] text-muted-foreground block">Tinh bột (Carbs)</span>
          <span className="text-sm font-bold text-foreground">
            {calculatedCarbs !== undefined && calculatedCarbs !== null
              ? `${calculatedCarbs.toFixed(1)} g`
              : '--'}
          </span>
        </div>
        <div className="rounded-lg bg-muted/40 p-2">
          <span className="text-[11px] text-muted-foreground block">Chất béo (Fat)</span>
          <span className="text-sm font-bold text-foreground">
            {calculatedFat !== undefined && calculatedFat !== null
              ? `${calculatedFat.toFixed(1)} g`
              : '--'}
          </span>
        </div>
      </div>

      {/* Thanh tiến trình mức độ bao phủ */}
      {totalIngredientCount > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Độ bao phủ dữ liệu chuẩn:</span>
            <span>
              {totalIngredientCount - unmatchedCount}/{totalIngredientCount} nguyên liệu ({percent}
              %)
            </span>
          </div>
          <Progress value={percent} className="h-2" />
        </div>
      )}

      {/* Cảnh báo dinh dưỡng chưa bao phủ */}
      {unmatchedCount > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg flex items-start gap-1.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Món ăn có <strong>{unmatchedCount}</strong> nguyên liệu tự do chưa liên kết với Ngân
            hàng Thực phẩm. Tổng năng lượng thực tế có thể cao hơn số liệu trên (hệ thống không coi
            nguyên liệu chưa biết là 0 calo).
          </span>
        </p>
      )}
    </div>
  );
};
