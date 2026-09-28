'use client';

import React from 'react';
import type { MacroDistributionModel } from '../types/recipe-nutrition.model';
import { Flame } from 'lucide-react';

export interface MacroDistributionBarProps {
  macros: MacroDistributionModel;
  servings: number;
  className?: string;
}

export function MacroDistributionBar({ macros, servings, className }: MacroDistributionBarProps) {
  const {
    calories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    proteinCaloriesPercent,
    carbsCaloriesPercent,
    fatCaloriesPercent,
  } = macros;

  // Normalized widths for the visual bar (totaling 100%)
  const totalMacroGrams = proteinGrams + carbsGrams + fatGrams;
  const proteinWidthPercent = totalMacroGrams > 0 ? (proteinGrams / totalMacroGrams) * 100 : 0;
  const carbsWidthPercent = totalMacroGrams > 0 ? (carbsGrams / totalMacroGrams) * 100 : 0;
  const fatWidthPercent = totalMacroGrams > 0 ? (fatGrams / totalMacroGrams) * 100 : 0;

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 bg-card/60 border border-border/70 shadow-xs space-y-4 ${
        className || ''
      }`}
    >
      {/* Top row: Calories and servings highlight */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {calories}
              </span>
              <span className="text-sm font-semibold text-muted-foreground uppercase">kcal</span>
            </div>
            <p className="text-xs text-muted-foreground">năng lượng mỗi khẩu phần</p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
            Khẩu phần: {servings} người ăn
          </span>
        </div>
      </div>

      {/* Segmented Macro Bar (CSS hardware-accelerated transitions) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>Tỷ lệ phân bổ đa lượng chất (Macro)</span>
          <span>{totalMacroGrams > 0 ? `${totalMacroGrams.toFixed(1)}g tổng` : 'Chưa có'}</span>
        </div>

        <div
          className="h-3 w-full rounded-full overflow-hidden flex bg-muted/60"
          role="progressbar"
          aria-label="Phân bổ năng lượng Carb, Protein, Fat"
        >
          {proteinWidthPercent > 0 && (
            <div
              style={{ width: `${proteinWidthPercent}%` }}
              className="h-full bg-emerald-500 transition-all duration-300 ease-out"
              title={`Chất đạm: ${proteinGrams}g (${proteinCaloriesPercent}% calo)`}
            />
          )}
          {carbsWidthPercent > 0 && (
            <div
              style={{ width: `${carbsWidthPercent}%` }}
              className="h-full bg-amber-500 transition-all duration-300 ease-out"
              title={`Tinh bột: ${carbsGrams}g (${carbsCaloriesPercent}% calo)`}
            />
          )}
          {fatWidthPercent > 0 && (
            <div
              style={{ width: `${fatWidthPercent}%` }}
              className="h-full bg-sky-500 transition-all duration-300 ease-out"
              title={`Chất béo: ${fatGrams}g (${fatCaloriesPercent}% calo)`}
            />
          )}
        </div>
      </div>

      {/* 3 Macro Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
        {/* Protein */}
        <div className="rounded-lg p-2.5 sm:p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Đạm (Protein)
            </span>
          </div>
          <div className="text-base sm:text-lg font-bold text-foreground">{proteinGrams}g</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{proteinCaloriesPercent}% calo</p>
        </div>

        {/* Carbs */}
        <div className="rounded-lg p-2.5 sm:p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              Tinh bột (Carb)
            </span>
          </div>
          <div className="text-base sm:text-lg font-bold text-foreground">{carbsGrams}g</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{carbsCaloriesPercent}% calo</p>
        </div>

        {/* Fat */}
        <div className="rounded-lg p-2.5 sm:p-3 bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/50 dark:border-sky-800/40 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span className="text-xs font-semibold text-sky-800 dark:text-sky-300">Béo (Fat)</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-foreground">{fatGrams}g</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{fatCaloriesPercent}% calo</p>
        </div>
      </div>
    </div>
  );
}
