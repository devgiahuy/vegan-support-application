'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGeocodeMutation } from '../queries/restaurant.queries';
import type { ResolvedLocation } from './location-prompt';

const addressOnlySchema = z.object({
  addressText: z.string().trim().min(3, 'Vui lòng nhập địa chỉ rõ hơn.').max(500),
});

export interface AddressFormProps {
  onResolved: (location: ResolvedLocation) => void;
  /** Được gọi khi không phân giải được địa chỉ. */
  onDenied: (message: string) => void;
}

/**
 * Form nhập địa chỉ thay thế khi người dùng từ chối hoặc trình duyệt không hỗ trợ định vị.
 *
 * Quy tắc quan trọng (FR-033): khi backend trả `data: null` (provider lỗi) thì chỉ hiển thị lỗi
 * tiếng Việt và giữ nguyên nội dung ô nhập. TUYỆT ĐỐI không dùng tọa độ trung tâm mặc định —
 * trước đây trang dùng tọa độ Hà Nội khiến người dùng ở TP.HCM thấy quán hoàn toàn không liên quan.
 */
export function AddressForm({ onResolved, onDenied }: AddressFormProps) {
  const geocodeMutation = useGeocodeMutation();
  const form = useForm<{ addressText: string }>({
    resolver: zodResolver(addressOnlySchema),
    defaultValues: { addressText: '' },
  });

  const onSubmit = async (values: { addressText: string }) => {
    try {
      const result = await geocodeMutation.mutateAsync(values.addressText);

      if (!result.isAvailable || result.lat === null || result.lng === null) {
        onDenied(
          'Không tìm thấy địa chỉ này. Bạn có thể thử cách viết khác hoặc chọn vị trí trên bản đồ.'
        );
        return;
      }

      onResolved({
        lat: result.lat,
        lng: result.lng,
        source: 'MANUAL',
        label: result.label || values.addressText,
      });
      form.reset();
    } catch {
      onDenied('Không phân giải được địa chỉ. Vui lòng thử lại hoặc dùng vị trí hiện tại.');
    }
  };

  return (
    <form
      onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
      className="flex w-full flex-col gap-2 sm:flex-row sm:items-end"
      noValidate
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="restaurant-address">Hoặc nhập địa chỉ</Label>
        <div className="relative">
          <MapPin
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="restaurant-address"
            placeholder="VD: Hồ Gươm, Hà Nội"
            className="pl-9"
            {...form.register('addressText')}
          />
        </div>
        {form.formState.errors.addressText && (
          <p className="text-xs text-destructive">{form.formState.errors.addressText.message}</p>
        )}
      </div>

      <Button type="submit" disabled={geocodeMutation.isPending} className="shrink-0">
        {geocodeMutation.isPending ? 'Đang tìm...' : 'Tìm quán'}
      </Button>
    </form>
  );
}
