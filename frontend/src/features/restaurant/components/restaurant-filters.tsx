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
import { MAX_RADIUS_M, MIN_RADIUS_M } from '../schemas/restaurant.schema';

const RADIUS_OPTIONS = [1000, 3000, 5000, 10000, 20000];

/**
 * Bộ lọc quán: từ món + bán kính. Từ khóa rỗng = hiện tất cả (không chặn).
 */
export function RestaurantFilters({
  query,
  radiusM,
  onQueryChange,
  onRadiusChange,
}: {
  query: string;
  radiusM: number;
  onQueryChange: (query: string) => void;
  onRadiusChange: (radiusM: number) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
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
    </div>
  );
}
