'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  CalendarIcon,
  Loader2,
  Sparkles,
  Clock,
  Target,
  Flame,
  Scale,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCreateMealProgramMutation } from '../queries/meal-program.queries';
import type { MealProgramGoalDto } from '../types/meal-program.dto';
import {
  formatVietnameseDate,
  getNextMonday,
  getUpcomingMondays,
  isMonday,
  snapToNextMonday,
} from '../utils/meal-program-date.utils';

const GOAL_OPTIONS: Array<{
  value: MealProgramGoalDto;
  title: string;
  badge: string;
  desc: string;
  icon: typeof Flame;
}> = [
  {
    value: 'LOSE',
    title: 'Giảm cân & Thanh lọc',
    badge: 'Calorie Deficit',
    desc: 'Tập trung rau củ, chất xơ dồi dào, thâm hụt calo nhẹ nhàng mà vẫn giữ trọn vi chất và năng lượng hoạt động.',
    icon: Flame,
  },
  {
    value: 'MAINTAIN',
    title: 'Duy trì vóc dáng',
    badge: 'Balanced Nutrients',
    desc: 'Cân bằng các nhóm chất vi & đa lượng khoa học, đa dạng nguồn đạm thực vật, giữ cơ thể luôn nhẹ nhàng và bền bỉ.',
    icon: Scale,
  },
  {
    value: 'GAIN',
    title: 'Tăng cân & Tăng cơ',
    badge: 'Hypertrophy & Fuel',
    desc: 'Mật độ calo cao lành mạnh từ các loại hạt, đậu và ngũ cốc nguyên cám, tối ưu phát triển cơ bắp thuần chay.',
    icon: Dumbbell,
  },
];

const HORIZON_OPTIONS = [
  { weeks: 2, label: '2 Tuần (14 ngày)', desc: 'Thử nghiệm & hình thành thói quen ăn chay' },
  { weeks: 4, label: '4 Tuần (28 ngày)', desc: 'Lộ trình chuẩn điều hòa dinh dưỡng & thể trạng' },
  { weeks: 8, label: '8 Tuần (56 ngày)', desc: 'Chuyển hóa lối sống lâu dài & cải thiện sức khỏe' },
  { weeks: 12, label: '12 Tuần (84 ngày)', desc: 'Chiến lược dinh dưỡng toàn diện tối ưu hóa' },
];

const createProgramSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Tiêu đề lộ trình phải có ít nhất 3 ký tự')
    .max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
  goal: z.enum(['LOSE', 'MAINTAIN', 'GAIN'], {
    message: 'Vui lòng chọn mục tiêu dinh dưỡng',
  }),
  horizonWeeks: z
    .number()
    .int()
    .min(2, 'Thời lượng lộ trình tối thiểu là 2 tuần')
    .max(12, 'Thời lượng lộ trình tối đa là 12 tuần'),
  startDate: z
    .string()
    .min(10, 'Vui lòng chọn ngày bắt đầu hợp lệ')
    .refine(
      (val) => isMonday(val),
      'Ngày bắt đầu phải là Thứ Hai (đầu tuần) để khớp chu kỳ dinh dưỡng'
    ),
  timezone: z.string().min(1, 'Múi giờ không hợp lệ'),
});

type CreateProgramFormData = z.infer<typeof createProgramSchema>;

