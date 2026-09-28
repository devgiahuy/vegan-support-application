'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { getApiErrorCode } from '@/lib/api-error';
import { useSubmitRestaurantMutation } from '../queries/restaurant.queries';
import {
  MAX_DISHES,
  submitRestaurantSchema,
  type SubmitRestaurantFormValues,
} from '../schemas/restaurant.schema';

const DIETARY_SUGGESTIONS = ['VEGAN', 'LACTO_VEGETARIAN', 'OVO_VEGETARIAN'];

/**
 * Form gửi đề xuất quán mới do Thành viên đóng góp (FR-009).
 * Quán lưu ở trạng thái PENDING, không hiện công khai cho đến khi Admin duyệt.
 */
export function SubmitForm({ onDone }: { onDone?: () => void }) {
  const submitMutation = useSubmitRestaurantMutation();
  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);

  const form = useForm<SubmitRestaurantFormValues>({
    resolver: zodResolver(submitRestaurantSchema),
    defaultValues: {
      name: '',
      address: '',
      dietaryTags: ['VEGAN'],
      dishes: [],
      openingHours: '',
      priceRange: '',
      phoneNumber: '',
      note: '',
    },
  });

  const selectedDietary = form.watch('dietaryTags') ?? [];

  const toggleDietary = (tag: string) => {
    if (selectedDietary.includes(tag)) {
      form.setValue(
        'dietaryTags',
        selectedDietary.filter((t) => t !== tag)
      );
    } else {
      form.setValue('dietaryTags', [...selectedDietary, tag]);
    }
  };

  const onSubmit = async (values: SubmitRestaurantFormValues) => {
    setDuplicateWarning(null);
    try {
      await submitMutation.mutateAsync({
        name: values.name,
        address: values.address,
        dietaryTags: values.dietaryTags,
        dishes: values.dishes,
        openingHours: values.openingHours || undefined,
        priceRange: values.priceRange || undefined,
        phoneNumber: values.phoneNumber || undefined,
        note: values.note || undefined,
      });
      form.reset();
      onDone?.();
    } catch (error) {
      if (getApiErrorCode(error) === 'VALIDATION_ERROR') {
        setDuplicateWarning('Thông tin chưa hợp lệ, vui lòng kiểm tra lại.');
      } else {
        setDuplicateWarning('Có lỗi xảy ra khi gửi thông tin đề xuất quán.');
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
        <Label htmlFor="submit-name">Tên quán ăn *</Label>
        <Input
          id="submit-name"
          placeholder="VD: Quán Cơm Chay Diệu Tâm"
          {...form.register('name')}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="submit-address">Địa chỉ cụ thể *</Label>
        <Input
          id="submit-address"
          placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
          {...form.register('address')}
        />
        {form.formState.errors.address && (
          <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Trường phái ăn chay áp dụng</Label>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {DIETARY_SUGGESTIONS.map((tag) => {
            const isSelected = selectedDietary.includes(tag);
            return (
              <Badge
                key={tag}
                variant={isSelected ? 'default' : 'outline'}
                className="cursor-pointer select-none"
                onClick={() => toggleDietary(tag)}
              >
                {tag === 'VEGAN' ? 'Thuần chay (Vegan)' : tag}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="submit-hours">Giờ hoạt động</Label>
          <Input
            id="submit-hours"
            placeholder="VD: 07:00 - 21:00"
            {...form.register('openingHours')}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="submit-price">Khoảng giá</Label>
          <Input
            id="submit-price"
            placeholder="VD: 25.000đ - 50.000đ"
            {...form.register('priceRange')}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="submit-phone">Số điện thoại liên hệ</Label>
        <Input id="submit-phone" placeholder="VD: 0901234567" {...form.register('phoneNumber')} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="submit-dishes">
          Món nổi bật (cách nhau bởi dấu phẩy, tối đa {MAX_DISHES} món)
        </Label>
        <Input
          id="submit-dishes"
          placeholder="VD: Cơm sườn chay, Bún riêu chay, Lẩu nấm..."
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
        {form.formState.errors.dishes && (
          <p className="text-xs text-destructive">{form.formState.errors.dishes.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="submit-note">Ghi chú bổ sung</Label>
        <Textarea
          id="submit-note"
          rows={2}
          placeholder="Ví dụ: Có chỗ đậu xe máy rộng rãi, ngày rằm có tiệc buffet..."
          {...form.register('note')}
        />
      </div>

      {duplicateWarning && <p className="text-xs text-destructive">{duplicateWarning}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={() => onDone?.()}>
          Hủy
        </Button>
        <Button type="submit" disabled={submitMutation.isPending}>
          {submitMutation.isPending ? 'Đang gửi...' : 'Gửi đề xuất quán'}
        </Button>
      </div>
    </form>
  );
}
