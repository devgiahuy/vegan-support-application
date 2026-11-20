'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LocateFixed, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getApiErrorCode } from '@/lib/api-error';
import { RestaurantDietTag } from '@/common/enums';
import { useGeocodeMutation, useSubmitRestaurantMutation } from '../queries/restaurant.queries';
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
  RESTAURANT_DUPLICATE:
    'Quán này đã có trong hệ thống. Bạn vẫn có thể gửi để chúng tôi kiểm tra thêm.',
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
  const geocodeMutation = useGeocodeMutation();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isLocating, setIsLocating] = React.useState(false);
  const [geoNotice, setGeoNotice] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const form = useForm<SubmitRestaurantFormValues>({
    resolver: zodResolver(submitRestaurantSchema),
    defaultValues: {
      name: '',
      address: '',
      latitude: undefined,
      longitude: undefined,
      categories: [],
      dietTags: [RestaurantDietTag.VEGAN],
      allergenFreeCodes: [],
      excludedIngredients: [],
    },
  });

  const selectedDietTags = useWatch({ control: form.control, name: 'dietTags' }) ?? [];
  const latitude = useWatch({ control: form.control, name: 'latitude' });
  const longitude = useWatch({ control: form.control, name: 'longitude' });

  const numLat = typeof latitude === 'number' ? latitude : parseFloat(String(latitude ?? ''));
  const numLng = typeof longitude === 'number' ? longitude : parseFloat(String(longitude ?? ''));

  const hasCoordinates =
    Number.isFinite(numLat) &&
    Number.isFinite(numLng) &&
    numLat >= -90 &&
    numLat <= 90 &&
    numLng >= -180 &&
    numLng <= 180 &&
    (numLat !== 0 || numLng !== 0);

  const toggleDietTag = (tag: RestaurantDietTag) => {
    form.setValue(
      'dietTags',
      selectedDietTags.includes(tag)
        ? selectedDietTags.filter((item) => item !== tag)
        : [...selectedDietTags, tag]
    );
  };

  /** Tự động tách vĩ độ và kinh độ khi người dùng dán chuỗi tọa độ (vd: "10.777012, 106.700123") */
  const handleLatitudePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')?.trim();
    if (!pasted) return;

    if (pasted.includes(',') || (pasted.includes(' ') && pasted.split(/\s+/).length >= 2)) {
      const parts = pasted.split(/[\s,]+/).filter(Boolean);
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          e.preventDefault();
          form.setValue('latitude', lat, {
            shouldValidate: true,
            shouldDirty: true,
          });
          form.setValue('longitude', lng, {
            shouldValidate: true,
            shouldDirty: true,
          });
          setGeoNotice({
            type: 'success',
            message: `Đã tự động điền tọa độ: Vĩ độ ${lat.toFixed(5)}, Kinh độ ${lng.toFixed(5)}`,
          });
        }
      }
    }
  };

  /** Lấy tọa độ tự động từ địa chỉ đã nhập (Geocode) */
  const handleGeocodeAddress = async () => {
    const address = form.getValues('address')?.trim();
    if (!address || address.length < 3) {
      setGeoNotice({
        type: 'error',
        message: 'Vui lòng nhập địa chỉ cụ thể trước khi tìm tọa độ tự động.',
      });
      return;
    }
    setGeoNotice(null);
    try {
      const result = await geocodeMutation.mutateAsync(address);
      if (result.isAvailable && result.lat !== null && result.lng !== null) {
        form.setValue('latitude', result.lat, {
          shouldValidate: true,
          shouldDirty: true,
        });
        form.setValue('longitude', result.lng, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setGeoNotice({
          type: 'success',
          message: `Đã tìm thấy tọa độ: ${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}`,
        });
      } else {
        setGeoNotice({
          type: 'error',
          message:
            'Không tìm thấy tọa độ tự động cho địa chỉ này. Bạn có thể nhập tọa độ từ Google Maps.',
        });
      }
    } catch {
      setGeoNotice({
        type: 'error',
        message: 'Lỗi khi tra cứu địa chỉ. Bạn có thể nhập tọa độ thủ công.',
      });
    }
  };

  /** Lấy tọa độ từ GPS của thiết bị */
  const handleGetDeviceLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoNotice({
        type: 'error',
        message: 'Trình duyệt không hỗ trợ định vị GPS.',
      });
      return;
    }
    setGeoNotice(null);
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        form.setValue('latitude', lat, {
          shouldValidate: true,
          shouldDirty: true,
        });
        form.setValue('longitude', lng, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setGeoNotice({
          type: 'success',
          message: `Đã lấy vị trí GPS hiện tại: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        });
      },
      () => {
        setIsLocating(false);
        setGeoNotice({
          type: 'error',
          message: 'Không lấy được vị trí GPS. Vui lòng cấp quyền vị trí hoặc nhập thủ công.',
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const onSubmit = async (values: SubmitRestaurantFormValues) => {
    setSubmitError(null);
    try {
      await submitMutation.mutateAsync({
        name: values.name.trim(),
        address: values.address.trim(),
        latitude: values.latitude,
        longitude: values.longitude,
        categories: values.categories,
        dietTags: values.dietTags,
        allergenFreeCodes: values.allergenFreeCodes,
        excludedIngredients: values.excludedIngredients,
      });
      toast.success(
        'Đã gửi đề xuất quán ăn thành công! Quán sẽ được Ban quản trị duyệt trước khi xuất hiện công khai.'
      );
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

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-sm font-medium">Tọa độ quán *</Label>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              disabled={geocodeMutation.isPending}
              onClick={handleGeocodeAddress}
            >
              {geocodeMutation.isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Search className="size-3" />
              )}
              {geocodeMutation.isPending ? 'Đang tìm...' : 'Lấy từ địa chỉ'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              disabled={isLocating}
              onClick={handleGetDeviceLocation}
            >
              {isLocating ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <LocateFixed className="size-3" />
              )}
              {isLocating ? 'Đang lấy...' : 'Vị trí hiện tại'}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="submit-latitude" className="text-xs text-muted-foreground">
              Vĩ độ (Latitude) *
            </Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="submit-latitude"
                className="pl-9"
                placeholder="VD: 10.776"
                type="number"
                step="any"
                onPaste={handleLatitudePaste}
                {...form.register('latitude', { valueAsNumber: true })}
              />
            </div>
            {form.formState.errors.latitude && (
              <p className="text-xs text-destructive">{form.formState.errors.latitude.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="submit-longitude" className="text-xs text-muted-foreground">
              Kinh độ (Longitude) *
            </Label>
            <Input
              id="submit-longitude"
              placeholder="VD: 106.700"
              type="number"
              step="any"
              {...form.register('longitude', { valueAsNumber: true })}
            />
            {form.formState.errors.longitude && (
              <p className="text-xs text-destructive">{form.formState.errors.longitude.message}</p>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Quán phải có vị trí để hiển thị trên bản đồ. Nhập tọa độ từ Google Maps hoặc bấm &quot;Lấy
          từ địa chỉ&quot;.
        </p>

        {geoNotice && (
          <p
            className={cn(
              'text-xs',
              geoNotice.type === 'error' ? 'text-destructive' : 'text-primary'
            )}
          >
            {geoNotice.message}
          </p>
        )}

        {form.formState.isSubmitted &&
          !hasCoordinates &&
          !form.formState.errors.latitude &&
          !form.formState.errors.longitude && (
            <p className="text-xs text-destructive">
              Vui lòng nhập tọa độ hợp lệ của quán trước khi gửi đề xuất.
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