export const ProgramCreateForm: React.FC = () => {
  const router = useRouter();
  const createMutation = useCreateMealProgramMutation();

  const detectedTimezone =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'Asia/Ho_Chi_Minh';

  const initialMonday = getNextMonday();
  const upcomingMondays = getUpcomingMondays(3);

  const [dateAdjustedNotice, setDateAdjustedNotice] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProgramFormData>({
    resolver: zodResolver(createProgramSchema),
    defaultValues: {
      title: '',
      goal: 'MAINTAIN',
      horizonWeeks: 4,
      startDate: initialMonday,
      timezone: detectedTimezone,
    },
  });

  const selectedGoal = watch('goal');
  const selectedWeeks = watch('horizonWeeks');
  const selectedStartDate = watch('startDate');

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (!rawVal) {
      setValue('startDate', '');
      return;
    }

    if (isMonday(rawVal)) {
      setValue('startDate', rawVal, { shouldValidate: true });
      setDateAdjustedNotice(null);
    } else {
      const snapped = snapToNextMonday(rawVal);
      setValue('startDate', snapped, { shouldValidate: true });
      setDateAdjustedNotice(
        `Lộ trình yêu cầu ngày bắt đầu là Thứ Hai. Đã tự động điều chỉnh sang ${formatVietnameseDate(
          snapped
        )}.`
      );
    }
  };

  const handleSelectQuickMonday = (mondayIso: string) => {
    setValue('startDate', mondayIso, { shouldValidate: true });
    setDateAdjustedNotice(null);
  };

  const onSubmit = async (data: CreateProgramFormData) => {
    try {
      const created = await createMutation.mutateAsync({
        title: data.title.trim(),
        goal: data.goal,
        startDate: data.startDate,
        timezone: data.timezone,
        horizonWeeks: data.horizonWeeks,
        alternativesPerWeek: 2,
      });

      toast.success('Khởi tạo lộ trình dinh dưỡng thành công!');
      router.push(`/meal-programs/${created.id}`);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo lộ trình. Vui lòng thử lại.';
      toast.error(errorMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
      {/* 1. Tên lộ trình */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold">
          Tên lộ trình <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Ví dụ: 21 ngày làm quen với thuần chay, Thử thách thanh lọc 4 tuần..."
          {...register('title')}
          disabled={createMutation.isPending}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      {/* 2. Mục tiêu dinh dưỡng */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">
            Mục tiêu dinh dưỡng & sức khỏe <span className="text-destructive">*</span>
          </Label>
          <span className="text-xs text-muted-foreground">Chọn 1 mục tiêu trọng tâm</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {GOAL_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedGoal === option.value;
            return (
              <div
                key={option.value}
                onClick={() => setValue('goal', option.value, { shouldValidate: true })}
                className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-lg shrink-0 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{option.title}</p>
                      <Badge variant={isSelected ? 'default' : 'secondary'} className="text-[10px]">
                        {option.badge}
                      </Badge>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{option.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {errors.goal && <p className="text-xs text-destructive">{errors.goal.message}</p>}
      </div>

      {/* 3. Thời lượng lộ trình */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Thời lượng lộ trình <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={String(selectedWeeks)}
          onValueChange={(val) => setValue('horizonWeeks', Number(val), { shouldValidate: true })}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          disabled={createMutation.isPending}
        >
          {HORIZON_OPTIONS.map((option) => (
            <Label key={option.weeks} htmlFor={`weeks-${option.weeks}`} className="cursor-pointer">
              <Card
                className={`p-3.5 transition-all border ${
                  selectedWeeks === option.weeks
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <CardContent className="p-0 flex items-start gap-3">
                  <RadioGroupItem
                    value={String(option.weeks)}
                    id={`weeks-${option.weeks}`}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{option.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Label>
          ))}
        </RadioGroup>
        {errors.horizonWeeks && (
          <p className="text-xs text-destructive">{errors.horizonWeeks.message}</p>
        )}
      </div>

      {/* 4. Ngày bắt đầu & Múi giờ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-base font-semibold flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Ngày bắt đầu (Thứ Hai) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="startDate"
            type="date"
            value={selectedStartDate || ''}
            onChange={handleDateChange}
            disabled={createMutation.isPending}
          />

          {/* Quick selection pills for upcoming Mondays */}
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] text-muted-foreground font-medium">Gợi ý ngày Thứ Hai:</p>
            <div className="flex flex-wrap gap-1.5">
              {upcomingMondays.map((mon) => (
                <button
                  type="button"
                  key={mon.dateStr}
                  onClick={() => handleSelectQuickMonday(mon.dateStr)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    selectedStartDate === mon.dateStr
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-muted hover:border-foreground/30 text-muted-foreground'
                  }`}
                >
                  {mon.label}
                </button>
              ))}
            </div>
          </div>

          {dateAdjustedNotice && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{dateAdjustedNotice}</span>
            </div>
          )}

          {errors.startDate && (
            <p className="text-xs text-destructive">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone" className="text-base font-semibold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            Múi giờ tính toán
          </Label>
          <Input
            id="timezone"
            {...register('timezone')}
            disabled
            className="bg-muted text-muted-foreground cursor-not-allowed"
          />
          <p className="text-[11px] text-muted-foreground">
            Tự động đồng bộ theo múi giờ thiết bị của bạn ({detectedTimezone})
          </p>
        </div>
      </div>

      {/* Thông tin bản nháp */}
      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 p-4 text-sm text-emerald-900 dark:text-emerald-200 flex gap-3 items-start">
        <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-xs uppercase tracking-wide">
            Cơ chế Bản nháp (Draft Boundary):
          </p>
          <p className="text-xs opacity-90 leading-relaxed">
            Chương trình được tạo sẽ ở trạng thái <strong>Bản nháp</strong>. Bạn có thể tự do xem
            trước thực đơn từng tuần, kiểm tra dinh dưỡng và tần suất lặp món trước khi bấm xác
            nhận. 100% món ăn sẽ tuân thủ nghiêm ngặt dị ứng và nhóm ăn chay trong hồ sơ của bạn.
          </p>
        </div>
      </div>

      {/* Submit / Cancel Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={createMutation.isPending}
        >
          Hủy bỏ
        </Button>
        <Button type="submit" disabled={createMutation.isPending} className="min-w-[140px]">
          {createMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang khởi tạo...
            </>
          ) : (
            <>
              <Target className="w-4 h-4 mr-2" />
              Tạo lộ trình
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
