'use client';

import * as React from 'react';
import { Filter, RotateCcw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { DietPattern } from '@/common/enums';
import { MAX_RADIUS_M, MIN_RADIUS_M } from '../schemas/restaurant.schema';
import { countActiveAdvancedFilters } from '../utils/restaurant-search';
import type { RestaurantAdvancedFilters, RestaurantSearchMode } from '../types/restaurant.model';
import { AdvancedFiltersSheet } from './advanced-filters';

const RADIUS_OPTIONS = [100, 300, 500, 1000, 3000, 5000, 10000, 20000, 50000];

/**
 * Ba lựa chọn chế độ ăn — chỉ hai giá trị backend chấp nhận (`dietPattern` là enum đơn).
 * Trước đây UI gửi `LACTO_VEGETARIAN`/`OVO_VEGETARIAN` khiến lọc cứng không hoạt động đúng.
 */
const DIET_PATTERN_OPTIONS: { value: DietPattern; label: string }[] = [
  { value: DietPattern.VEGAN, label: 'Thuần chay (Vegan)' },
  { value: DietPattern.LACTO_OVO, label: 'Chay có sữa và trứng' },
];

const DIET_PATTERN_NONE = 'none';

export interface RestaurantFiltersProps {
  query: string;
  radiusM: number;
  dietPattern?: DietPattern;
  advanced: RestaurantAdvancedFilters;
  searchMode: RestaurantSearchMode | null;
  onQueryChange: (query: string) => void;
  onRadiusChange: (radiusM: number) => void;
  onDietPatternChange: (dietPattern: DietPattern | undefined) => void;
  onAdvancedChange: (filters: RestaurantAdvancedFilters) => void;
  onClearAll: () => void;
}

/**
 * Bộ lọc cơ bản hiển thị trực tiếp (FR-019): từ khóa, bán kính, trường phái ăn.
 * Bộ lọc nâng cao nằm trong `Sheet` thu gọn, mặc định đóng (FR-023).
 */
export function RestaurantFilters({
  query,
  radiusM,
  dietPattern,
  advanced,
  searchMode,
  onQueryChange,
  onRadiusChange,
  onDietPatternChange,
  onAdvancedChange,
  onClearAll,
}: RestaurantFiltersProps) {
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const advancedCount = countActiveAdvancedFilters(advanced);
  const hasFilters = query.length > 0 || dietPattern !== undefined || advancedCount > 0;

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-3 shadow-xs sm:p-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px_200px]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="restaurant-query">Tìm theo tên quán hoặc món ăn</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="restaurant-query"
              placeholder="VD: phở chay, bún riêu chay, cơm tấm chay..."
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Escape') return;
                event.preventDefault();
                onQueryChange('');
              }}
              className="px-9"
            />
            {/* Xoá nhanh từ khoá để quay lại chế độ tìm lân cận (US2/AC3). */}
            {query.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onQueryChange('')}
                className="absolute right-1 top-1/2 size-7 -translate-y-1/2 rounded-md text-muted-foreground hover:text-foreground"
                aria-label="Xoá từ khoá tìm kiếm"
                title="Xoá từ khoá"
              >
                <X className="size-3.5" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="restaurant-radius">Bán kính tìm kiếm</Label>
          <Select
            value={String(radiusM)}
            onValueChange={(value) => {
              const parsed = Number(value);
              if (Number.isFinite(parsed) && parsed >= MIN_RADIUS_M && parsed <= MAX_RADIUS_M) {
                onRadiusChange(parsed);
              }
            }}
          >
            <SelectTrigger id="restaurant-radius" className="w-full">
              <SelectValue placeholder="Chọn bán kính" />
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
          <Label htmlFor="restaurant-diet">Trường phái ăn chay</Label>
          <Select
            value={dietPattern ?? DIET_PATTERN_NONE}
            onValueChange={(value) =>
              onDietPatternChange(value === DIET_PATTERN_NONE ? undefined : (value as DietPattern))
            }
          >
            <SelectTrigger id="restaurant-diet" className="w-full">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={DIET_PATTERN_NONE}>Tất cả</SelectItem>
                {DIET_PATTERN_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => setAdvancedOpen(true)}
        >
          <Filter className="size-3.5" aria-hidden="true" />
          Bộ lọc nâng cao
          {advancedCount > 0 && (
            <span
              className="ml-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground"
              aria-label={`${advancedCount} bộ lọc nâng cao đang bật`}
            >
              {advancedCount}
            </span>
          )}
        </Button>

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={onClearAll}>
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Xoá tất cả
          </Button>
        )}
      </div>

      {searchMode !== 'KEYWORD' && advancedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          Bộ lọc nâng cao chỉ áp dụng khi bạn đang tìm theo từ khoá.
        </p>
      )}

      {/* `key` đổi theo trạng thái mở/đóng để bản nháp trong Sheet luôn khớp bộ lọc hiện tại. */}
      <AdvancedFiltersSheet
        key={advancedOpen ? 'advanced-open' : 'advanced-closed'}
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        filters={advanced}
        searchMode={searchMode}
        onApply={(next) => {
          onAdvancedChange(next);
          setAdvancedOpen(false);
        }}
        onClear={() => onAdvancedChange({})}
      />
    </div>
  );
}
