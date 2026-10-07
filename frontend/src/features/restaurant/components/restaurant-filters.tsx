'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MAX_RADIUS_M, MIN_RADIUS_M } from '../schemas/restaurant.schema';

const RADIUS_OPTIONS = [500, 1000, 3000, 5000, 10000, 20000, 50000];

const DIETARY_OPTIONS = [
  { value: 'VEGAN', label: 'Thuần chay (Vegan)' },
  { value: 'LACTO_OVO', label: 'Chay có sữa và trứng' },
];

/**
 * Bộ lọc quán chay: từ khóa món ăn + bán kính + lọc cứng chế độ ăn (FR-003, FR-004).
 */
export function RestaurantFilters({
  query,
  radiusM,
  dietaryTags = [],
  onQueryChange,
  onRadiusChange,
  onDietaryTagsChange,
}: {
  query: string;
  radiusM: number;
  dietaryTags?: string[];
  onQueryChange: (query: string) => void;
  onRadiusChange: (radiusM: number) => void;
  onDietaryTagsChange?: (tags: string[]) => void;
}) {
  const toggleDietaryTag = (tag: string) => {
    if (!onDietaryTagsChange) return;
    if (dietaryTags.includes(tag)) {
      onDietaryTagsChange(dietaryTags.filter((t) => t !== tag));
    } else {
      onDietaryTagsChange([tag]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="restaurant-query">Tìm theo tên hoặc món ăn</Label>
          <Input
            id="restaurant-query"
            placeholder="VD: phở chay, bún riêu, cơm tấm..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="restaurant-radius">Bán kính tìm kiếm</Label>
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

      {onDietaryTagsChange && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Lọc chế độ ăn:</span>
          {DIETARY_OPTIONS.map((opt) => {
            const isSelected = dietaryTags.includes(opt.value);
            return (
              <Badge
                key={opt.value}
                variant={isSelected ? 'default' : 'outline'}
                className="cursor-pointer select-none transition-colors"
                onClick={() => toggleDietaryTag(opt.value)}
              >
                {opt.label}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
