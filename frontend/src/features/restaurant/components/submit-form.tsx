'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorCode } from '@/lib/api-error';
import { useSubmitRestaurantMutation } from '../queries/restaurant.queries';
import {
  MAX_DISHES,
  submitRestaurantSchema,
  type SubmitRestaurantFormValues,
} from '../schemas/restaurant.schema';

/**
 * Form gửi quán mới vào hàng chờ (không hiện công khai trước duyệt).
 * Cảnh báo trùng tên khi fixture đã có quán tương tự (mô phỏng BE).
 */
export function SubmitForm({ onDone }: { onDone?: () => void }) {
  const submitMutation = useSubmitRestaurantMutation();
  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);

  const form = useForm<SubmitRestaurantFormValues>({
    resolver: zodResolver(submitRestaurantSchema),
    defaultValues: { name: '', address: '', dishes: [], note: '' },
  });

  const onSubmit = async (values: SubmitRestaurantFormValues) => {
    setDuplicateWarning(null);
    try {
      await submitMutation.mutateAsync({
        name: values.name,
        address: values.address,
        dishes: values.dishes,
        note: values.note || undefined,
      });
      form.reset();
      onDone?.();
    } catch (error) {
      if (getApiErrorCode(error) === 'VALIDATION_ERROR') {
        setDuplicateWarning('Thông tin chưa hợp lệ, vui lòng kiểm tra lại.');
      }
    }
  };

  return (
    <form
      onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="submit-name">Tên quán *</Label>
        <Input id="submit-name" placeholder="VD: Quán chay An Yên" {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="submit-address">Địa chỉ *</Label>
        <Input
          id="submit-address"
          placeholder="Số nhà, đường, quận/huyện..."
          {...form.register('address')}
        />
        {form.formState.errors.address && (
          <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="submit-dishes">
          Món nổi bật (cách nhau bằng dấu phẩy, tối đa {MAX_DISHES})
        </Label>
        <Input
          id="submit-dishes"
          placeholder="VD: Bún bò Huế chay, Cơm tấm chay"
          defaultValue=""
          onChange={(e) =>
            form.setValue(
              'dishes',
              e.target.value
                .split(',')
                .map((dish) => dish.trim())
                .filter((dish) => dish.length > 0),
              { shouldValidate: true }
            )
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="submit-note">Ghi chú thêm</Label>
        <Textarea id="submit-note" rows={2} {...form.register('note')} />
      </div>
      {duplicateWarning && <p className="text-xs text-destructive">{duplicateWarning}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={submitMutation.isPending}>
          {submitMutation.isPending ? 'Đang gửi...' : 'Gửi kiểm duyệt'}
        </Button>
      </div>
    </form>
  );
}
