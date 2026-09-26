'use client';

import React from 'react';
import { Flame, Activity, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { CumulativeAnalysis, ProgramWeek } from '../types/meal-program.model';

interface CumulativeNutritionChartProps {
  analysis: CumulativeAnalysis;
  weeks: ProgramWeek[];
}

export const CumulativeNutritionChart: React.FC<CumulativeNutritionChartProps> = ({
  analysis,
  weeks,
}) => {
  const { averageDailyCalories, averageMacronutrients } = analysis;

  // Tính tỷ lệ phần trăm calo từ macronutrients: Protein (4 kcal/g), Carbs (4 kcal/g), Fat (9 kcal/g)
  const proteinKcal = averageMacronutrients.protein * 4;
  const carbsKcal = averageMacronutrients.carbs * 4;
  const fatKcal = averageMacronutrients.fat * 9;
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal || 1;

  const proteinPct = Math.round((proteinKcal / totalMacroKcal) * 100);
  const carbsPct = Math.round((carbsKcal / totalMacroKcal) * 100);
  const fatPct = Math.round((fatKcal / totalMacroKcal) * 100);

  return (
    <div className="space-y-6">
      {/* Khối năng lượng trung bình */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50/30 dark:from-orange-950/20 dark:to-background border-orange-200/60 dark:border-orange-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Năng lượng trung bình ngày
              </p>
              <p className="text-xl font-bold text-foreground">
                {averageDailyCalories.toLocaleString()}{' '}
                <span className="text-xs font-normal text-muted-foreground">Kcal/ngày</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50/30 dark:from-emerald-950/20 dark:to-background border-emerald-200/60 dark:border-emerald-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Chất đạm trung bình</p>
              <p className="text-xl font-bold text-foreground">
                {averageMacronutrients.protein}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  g/ngày ({proteinPct}%)
                </span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50/30 dark:from-teal-950/20 dark:to-background border-teal-200/60 dark:border-teal-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Chất xơ tự nhiên</p>
              <p className="text-xl font-bold text-foreground">
                {averageMacronutrients.fiber}{' '}
                <span className="text-xs font-normal text-muted-foreground">g/ngày</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Phân bổ tỷ lệ đa lượng (Macronutrient Distribution) */}
      <Card className="border">
        <CardHeader className="p-4 pb-3 border-b">
          <CardTitle className="text-sm font-semibold">
            Tỷ lệ phân bổ năng lượng từ các chất đa lượng (AMDR)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Thanh màu tổng hợp */}
          <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted">
            <div
              style={{ width: `${proteinPct}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`Chất đạm: ${proteinPct}%`}
            />
            <div
              style={{ width: `${carbsPct}%` }}
              className="bg-amber-500 transition-all duration-500"
              title={`Tinh bột: ${carbsPct}%`}
            />
            <div
              style={{ width: `${fatPct}%` }}
              className="bg-rose-500 transition-all duration-500"
              title={`Chất béo: ${fatPct}%`}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 shrink-0" />
              <span>
                <strong>Đạm:</strong> {averageMacronutrients.protein}g ({proteinPct}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-amber-500 shrink-0" />
              <span>
                <strong>Tinh bột:</strong> {averageMacronutrients.carbs}g ({carbsPct}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-rose-500 shrink-0" />
              <span>
                <strong>Chất béo:</strong> {averageMacronutrients.fat}g ({fatPct}%)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* So sánh năng lượng từng tuần */}
      {weeks.length > 0 && (
        <Card className="border">
          <CardHeader className="p-4 pb-3 border-b">
            <CardTitle className="text-sm font-semibold">
              Mức năng lượng trung bình qua các tuần trong lộ trình
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {weeks.map((week) => {
              const weekCal = week.snapshot?.totalCalories || 0;
              const dailyAvg = Math.round(weekCal / 7);
              const maxScale = Math.max(averageDailyCalories * 1.3, 2500);
              const pct = Math.min(Math.round((dailyAvg / maxScale) * 100), 100);

              return (
                <div key={week.id || week.weekNumber} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>
                      Tuần {week.weekNumber} ({week.statusLabel})
                    </span>
                    <span>{dailyAvg.toLocaleString()} Kcal/ngày</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
