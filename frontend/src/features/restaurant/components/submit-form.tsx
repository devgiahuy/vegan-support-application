'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getApiErrorCode } from '@/lib/api-error';
import { useSubmitRestaurantMutation } from '../queries/restaurant.queries';
import {
  submitRestaurantSchema,
  type SubmitRestaurantFormValues,
} from '../schemas/restaurant.schema';

const DIETARY_SUGGESTIONS = ['VEGAN', 'LACTO_OVO', 'BUDDHIST', 'CHRISTIAN'];

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
    },
  });

  const selectedDietary = useWatch({ control: form.control, name: 'dietaryTags' }) ?? [];

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
        dishes: [],
        lat: values.lat,
        lng: values.lng,
      });
      form.reset();
      onDone?.();
    } catch (error) {
      if (getApiErrorCode(error) === 'RESTAURANT_DUPLICATE') {
        setDuplicateWarning('Quán này đã có trong danh sách hoặc đang chờ duyệt.');
      } else if (getApiErrorCode(error) === 'VALIDATION_ERROR') {
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
          <Label htmlFor="submit-lat">Vĩ độ của quán *</Label>
          <Input
            id="submit-lat"
            type="number"
            step="any"
            {...form.register('lat', { valueAsNumber: true })}
          />
          {form.formState.errors.lat && (
            <p className="text-xs text-destructive">{form.formState.errors.lat.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="submit-lng">Kinh độ của quán *</Label>
          <Input
            id="submit-lng"
            type="number"
            step="any"
            {...form.register('lng', { valueAsNumber: true })}
          />
          {form.formState.errors.lng && (
            <p className="text-xs text-destructive">{form.formState.errors.lng.message}</p>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Nhập tọa độ của quán trên bản đồ. Thông tin chế độ ăn sẽ được quản trị viên xem xét.
      </p>

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
