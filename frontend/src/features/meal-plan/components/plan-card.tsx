import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { MealPlan } from '../types/meal-plan.model';

/** Card tóm tắt 1 phiên bản thực đơn. Chỉ nhận Model. */
export function PlanCard({ plan }: { plan: MealPlan }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Tuần {plan.formattedWeekRange}</CardTitle>
          <Badge variant="secondary">{plan.goalLabel}</Badge>
        </div>
        <CardDescription>
          Bản {plan.version} — {plan.filledSlots}/{plan.totalSlots} bữa đã lấp
          {plan.warnings.length > 0 && ` — ${plan.warnings.length} lưu ý`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Flame className="size-4" />
          Mục tiêu {plan.targetCalories} kcal/ngày
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm">
          <Link href={`/meal-plans/${plan.id}`}>
            Xem chi tiết
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
