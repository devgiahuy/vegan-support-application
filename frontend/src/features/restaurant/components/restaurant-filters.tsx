'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlaceDietType, PlaceOpeningStatus } from '@/common/enums';
import type { Restaurant } from '../types/restaurant.model';
import { MAX_RADIUS_M, MIN_RADIUS_M } from '../schemas/restaurant.schema';

const RADIUS_OPTIONS = [500, 1000, 3000, 5000, 10000];

const RATING_OPTIONS = [
  { value: 0, label: 'Mọi đánh giá' },
  { value: 3, label: 'Từ 3 sao' },
  { value: 4, label: 'Từ 4 sao' },
  { value: 4.5, label: 'Từ 4,5 sao' },
];

/** Lọc loại chay: ALL | VEG (thuần chay + thân thiện) | VEGGIE (mọi loại trừ UNKNOWN). */
export type DietFilter = 'ALL' | 'VEG' | 'VEGGIE';

export interface PlaceFilterValues {
  diet: DietFilter;
  openNow: boolean;
  minRating: number;
}

export const DEFAULT_PLACE_FILTERS: PlaceFilterValues = {
  diet: 'ALL',
  openNow: false,
  minRating: 0,
};

/**
 * Lọc phía ứng dụng sau khi có kết quả (arch §22 — provider chỉ tìm nearby/theo
 * từ khóa). UNKNOWN bị loại khi lọc chay/mở cửa vì không thể xác nhận (FR-007).
 */
export function applyPlaceFilters(items: Restaurant[], filters: PlaceFilterValues): Restaurant[] {
  return items.filter((item) => {
    if (
      filters.diet === 'VEG' &&
      item.dietType !== PlaceDietType.VEGAN &&
      item.dietType !== PlaceDietType.VEGAN_FRIENDLY
    ) {
      return false;
    }
    if (filters.diet === 'VEGGIE' && item.dietType === PlaceDietType.UNKNOWN) return false;
    if (filters.openNow && item.openingStatus !== PlaceOpeningStatus.OPEN) return false;
    if (filters.minRating > 0 && (item.rating ?? -1) < filters.minRating) return false;
    return true;
  });
}

/**
 * Bộ lọc quán: từ món + bán kính + loại chay + mở cửa + sao tối thiểu.
 * Từ khóa rỗng = hiện tất cả (không chặn).
 */
export function RestaurantFilters({
  query,
  radiusM,
  diet,
  openNow,
  minRating,
  onQueryChange,
  onRadiusChange,
  onDietChange,
  onOpenNowChange,
  onMinRatingChange,
}: {
  query: string;
  radiusM: number;
  diet: DietFilter;
  openNow: boolean;
  minRating: number;
  onQueryChange: (query: string) => void;
  onRadiusChange: (radiusM: number) => void;
  onDietChange: (diet: DietFilter) => void;
  onOpenNowChange: (open: boolean) => void;
  onMinRatingChange: (rating: number) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_140px_170px_150px_150px]">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="restaurant-query">Tìm theo món</Label>
        <Input
          id="restaurant-query"
          placeholder="VD: bún bò, lẩu nấm..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="restaurant-radius">Bán kính</Label>
        <Select
          value={String(radiusM)}
          onValueChange={(value) => {
            const parsed = Number(value);
            if (parsed >= MIN_RADIUS_M && parsed <= MAX_RADIUS_M) onRadiusChange(parsed);
          }}
        >
          <SelectTrigger id="restaurant-radius">
            <SelectValue placeholder="Bán kính" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {RADIUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option >= 1000 ? `${option / 1000} km` : `${option} m`}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="restaurant-diet">Loại chay</Label>
        <Select value={diet} onValueChange={(value) => onDietChange(value as DietFilter)}>
          <SelectTrigger id="restaurant-diet">
            <SelectValue placeholder="Loại chay" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="VEGGIE">Quán chay</SelectItem>
              <SelectItem value="VEG">Thuần chay</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="restaurant-rating">Đánh giá</Label>
        <Select
          value={String(minRating)}
          onValueChange={(value) => onMinRatingChange(Number(value))}
        >
          <SelectTrigger id="restaurant-rating">
            <SelectValue placeholder="Đánh giá" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {RATING_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="restaurant-open">Giờ mở cửa</Label>
        <Select
          value={openNow ? 'open' : 'all'}
          onValueChange={(value) => onOpenNowChange(value === 'open')}
        >
          <SelectTrigger id="restaurant-open">
            <SelectValue placeholder="Giờ mở cửa" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="open">Đang mở cửa</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
