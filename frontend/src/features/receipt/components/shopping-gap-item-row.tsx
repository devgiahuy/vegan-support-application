'use client';

import React from 'react';
import { Check, AlertCircle, ShoppingCart, HelpCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ShoppingGapItem } from '../types/shopping-gap.model';

interface ShoppingGapItemRowProps {
  item: ShoppingGapItem;
}

export function ShoppingGapItemRow({ item }: ShoppingGapItemRowProps) {
  const {
    ingredientName,
    required,
    available,
    missing,
    surplus,
    isFullyAvailable,
    isPartiallyMissing,
    isCompletelyMissing,
    conversionAssumptions,
    sourceMeals,
  } = item;

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        isFullyAvailable
          ? 'border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10'
          : isPartiallyMissing
            ? 'border-amber-200/70 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10'
            : 'border-neutral-200 dark:border-neutral-800 bg-card hover:border-neutral-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tên nguyên liệu & Nguồn món ăn */}
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
              {ingredientName}
            </h5>

            {isFullyAvailable && (
              <Badge
                variant="secondary"
                className="text-[11px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200"
              >
                <Check className="h-3 w-3 mr-1 text-emerald-600" />
                Đã có đủ
              </Badge>
            )}

            {isPartiallyMissing && (
              <Badge
                variant="outline"
                className="text-[11px] border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50/50"
              >
                Thiếu một phần
              </Badge>
            )}

            {isCompletelyMissing && (
              <Badge
                variant="outline"
                className="text-[11px] border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 bg-rose-50/50"
              >
                Cần mua mới
              </Badge>
            )}
          </div>

          {/* Món ăn sử dụng */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">Món dùng:</span>
            {sourceMeals.map((sm, idx) => (
              <span key={`${sm.id}-${idx}`} className="inline-flex items-center">
                <span className="underline decoration-dotted">{sm.name}</span>
                <span className="text-[11px] text-muted-foreground/80 ml-0.5">
                  ({sm.servings} phần)
                </span>
                {idx < sourceMeals.length - 1 && <span className="mx-1">•</span>}
              </span>
            ))}
          </div>

          {/* Giả định quy đổi đơn vị nếu có */}
          {conversionAssumptions.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 pt-0.5">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>Quy đổi: {conversionAssumptions.join('; ')}</span>
            </div>
          )}
        </div>

        {/* 4 Cột đối chiếu số lượng */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4 shrink-0 text-center sm:text-right bg-card sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-neutral-100 dark:border-neutral-800">
          {/* Cần dùng */}
          <div className="space-y-0.5">
            <div className="text-[10px] sm:text-[11px] text-muted-foreground uppercase font-medium">
              Cần dùng
            </div>
            <div className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {required.formatted}
            </div>
          </div>

          {/* Đã có trong tủ */}
          <div className="space-y-0.5">
            <div className="text-[10px] sm:text-[11px] text-muted-foreground uppercase font-medium">
              Có sẵn
            </div>
            <div
              className={`text-xs sm:text-sm font-medium ${
                available.value > 0
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-muted-foreground'
              }`}
            >
              {available.formatted}
            </div>
          </div>

          {/* Cần mua thêm */}
          <div className="space-y-0.5">
            <div className="text-[10px] sm:text-[11px] text-muted-foreground uppercase font-medium">
              Cần mua
            </div>
            <div
              className={`text-xs sm:text-sm font-bold ${
                missing.value > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-neutral-400 dark:text-neutral-500'
              }`}
            >
              {missing.value > 0 ? missing.formatted : '0'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
