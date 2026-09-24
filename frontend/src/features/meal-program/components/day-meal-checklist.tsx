'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, CalendarCheck, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateWeekProgressMutation } from '../queries/meal-program.queries';
import type { ProgramWeek } from '../types/meal-program.model';

interface DayMealChecklistProps {
  programId: string;
  week: ProgramWeek;
  version: number;
}

export const DayMealChecklist: React.FC<DayMealChecklistProps> = ({ programId, week, version }) => {
  const updateProgressMutation = useUpdateWeekProgressMutation(programId);
  const [completedMealIds, setCompletedMealIds] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const days = week.snapshot?.days || [];

  const handleToggleMeal = (mealId: string) => {
    setCompletedMealIds((prev) => {
      const next = prev.includes(mealId) ? prev.filter((id) => id !== mealId) : [...prev, mealId];
      setHasChanges(true);
      return next;
    });
  };

  const handleSaveProgress = async () => {
    try {
      await updateProgressMutation.mutateAsync({
        weekNumber: week.weekNumber,
        data: {
          version,
          completed_meal_ids: completedMealIds,
        },
      });

      toast.success('Đã lưu tiến độ hoàn thành các bữa ăn!');
      setHasChanges(false);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu tiến độ. Vui lòng thử lại.';
      toast.error(errorMsg);
    }
  };

  if (!days.length) return null;

  return (
    <Card className="border">
      <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-primary" />
          <CardTitle className="text-base font-semibold">
            Đánh dấu tiến độ Tuần {week.weekNumber}
          </CardTitle>
        </div>

        {hasChanges && (
          <Button
            size="sm"
            onClick={handleSaveProgress}
            disabled={updateProgressMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
          >
            {updateProgressMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Lưu tiến độ
              </>
            )}
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <p className="text-xs text-muted-foreground">
          Tích chọn các bữa ăn bạn đã thực hiện trong tuần này để cập nhật tỷ lệ tuân thủ thực tế.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {days.map((day) => (
            <div key={day.date} className="p-3 rounded-lg bg-muted/30 border space-y-2">
              <span className="text-xs font-semibold text-foreground block border-b pb-1">
                {day.formattedDate || day.date}
              </span>

              <div className="space-y-1.5 pt-1">
                {day.meals.map((meal) => {
                  const isChecked = completedMealIds.includes(meal.id);

                  return (
                    <label
                      key={meal.id}
                      className="flex items-start gap-2 cursor-pointer p-1.5 rounded-md hover:bg-background transition-colors text-xs"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleToggleMeal(meal.id)}
                        className="mt-0.5"
                      />
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p
                          className={`font-medium truncate ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                        >
                          {meal.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <span>{meal.mealTypeLabel}</span>
                          <span>•</span>
                          <span>{meal.calories} Kcal</span>
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
