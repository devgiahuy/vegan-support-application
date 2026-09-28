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

const addressOnlySchema = z.object({
  addressText: z.string().trim().min(3, 'Vui lòng nhập địa chỉ rõ hơn.').max(500),
});

/**
 * Form địa chỉ thay thế khi từ chối/hết hạn geolocation.
 * Địa chỉ lạ → tọa độ trung tâm mặc định + thông báo (fixture).
 */
export function AddressForm({
  onResolved,
}: {
  onResolved: (coords: { lat: number; lng: number }, label: string) => void;
}) {
  const geocodeMutation = useGeocodeMutation();
  const [notice, setNotice] = React.useState<string | null>(null);
  const form = useForm<{ addressText: string }>({
    resolver: zodResolver(addressOnlySchema),
    defaultValues: { addressText: '' },
  });

  const onSubmit = async (values: { addressText: string }) => {
    setNotice(null);
    try {
      const result = await geocodeMutation.mutateAsync(values.addressText);
      if (result.lat === null || result.lng === null) {
        // Trung tâm mặc định (Hà Nội) + thông báo rõ.
        setNotice('Không nhận diện được địa chỉ, dùng tạm trung tâm Hà Nội.');
        onResolved({ lat: 21.0285, lng: 105.8542 }, values.addressText);
        return;
      }
      onResolved({ lat: result.lat, lng: result.lng }, result.label || values.addressText);
    } catch {
      setNotice('Không phân giải được địa chỉ. Vui lòng thử lại.');
    }
  };

  return (
    <form
      onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
      className="flex flex-col gap-2"
      noValidate
    >
      <Label htmlFor="restaurant-address">Hoặc nhập địa chỉ</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="restaurant-address"
            placeholder="VD: Hồ Gươm, Hà Nội"
            className="pl-9"
            {...form.register('addressText')}
          />
        </div>
        <Button type="submit" disabled={geocodeMutation.isPending}>
          {geocodeMutation.isPending ? 'Đang tìm...' : 'Tìm quán'}
        </Button>
      </div>
      {form.formState.errors.addressText && (
        <p className="text-xs text-destructive">{form.formState.errors.addressText.message}</p>
      )}
      {notice && <p className="text-xs text-muted-foreground">{notice}</p>}
    </form>
  );
}
