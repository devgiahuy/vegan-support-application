'use client';

import React from 'react';
import { CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { ProgramWeek } from '../types/meal-program.model';

interface ProgramTimelineViewProps {
  weeks: ProgramWeek[];
  selectedWeekNumber: number;
  onSelectWeek: (weekNumber: number) => void;
}

export const ProgramTimelineView: React.FC<ProgramTimelineViewProps> = ({
  weeks,
  selectedWeekNumber,
  onSelectWeek,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">
          Dòng thời gian các tuần ({weeks.length} tuần)
        </h3>
        <span className="text-xs text-muted-foreground">Chọn tuần để xem thực đơn & tiến độ</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {weeks.map((week) => {
          const isSelected = selectedWeekNumber === week.weekNumber;
          const isCompleted = week.status === 'COMPLETED';
          const isActive = week.status === 'ACTIVE';

          return (
            <button
              key={week.id || week.weekNumber}
              type="button"
              onClick={() => onSelectWeek(week.weekNumber)}
              className={`text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-xs -translate-y-0.5'
                  : isActive
                    ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10 hover:border-emerald-500'
                    : 'border-border bg-card hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : isActive ? (
                    <Clock className="w-4 h-4 text-primary shrink-0 animate-pulse" />
                  ) : (
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-semibold text-sm">Tuần {week.weekNumber}</span>
                </div>

                <Badge
                  variant={isCompleted ? 'default' : isActive ? 'secondary' : 'outline'}
                  className="text-[10px] px-1.5 py-0"
                >
                  {week.statusLabel}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                {week.formattedDateRange || `${week.startDate} - ${week.endDate}`}
              </p>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                  <span>Tuân thủ</span>
                  <span>{week.complianceRate}%</span>
                </div>
                <Progress value={week.complianceRate} className="h-1.5" />
              </div>

              {week.isDownstreamInvalidated && (
                <div className="mt-2.5 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Cần phân tích lại</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
