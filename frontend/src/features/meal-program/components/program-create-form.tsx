'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CalendarIcon, Loader2, Sparkles, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { useCreateMealProgramMutation } from '../queries/meal-program.queries';

const createProgramSchema = z.object({
  title: z
    .string()
    .min(3, 'Tiêu đề lộ trình phải có ít nhất 3 ký tự')
    .max(100, 'Tiêu đề không được vượt quá 100 ký tự'),
  goal: z
    .string()
    .min(5, 'Mục tiêu dinh dưỡng phải có ít nhất 5 ký tự')
    .max(250, 'Mục tiêu không được vượt quá 250 ký tự'),
  horizonWeeks: z.number().refine((val) => [2, 4, 8].includes(val), {
    message: 'Thời lượng lộ trình phải là 2, 4 hoặc 8 tuần',
  }),
  startDate: z.string().min(10, 'Vui lòng chọn ngày bắt đầu hợp lệ'),
  timezone: z.string(),
});

type CreateProgramFormData = z.infer<typeof createProgramSchema>;

export const ProgramCreateForm: React.FC = () => {
  const router = useRouter();
  const createMutation = useCreateMealProgramMutation();

  // Mặc định ngày bắt đầu là Thứ Hai gần nhất hoặc ngày mai
  const getNextMondayOrTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const detectedTimezone =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'Asia/Ho_Chi_Minh';

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
      goal: '',
      horizonWeeks: 4,
      startDate: getNextMondayOrTomorrow(),
      timezone: detectedTimezone,
    },
  });

  const selectedWeeks = watch('horizonWeeks');

  const onSubmit = async (data: CreateProgramFormData) => {
    try {
      const created = await createMutation.mutateAsync({
        title: data.title,
        goal: data.goal,
        start_date: data.startDate,
        timezone: data.timezone,
        horizon_weeks: data.horizonWeeks,
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
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold">
          Tên lộ trình <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Ví dụ: 21 ngày làm quen với thuần chay, Tăng cơ 4 tuần..."
          {...register('title')}
          disabled={createMutation.isPending}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal" className="text-base font-semibold">
          Mục tiêu dinh dưỡng & sức khỏe <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="goal"
          rows={3}
          placeholder="Ví dụ: Giảm mỡ thừa, thanh lọc tiêu hóa, nạp đủ 80g protein thực vật mỗi ngày..."
          {...register('goal')}
          disabled={createMutation.isPending}
        />
        {errors.goal && <p className="text-xs text-destructive">{errors.goal.message}</p>}
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Thời lượng lộ trình <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={String(selectedWeeks)}
          onValueChange={(val) => setValue('horizonWeeks', Number(val))}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
          disabled={createMutation.isPending}
        >
          {[
            { weeks: 2, label: '2 Tuần (14 ngày)', desc: 'Thử nghiệm & hình thành thói quen' },
            { weeks: 4, label: '4 Tuần (28 ngày)', desc: 'Lộ trình chuẩn điều hòa dinh dưỡng' },
            { weeks: 8, label: '8 Tuần (56 ngày)', desc: 'Chuyển hóa lối sống lâu dài' },
          ].map((option) => (
            <Label key={option.weeks} htmlFor={`weeks-${option.weeks}`} className="cursor-pointer">
              <Card
                className={`p-4 transition-all border-2 ${
                  selectedWeeks === option.weeks
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <CardContent className="p-0 flex items-start gap-3">
                  <RadioGroupItem
                    value={String(option.weeks)}
                    id={`weeks-${option.weeks}`}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.desc}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-base font-semibold flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Ngày bắt đầu
          </Label>
          <Input
            id="startDate"
            type="date"
            {...register('startDate')}
            disabled={createMutation.isPending}
          />
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
        </div>
      </div>

      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 p-4 text-sm text-emerald-900 dark:text-emerald-200 flex gap-3 items-start">
        <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Lưu ý về Bản nháp (Draft Boundary):</p>
          <p className="text-xs opacity-90 leading-relaxed">
            Chương trình được tạo sẽ ở trạng thái <strong>Bản nháp</strong>. Bạn có thể tự do xem
            trước thực đơn từng tuần, đổi món hoặc sinh lại cho từng tuần trước khi bấm xác nhận
            chính thức. 100% món ăn sẽ tuân thủ nghiêm ngặt các khai báo dị ứng trong hồ sơ của bạn.
          </p>
        </div>
      </div>

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
