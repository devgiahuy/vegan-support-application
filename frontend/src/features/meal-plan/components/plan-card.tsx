import { DietaryPlanNotice } from '@/features/diet-preferences/components/dietary-plan-notice';
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
import { cn } from '@/lib/utils';
import type { MealPlan } from '../types/meal-plan.model';

interface PlanCardProps {
  plan: MealPlan;
  className?: string;
}

/** Card tóm tắt 1 phiên bản thực đơn. Chỉ nhận Model. */
export function PlanCard({ plan, className }: PlanCardProps) {
  return (
    <Card
      className={cn(
        'group flex h-full flex-col justify-between transition-all duration-200 hover:border-primary/40 hover:shadow-sm',
        className
      )}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
            Ngày {plan.formattedWeekRange}
          </CardTitle>
          <Badge variant="secondary" className="shrink-0 text-xs font-normal">
            {plan.goalLabel}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Bản {plan.version} — {plan.filledSlots}/{plan.totalSlots} bữa đã lấp
          {plan.warnings.length > 0 && (
            <span className="font-medium text-amber-600 dark:text-amber-400">
              {` — ${plan.warnings.length} lưu ý`}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-1 pb-3">
        <DietaryPlanNotice
          compatibility={plan.compatibility}
          planIds={[plan.id]}
          showTitle={false}
        />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Flame className="size-3.5 text-orange-500" />
          Mục tiêu ~{plan.targetCalories} kcal/ngày
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto text-xs h-8">
          <Link href={`/meal-plans/${plan.id}`}>
            Xem chi tiết
            <ArrowRight data-icon="inline-end" className="size-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
