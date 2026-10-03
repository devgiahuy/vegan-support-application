'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { getApiErrorCode } from '@/lib/api-error';
import { RestaurantDietTag } from '@/common/enums';
import { useSubmitRestaurantMutation } from '../queries/restaurant.queries';
import {
  submitRestaurantSchema,
  type SubmitRestaurantFormValues,
} from '../schemas/restaurant.schema';

const DIET_TAG_OPTIONS: { value: RestaurantDietTag; label: string }[] = [
  { value: RestaurantDietTag.VEGAN, label: 'Thuần chay (Vegan)' },
  { value: RestaurantDietTag.LACTO_OVO, label: 'Chay có sữa và trứng' },
  { value: RestaurantDietTag.BUDDHIST, label: 'Chay kiểng Phật' },
  { value: RestaurantDietTag.CHRISTIAN, label: 'Chay kiểng Kitô' },
];

/** Nhãn mã trùng lặp → thông báo tiếng Việt. */
const DUPLICATE_MESSAGES: Record<string, string> = {
  DUPLICATE_RESTAURANT:
    'Quán này đã có trong hệ thống. Bạn vẫn có thể gửi để chúng tôi kiểm tra thêm.',
  RESTAURANT_ALREADY_EXISTS:
    'Quán này đã có trong hệ thống. Bạn vẫn có thể gửi để chúng tôi kiểm tra thêm.',
};

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 30);
}

/**
 * Form gửi đề xuất quán mới (FR-032..FR-036).
 *
 * Bám đúng `submitRestaurantSchema` của backend (`.strict()`):
 * `name`, `address`, `latitude`, `longitude` là bắt buộc; `dietTags` chỉ nhận 4 giá trị enum.
 * Quán lưu ở trạng thái chờ duyệt, không hiện công khai cho đến khi quản trị viên duyệt.
 */
export function SubmitForm({ onDone }: { onDone?: () => void }) {
  const submitMutation = useSubmitRestaurantMutation();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<SubmitRestaurantFormValues>({
    resolver: zodResolver(submitRestaurantSchema),
    defaultValues: {
      name: '',
      address: '',
      latitude: 0,
      longitude: 0,
      categories: [],
      dietTags: [RestaurantDietTag.VEGAN],
      allergenFreeCodes: [],
      excludedIngredients: [],
    },
  });

  const selectedDietTags = form.watch('dietTags') ?? [];
  const latitude = form.watch('latitude');
  const longitude = form.watch('longitude');
  const hasCoordinates =
    Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0);

  const toggleDietTag = (tag: RestaurantDietTag) => {
    form.setValue(
      'dietTags',
      selectedDietTags.includes(tag)
        ? selectedDietTags.filter((item) => item !== tag)
        : [...selectedDietTags, tag]
    );
  };

  const onSubmit = async (values: SubmitRestaurantFormValues) => {
    setSubmitError(null);
    try {
      await submitMutation.mutateAsync({
        name: values.name,
        address: values.address,
        latitude: values.latitude,
        longitude: values.longitude,
        categories: values.categories,
        dietTags: values.dietTags,
        allergenFreeCodes: values.allergenFreeCodes,
        excludedIngredients: values.excludedIngredients,
      });
      form.reset();
      onDone?.();
    } catch (error) {
      const code = getApiErrorCode(error);
      const duplicateMessage = code ? DUPLICATE_MESSAGES[code] : undefined;
      setSubmitError(
        duplicateMessage ??
          (code === 'VALIDATION_ERROR'
            ? 'Thông tin chưa hợp lệ, vui lòng kiểm tra lại.'
            : 'Có lỗi xảy ra khi gửi thông tin đề xuất quán.')
      );
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
        <Label htmlFor="submit-latitude">Vĩ độ *</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="submit-latitude"
              className="pl-9"
              placeholder="10.776"
              {...form.register('latitude')}
            />
          </div>
          <Input placeholder="106.700" {...form.register('longitude')} aria-label="Kinh độ" />
        </div>
        <p className="text-xs text-muted-foreground">
          Quán phải có vị trí để hiển thị trên bản đồ. Nhập tọa độ lấy từ Google Maps nếu quán chưa
          có trong hệ thống.
        </p>
        {!hasCoordinates && (
          <p className="text-xs text-destructive">
            Vui lòng nhập tọa độ quán trước khi gửi đề xuất.
          </p>
        )}
        {(form.formState.errors.latitude?.message ?? form.formState.errors.longitude?.message) && (
          <p className="text-xs text-destructive">
            {form.formState.errors.latitude?.message ?? form.formState.errors.longitude?.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Trường phái ăn chay áp dụng</Label>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {DIET_TAG_OPTIONS.map((option) => {
            const isSelected = selectedDietTags.includes(option.value);
            return (
              <Badge
                key={option.value}
                variant={isSelected ? 'default' : 'outline'}
                className="cursor-pointer select-none"
                onClick={() => toggleDietTag(option.value)}
              >
                {option.label}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="submit-categories">Phân loại (cách nhau bởi dấu phẩy)</Label>
        <Input
          id="submit-categories"
          placeholder="VD: quán ăn, cà phê, takeaway"
          defaultValue=""
          onChange={(e) =>
            form.setValue('categories', splitList(e.target.value), { shouldValidate: true })
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="submit-allergens">Mã dị ứng được loại trừ (tùy chọn)</Label>
        <Input
          id="submit-allergens"
          placeholder="VD: GLUTEN, PEANUT"
          defaultValue=""
          onChange={(e) =>
            form.setValue('allergenFreeCodes', splitList(e.target.value), {
              shouldValidate: true,
            })
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="submit-excluded">Nguyên liệu bị loại trừ (tùy chọn)</Label>
        <Textarea
          id="submit-excluded"
          rows={2}
          placeholder="Ví dụ: nước mắm có cá, nước dừa tươi"
          defaultValue=""
          onChange={(e) =>
            form.setValue('excludedIngredients', splitList(e.target.value), {
              shouldValidate: true,
            })
          }
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Quán sẽ ở trạng thái chờ duyệt và không hiển thị công khai cho tới khi quản trị viên xác
        nhận. Kết quả duyệt, kể cả lý do nếu quán bị từ chối, sẽ được thông báo cho bạn sau.
      </p>

      {submitError && <p className="text-xs text-destructive">{submitError}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={() => onDone?.()}>
          Hủy
        </Button>
        <Button type="submit" disabled={submitMutation.isPending || !hasCoordinates}>
          {submitMutation.isPending ? 'Đang gửi...' : 'Gửi đề xuất quán'}
        </Button>
      </div>
    </form>
  );
}
