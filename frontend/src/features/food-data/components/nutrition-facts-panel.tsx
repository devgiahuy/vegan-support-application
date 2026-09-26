'use client';

import React from 'react';
import { AlertCircle, Flame, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  useIngredientNutrientsQuery,
  useReferenceIntakesQuery,
} from '../queries/food-data.queries';
import { SourceProvenanceBadge } from './source-provenance-badge';
import type {
  IngredientNutritionFact,
  NutrientItem,
  ReferenceIntakeItem,
} from '../types/food-data.model';

interface NutritionFactsPanelProps {
  ingredientId?: string;
  initialData?: IngredientNutritionFact | null;
  preparation?: string;
  referenceIntakes?: ReferenceIntakeItem[];
  selectedPopulationCode?: string;
  className?: string;
}

export function NutritionFactsPanel({
  ingredientId,
  initialData,
  preparation = 'raw',
  referenceIntakes = [],
  selectedPopulationCode = 'GENERAL_ADULT',
  className = '',
}: NutritionFactsPanelProps) {
  const query = useIngredientNutrientsQuery(
    ingredientId || '',
    { preparation },
    { enabled: !initialData && Boolean(ingredientId) }
  );

  const fallbackRefIntakesQuery = useReferenceIntakesQuery(
    { populationCode: selectedPopulationCode, limit: 100 },
    { enabled: referenceIntakes.length === 0 }
  );

  const activeReferenceIntakes =
    referenceIntakes.length > 0 ? referenceIntakes : fallbackRefIntakesQuery.data?.items || [];

  const data = initialData || query.data;
  const isLoading = !initialData && query.isLoading;
  const isError = !initialData && query.isError;

  // 1. Loading State
  if (isLoading) {
    return (
      <div className={`rounded-xl border bg-card p-5 shadow-sm space-y-4 max-w-md ${className}`}>
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-48" />
        <div className="border-y-4 border-foreground py-2 my-2 flex justify-between items-baseline">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    return (
      <div
        className={`rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center max-w-md ${className}`}
      >
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <h4 className="font-semibold text-destructive text-sm">Không thể tải dữ liệu dinh dưỡng</h4>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Đã xảy ra lỗi khi kết nối với cơ sở dữ liệu dinh dưỡng chuẩn.
        </p>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  // 3. Empty State
  if (
    !data ||
    (!data.energyKcal &&
      data.macronutrients.length === 0 &&
      data.vitamins.length === 0 &&
      data.minerals.length === 0)
  ) {
    return (
      <div
        className={`rounded-xl border border-dashed p-6 text-center text-muted-foreground max-w-md ${className}`}
      >
        <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
        <p className="font-medium text-sm text-foreground">Chưa có hồ sơ dinh dưỡng kiểm định</p>
        <p className="text-xs text-muted-foreground mt-1">
          Dữ liệu thành phần trên 100g cho nguyên liệu này đang được chuẩn hóa và kiểm định bởi ban
          biên tập.
        </p>
      </div>
    );
  }

  // Helper tính % Daily Value (RDA)
  const calculateDV = (code: string, amount: number | null): number | null => {
    if (amount === null || !activeReferenceIntakes || activeReferenceIntakes.length === 0)
      return null;
    const ref = activeReferenceIntakes.find(
      (r) =>
        r.nutrientCode === code &&
        (r.populationCode === selectedPopulationCode || r.populationCode === 'GENERAL_ADULT')
    );
    if (!ref || ref.value <= 0) return null;
    return Math.round((amount / ref.value) * 100);
  };

  const renderNutrientRow = (
    item: NutrientItem,
    options?: { isBold?: boolean; isIndent?: boolean; isDivider?: boolean }
  ) => {
    const dv = calculateDV(item.code, item.amount);
    const { isBold = false, isIndent = false, isDivider = true } = options || {};

    return (
      <div
        key={item.id || item.code}
        className={`flex items-center justify-between text-xs py-1 ${isDivider ? 'border-b border-muted/80' : ''}`}
      >
        <div
          className={`flex items-center gap-1.5 ${isIndent ? 'pl-3 text-muted-foreground' : ''}`}
        >
          <span className={isBold ? 'font-bold text-foreground' : 'text-foreground'}>
            {item.name}
          </span>
          <span className="text-muted-foreground font-mono">
            {item.isMissing ? (
              <Badge
                variant="outline"
                className="h-4 px-1 text-[10px] text-muted-foreground font-normal"
              >
                Chưa xác định
              </Badge>
            ) : (
              `${item.amount} ${item.unit}`
            )}
          </span>
        </div>

        <div>
          {item.isMissing ? (
            <span className="text-muted-foreground/70 font-mono">--</span>
          ) : dv !== null ? (
            <span className="font-bold font-mono text-foreground">{dv}%</span>
          ) : (
            <span className="text-muted-foreground font-mono">--</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`rounded-xl border border-foreground/20 bg-card p-5 shadow-sm text-foreground font-sans max-w-md ${className}`}
      data-testid="nutrition-facts-panel"
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-2 pb-2">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight leading-none">
            Giá trị Dinh dưỡng
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tính trên 100g phần ăn được ({data.ediblePortionPercent}% ăn được)
          </p>
        </div>
        <SourceProvenanceBadge provenance={data.provenance} />
      </div>

      {/* Serving Conversion if available */}
      {data.householdConversions && data.householdConversions.length > 0 && (
        <div className="rounded bg-muted/40 px-2 py-1 my-1 text-[11px] text-muted-foreground flex flex-wrap gap-2">
          <span className="font-medium">Quy đổi:</span>
          {data.householdConversions.map((conv) => (
            <span key={conv.id || conv.unitName} className="font-mono">
              {conv.quantity} {conv.unitName} ≈ {conv.grams}g
            </span>
          ))}
        </div>
      )}

      {/* Calories bar */}
      <div className="border-y-4 border-foreground py-2 my-2 flex justify-between items-baseline">
        <div className="flex items-center gap-1.5">
          <Flame className="h-5 w-5 text-amber-500 fill-amber-500" />
          <span className="text-sm font-black uppercase">Năng lượng / Calo</span>
        </div>
        <div className="text-3xl font-black font-mono">
          {data.energyKcal !== null ? `${data.energyKcal}` : '--'}
          <span className="text-xs font-normal text-muted-foreground ml-1">kcal</span>
        </div>
      </div>

      {/* Daily Value Indicator */}
      <div className="text-right text-[11px] font-bold pb-1 text-muted-foreground">
        % Giá trị Hàng ngày (% DV)*
      </div>

      {/* Macronutrients */}
      <div className="border-t border-foreground">
        {data.macronutrients.length > 0 ? (
          data.macronutrients.map((macro) => renderNutrientRow(macro, { isBold: true }))
        ) : (
          <p className="text-xs text-muted-foreground py-1 italic">
            Chưa có thông số đa lượng chi tiết.
          </p>
        )}
      </div>

      {/* Vitamins & Minerals Divider */}
      {(data.vitamins.length > 0 || data.minerals.length > 0) && (
        <div className="border-t-4 border-foreground pt-2 mt-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Vitamin & Khoáng chất
          </p>

          <div className="divide-y divide-muted/60">
            {data.minerals.map((mineral) => renderNutrientRow(mineral))}
            {data.vitamins.map((vitamin) => renderNutrientRow(vitamin))}
          </div>
        </div>
      )}

      {/* Other nutrients */}
      {data.otherNutrients.length > 0 && (
        <div className="border-t border-muted pt-1 mt-1 text-[11px] text-muted-foreground">
          <p className="font-semibold mb-0.5">Dưỡng chất khác:</p>
          <div className="flex flex-wrap gap-2">
            {data.otherNutrients.map((other) => (
              <span
                key={other.id || other.code}
                className="bg-muted/60 px-1.5 py-0.5 rounded text-[10px]"
              >
                {other.name}: {other.isMissing ? '--' : `${other.amount} ${other.unit}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="border-t-2 border-foreground/40 pt-2 mt-3 text-[10px] text-muted-foreground leading-normal space-y-1">
        <p>
          * % Giá trị Hàng ngày (% DV) cho biết một khẩu phần 100g thực phẩm đóng góp bao nhiêu vào
          chế độ dinh dưỡng khuyến nghị hàng ngày.
        </p>
        <p className="font-medium text-emerald-700 dark:text-emerald-400">
          ** Quy tắc an toàn: Ký hiệu (--) thể hiện dưỡng chất chưa có dữ liệu xét nghiệm trong
          nguồn kiểm định, tuyệt đối không được coi là bằng 0.
        </p>
      </div>
    </div>
  );
}
