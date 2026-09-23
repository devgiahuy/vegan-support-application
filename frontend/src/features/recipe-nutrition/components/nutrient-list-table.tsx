'use client';

import React, { useState, useMemo } from 'react';
import type { NutrientItemModel } from '../types/recipe-nutrition.model';
import { NutritionOriginBadge } from './nutrition-origin-badge';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface NutrientListTableProps {
  nutrients: NutrientItemModel[];
  className?: string;
}

// Bỏ qua các mã năng lượng macro vì đã được hiển thị trên MacroDistributionBar
const EXCLUDED_CODES = new Set([
  'ENERC_KCAL',
  'CALORIES',
  'PROCNT',
  'PROTEIN',
  'CHOCDF',
  'CARBS',
  'FAT',
  'LIPID',
]);

export function NutrientListTable({ nutrients, className }: NutrientListTableProps) {
  const [showAll, setShowAll] = useState(false);

  // Lọc danh sách vi chất và chất xơ
  const micronutrients = useMemo(() => {
    return nutrients.filter((n) => !EXCLUDED_CODES.has(n.code.toUpperCase()));
  }, [nutrients]);

  if (micronutrients.length === 0) {
    return null;
  }

  const displayedNutrients = showAll ? micronutrients : micronutrients.slice(0, 6);

  return (
    <div
      className={`rounded-xl border border-border/70 bg-card p-4 sm:p-5 space-y-3 ${
        className || ''
      }`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-sm font-semibold text-foreground">
            Bảng chi tiết vi chất trên mỗi khẩu phần
          </h4>
        </div>
        <span className="text-xs text-muted-foreground">
          {micronutrients.length} vi chất được xác định
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/40 text-muted-foreground font-medium">
              <th className="py-2 pr-3">Chất dinh dưỡng</th>
              <th className="py-2 px-3 text-right">Lượng / Khẩu phần</th>
              <th className="py-2 pl-3 text-right">Nguồn gốc dữ liệu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {displayedNutrients.map((item) => (
              <tr key={item.code} className="hover:bg-muted/40 transition-colors group">
                <td className="py-2.5 pr-3 font-medium text-foreground">
                  <span>{item.name}</span>
                  {item.rangeDisplay && (
                    <span className="block text-[11px] text-muted-foreground font-normal">
                      Biên độ dao động: {item.rangeDisplay}
                    </span>
                  )}
                </td>

                <td className="py-2.5 px-3 text-right font-semibold text-foreground whitespace-nowrap">
                  {item.formattedAmount}
                </td>

                <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                  <NutritionOriginBadge
                    origin={item.origin}
                    isAiEstimated={item.isAiEstimated}
                    confidencePercent={item.confidencePercent}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {micronutrients.length > 6 && (
        <div className="pt-2 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
          >
            <span>
              {showAll
                ? 'Thu gọn danh sách vi chất'
                : `Xem thêm ${micronutrients.length - 6} vi chất khác`}
            </span>
            {showAll ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
