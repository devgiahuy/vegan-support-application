'use client';

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { UncoveredIngredientModel } from '../types/recipe-nutrition.model';

export interface UncoveredIngredientsAlertProps {
  uncoveredIngredients: UncoveredIngredientModel[];
  confidenceScore: number;
  className?: string;
}

export function UncoveredIngredientsAlert({
  uncoveredIngredients,
  confidenceScore,
  className,
}: UncoveredIngredientsAlertProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!uncoveredIngredients || uncoveredIngredients.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-xl border border-amber-300/80 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/30 p-4 transition-all ${
        className || ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-md bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Có {uncoveredIngredients.length} nguyên liệu chưa có dữ liệu thành phần chuẩn
            </h4>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-200/60 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
              Độ bao phủ: {confidenceScore}%
            </span>
          </div>

          <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
            Số liệu dinh dưỡng hiển thị là mức tối thiểu đã xác định từ các nguyên liệu đã biết. Các
            nguyên liệu thiếu chưa được tính vào tổng năng lượng.
          </p>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:underline mt-2.5 cursor-pointer focus:outline-hidden"
          >
            <span>
              {isOpen ? 'Thu gọn danh sách nguyên liệu' : 'Xem chi tiết các nguyên liệu thiếu'}
            </span>
            {isOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {isOpen && (
            <ul className="mt-3 space-y-2 border-t border-amber-200/60 dark:border-amber-800/40 pt-2.5 text-xs">
              {uncoveredIngredients.map((item, idx) => (
                <li
                  key={`${item.displayName}-${idx}`}
                  className="flex items-start gap-2 bg-amber-100/50 dark:bg-amber-900/20 p-2 rounded-md"
                >
                  <Info className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-amber-950 dark:text-amber-100">
                      {item.displayName}
                    </span>
                    <span className="text-amber-800/80 dark:text-amber-300/80 ml-1.5">
                      ({item.reason})
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
