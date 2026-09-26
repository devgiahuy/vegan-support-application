'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RepeatedPatternWarning } from '../types/meal-program.model';

interface RepeatedPatternWarningsProps {
  warnings: RepeatedPatternWarning[];
}

export const RepeatedPatternWarnings: React.FC<RepeatedPatternWarningsProps> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) {
    return (
      <Card className="border border-emerald-200/60 dark:border-emerald-800/30 bg-emerald-50/20 dark:bg-emerald-950/10">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Độ đa dạng thực phẩm đạt chuẩn</p>
            <p className="text-xs text-muted-foreground">
              Không phát hiện món ăn nào bị lặp lại quá dày đặc trong lộ trình. Thực đơn có sự cân
              đối phong phú giữa các nhóm nguyên liệu thực vật.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/10 dark:bg-amber-950/10">
      <CardHeader className="p-4 pb-3 border-b flex flex-row items-center gap-2 space-y-0">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <CardTitle className="text-sm font-semibold text-foreground">
          Cảnh báo tần suất lặp lại món ăn ({warnings.length} món)
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground">
          Một số món ăn xuất hiện nhiều lần trong chu kỳ lộ trình. Bạn có thể cân nhắc hoán đổi sang
          các món chay tương đương để đa dạng vi chất tự nhiên:
        </p>

        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <div
              key={`${warning.mealId}-${index}`}
              className="p-3 rounded-lg bg-background border space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs text-foreground truncate">
                  {warning.mealName}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                >
                  Lặp lại {warning.occurrences} lần
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{warning.message}</p>

              {warning.dates && warning.dates.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[11px] text-muted-foreground mr-1">Các ngày:</span>
                  {warning.dates.map((dateStr) => (
                    <span
                      key={dateStr}
                      className="px-1.5 py-0.5 rounded-xs bg-muted text-[10px] font-mono"
                    >
                      {dateStr}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
