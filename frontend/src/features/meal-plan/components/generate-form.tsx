'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MealPlanGoal } from '@/common/enums';
import { getApiErrorCode, getApiErrorFields } from '@/lib/api-error';
import { useGenerateMealPlanMutation } from '../queries/meal-plan.queries';
import {
  currentWeekMonday,
  generateMealPlanSchema,
  type GenerateMealPlanFormValues,
} from '../schemas/meal-plan.schema';
import type { MealPlan } from '../types/meal-plan.model';
import { newIdempotencyKey } from '../utils/idempotency';

const GOAL_OPTIONS: Array<{ value: MealPlanGoal; label: string; hint: string }> = [
  { value: MealPlanGoal.MAINTAIN, label: 'Giữ cân', hint: 'Ăn đủ năng lượng duy trì' },
  { value: MealPlanGoal.LOSE, label: 'Giảm cân', hint: 'Thâm hụt nhẹ, đủ đạm' },
  { value: MealPlanGoal.GAIN, label: 'Tăng cân', hint: 'Dư nhẹ, tăng cơ lành mạnh' },
];

/**
 * Form tạo thực đơn tuần: Thứ Hai + mục tiêu + tạo lại từ phiên bản cũ (tùy chọn).
 * Chỉ nhận Model (`recentPlans`); submit qua `useGenerateMealPlanMutation`.
 */
export function GenerateForm({ recentPlans }: { recentPlans: MealPlan[] }) {
  const generateMutation = useGenerateMealPlanMutation();
  const [scheduleRequired, setScheduleRequired] = React.useState<string[] | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<GenerateMealPlanFormValues>({
    resolver: zodResolver(generateMealPlanSchema),
    defaultValues: {
      weekStart: currentWeekMonday(),
      goal: MealPlanGoal.MAINTAIN,
      supersedesMealPlanId: '',
    },
  });
  // State cục bộ cho RadioGroup/Select (tránh `form.watch` khiến React Compiler bỏ memo).
  const [goal, setGoal] = React.useState<MealPlanGoal>(MealPlanGoal.MAINTAIN);
  const [supersedes, setSupersedes] = React.useState('new');

  const onSubmit = async (values: GenerateMealPlanFormValues) => {
    setFormError(null);
    setScheduleRequired(null);
    try {
      await generateMutation.mutateAsync({
        weekStart: values.weekStart,
        goal: values.goal,
        idempotencyKey: newIdempotencyKey(),
        ...(values.supersedesMealPlanId
          ? { supersedesMealPlanId: values.supersedesMealPlanId }
          : {}),
      });
    } catch (error) {
      if (getApiErrorCode(error) === 'DIET_SCHEDULE_REQUIRED') {
        const fields = getApiErrorFields(error);
        const dates = fields?.['availableDates'];
        setScheduleRequired(
          Array.isArray(dates) ? dates.filter((d): d is string => typeof d === 'string') : []
        );
        return;
      }
      if (getApiErrorCode(error) === 'HEALTH_PROFILE_INCOMPLETE') {
        setFormError(
          'Bạn chưa có hồ sơ sức khỏe. Hãy cập nhật ở trang cá nhân trước khi tạo thực đơn.'
        );
        return;
      }
      setFormError('Không thể tạo thực đơn. Vui lòng thử lại.');
    }
  };

  return (
    <form
      onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
      className="flex flex-col gap-4"
      noValidate
    >
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            {formError}{' '}
            <Link href="/profile" className="font-medium underline">
              Tới hồ sơ sức khỏe
            </Link>
          </span>
        </div>
      )}

      {scheduleRequired !== null && (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>Bạn đang theo chế độ chay kỳ</AlertTitle>
          <AlertDescription>
            Vui lòng chọn ít nhất một ngày chay trong tuần ở{' '}
            <Link href="/profile" className="font-medium text-primary underline">
              hồ sơ chế độ ăn
            </Link>{' '}
            rồi tạo lại thực đơn.
            {scheduleRequired.length > 0 && (
              <span className="mt-1 block">Ngày khả dụng: {scheduleRequired.join(', ')}.</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="meal-week-start">Tuần bắt đầu (Thứ Hai)</Label>
        <Input id="meal-week-start" type="date" {...form.register('weekStart')} />
        {form.formState.errors.weekStart && (
          <p className="text-xs text-destructive">{form.formState.errors.weekStart.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Mục tiêu</Label>
        <RadioGroup
          value={goal}
          onValueChange={(value) => {
            const next = value as MealPlanGoal;
            setGoal(next);
            form.setValue('goal', next, { shouldValidate: true });
          }}
          className="grid gap-2 sm:grid-cols-3"
        >
          {GOAL_OPTIONS.map((option) => (
            <div key={option.value}>
              <RadioGroupItem
                value={option.value}
                id={`goal-${option.value}`}
                className="sr-only"
              />
              <Label
                htmlFor={`goal-${option.value}`}
                className="flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors has-checked:border-primary has-checked:bg-primary/5"
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.hint}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
        {form.formState.errors.goal && (
          <p className="text-xs text-destructive">{form.formState.errors.goal.message}</p>
        )}
      </div>

      {recentPlans.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meal-supersedes">Tạo lại từ phiên bản (tùy chọn)</Label>
          <Select
            value={supersedes}
            onValueChange={(value) => {
              setSupersedes(value);
              form.setValue('supersedesMealPlanId', value === 'new' ? '' : value);
            }}
          >
            <SelectTrigger id="meal-supersedes">
              <SelectValue placeholder="Tạo mới hoàn toàn" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="new">Tạo mới hoàn toàn</SelectItem>
                {recentPlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.formattedWeekRange} — {plan.goalLabel} (bản {plan.version})
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" disabled={generateMutation.isPending}>
        <Sparkles data-icon="inline-start" />
        {generateMutation.isPending ? 'Đang tạo thực đơn...' : 'Tạo thực đơn tuần'}
      </Button>
    </form>
  );
}
