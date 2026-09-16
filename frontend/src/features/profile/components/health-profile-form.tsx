'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSaveHealthProfileMutation } from '../queries/health.queries';
import { healthProfileSchema, type HealthProfileFormValues } from '../schemas/health.schema';
import type { HealthProfile } from '../types/health.model';
import { ActivityLevel, BiologicalSex } from '@/common/enums';
import { getApiErrorCode, getApiErrorFields } from '@/lib/api-error';

const SEX_OPTIONS: Array<{ value: BiologicalSex; label: string }> = [
  { value: BiologicalSex.MALE, label: 'Nam' },
  { value: BiologicalSex.FEMALE, label: 'Nữ' },
];

const ACTIVITY_OPTIONS: Array<{ value: ActivityLevel; label: string }> = [
  { value: ActivityLevel.SEDENTARY, label: 'Ít vận động (văn phòng, ngồi nhiều)' },
  { value: ActivityLevel.LIGHTLY_ACTIVE, label: 'Vận động nhẹ (yoga, đi bộ 1–3 ngày/tuần)' },
  { value: ActivityLevel.MODERATELY_ACTIVE, label: 'Vận động vừa (3–5 ngày/tuần)' },
  { value: ActivityLevel.VERY_ACTIVE, label: 'Vận động nhiều (cường độ cao 6–7 ngày/tuần)' },
  {
    value: ActivityLevel.EXTRA_ACTIVE,
    label: 'Vận động rất nhiều (lao động nặng / 2 buổi mỗi ngày)',
  },
];

/**
 * Form nhập 5 chỉ số sức khỏe. Lưu xong hiện kết quả ngay (do parent render `HealthSummary`
 * từ cache `DetailedProfile` đã invalidate).
 */
export function HealthProfileForm({ initial }: { initial?: HealthProfile | null }) {
  const saveMutation = useSaveHealthProfileMutation();
  const [formError, setFormError] = React.useState<string | null>(null);

  // `z.coerce.number()` khiến input type là `unknown` — dùng input type cho form,
  // ép sang number khi submit (runtime đã coerce, resolver đã validate).
  const form = useForm<z.input<typeof healthProfileSchema>>({
    resolver: zodResolver(healthProfileSchema),
    defaultValues: {
      heightCm: initial?.heightCm ?? undefined,
      weightKg: initial?.weightKg ?? undefined,
      age: initial?.age ?? undefined,
      sex: initial?.sex,
      activityLevel: initial?.activityLevel,
    },
  });

  React.useEffect(() => {
    if (initial) {
      form.reset({
        heightCm: initial.heightCm,
        weightKg: initial.weightKg,
        age: initial.age,
        sex: initial.sex,
        activityLevel: initial.activityLevel,
      });
    }
  }, [form, initial]);

  const onSubmit = async (values: z.input<typeof healthProfileSchema>) => {
    setFormError(null);
    try {
      await saveMutation.mutateAsync({
        heightCm: Number(values.heightCm),
        weightKg: Number(values.weightKg),
        age: Math.trunc(Number(values.age)),
        sex: values.sex,
        activityLevel: values.activityLevel,
      });
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'VALIDATION_ERROR') {
        const fields = getApiErrorFields(error);
        let mapped = false;
        if (fields) {
          for (const [key, messages] of Object.entries(fields)) {
            const map: Record<string, keyof HealthProfileFormValues> = {
              heightCm: 'heightCm',
              height_cm: 'heightCm',
              weightKg: 'weightKg',
              weight_kg: 'weightKg',
              age: 'age',
              sex: 'sex',
              activityLevel: 'activityLevel',
              activity_level: 'activityLevel',
            };
            const field = map[key];
            if (field) {
              const first = Array.isArray(messages) ? messages[0] : messages;
              form.setError(field, {
                message: typeof first === 'string' ? first : 'Giá trị không hợp lệ.',
              });
              mapped = true;
            }
          }
        }
        if (mapped) return;
      }
      setFormError('Lưu chỉ số sức khỏe thất bại. Vui lòng thử lại.');
    }
  };

  const err = form.formState.errors;

  return (
    <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="health-heightCm">Chiều cao (cm)</Label>
          <Input
            id="health-heightCm"
            type="number"
            min={0}
            step="0.1"
            placeholder="Ví dụ: 162"
            {...form.register('heightCm')}
          />
          {err.heightCm && <p className="text-xs text-destructive">{err.heightCm.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="health-weightKg">Cân nặng (kg)</Label>
          <Input
            id="health-weightKg"
            type="number"
            min={0}
            step="0.1"
            placeholder="Ví dụ: 52.5"
            {...form.register('weightKg')}
          />
          {err.weightKg && <p className="text-xs text-destructive">{err.weightKg.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="health-age">Tuổi</Label>
          <Input
            id="health-age"
            type="number"
            min={1}
            max={120}
            step={1}
            placeholder="Ví dụ: 27"
            {...form.register('age')}
          />
          {err.age && <p className="text-xs text-destructive">{err.age.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Giới tính</Label>
          <Select
            value={form.watch('sex') ?? ''}
            onValueChange={(v) => form.setValue('sex', v as BiologicalSex)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn giới tính" />
            </SelectTrigger>
            <SelectContent>
              {SEX_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {err.sex && <p className="text-xs text-destructive">{err.sex.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Mức vận động</Label>
        <Select
          value={form.watch('activityLevel') ?? ''}
          onValueChange={(v) => form.setValue('activityLevel', v as ActivityLevel)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn mức vận động" />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {err.activityLevel && (
          <p className="text-xs text-destructive">{err.activityLevel.message}</p>
        )}
      </div>

      <Button type="submit" className="rounded-full" disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Đang lưu...' : 'Lưu chỉ số sức khỏe'}
      </Button>
    </form>
  );
}
