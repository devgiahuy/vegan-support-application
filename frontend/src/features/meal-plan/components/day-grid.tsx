import * as React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MealType } from '@/common/enums';
import type { MealSlot } from '../types/meal-plan.model';

const MEAL_ORDER = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER];

/** Nhãn ngày từ `YYYY-MM-DD` (thứ + dd/mm), tính theo UTC. */
function formatDayLabel(dateStr: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return dateStr;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) return dateStr;
  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const day = `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  return `${weekdays[date.getUTCDay()]}, ${day}`;
}

function SlotCard({
  slot,
  actions,
}: {
  slot: MealSlot;
  actions?: (slot: MealSlot) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border p-3">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline">{slot.mealTypeLabel}</Badge>
        {slot.filled && <span className="text-xs font-medium">{slot.formattedCalories}</span>}
      </div>
      {slot.filled ? (
        <>
          <p className="text-sm font-medium">{slot.recipeTitle}</p>
          {(slot.protein > 0 || slot.carbs > 0 || slot.fat > 0) && (
            <p className="text-xs text-muted-foreground">
              Đạm {slot.protein}g · Bột {slot.carbs}g · Béo {slot.fat}g
              {slot.servings > 0 && ` · ${slot.servings} khẩu phần`}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{slot.unfilledReason}</p>
      )}
      {actions?.(slot)}
    </div>
  );
}

/** Lưới 7 ngày × 3 bữa. Chỉ nhận Model; hành động mỗi ô (đổi món) truyền qua `actions`. */
export function DayGrid({
  items,
  actions,
}: {
  items: MealSlot[];
  actions?: (slot: MealSlot) => React.ReactNode;
}) {
  const dates = React.useMemo(() => {
    const seen = new Map<string, MealSlot[]>();
    for (const slot of items) {
      const list = seen.get(slot.date) ?? [];
      list.push(slot);
      seen.set(slot.date, list);
    }
    return [...seen.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, slots]) => ({
        date,
        slots: MEAL_ORDER.map((type) => slots.find((s) => s.mealType === type)).filter(
          (s): s is MealSlot => Boolean(s)
        ),
      }));
  }, [items]);

  if (dates.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        <UtensilsCrossed className="size-4" />
        Thực đơn này chưa có bữa nào.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {dates.map(({ date, slots }) => (
        <Card key={date}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{formatDayLabel(date)}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {slots.map((slot) => (
              <SlotCard key={slot.id} slot={slot} actions={actions} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
