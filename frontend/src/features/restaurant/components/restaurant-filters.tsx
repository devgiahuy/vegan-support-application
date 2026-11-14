'use client';

import * as React from 'react';
import { Filter, RotateCcw, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEFAULT_RADIUS_M, MAX_RADIUS_M, MIN_RADIUS_M } from '../schemas/restaurant.schema';
import { countActiveAdvancedFilters } from '../utils/restaurant-search';
import type { RestaurantAdvancedFilters, RestaurantSearchMode } from '../types/restaurant.model';
import { AdvancedFiltersSheet } from './advanced-filters';

const RADIUS_OPTIONS = [100, 300, 500, 1000, 3000, 5000, 10000, 20000, 50000];
const KEYWORD_SUGGESTIONS = ['Cơm chay', 'Phở chay', 'Lẩu chay'];
export interface RestaurantFiltersProps {
  query: string;
  radiusM: number;
  advanced: RestaurantAdvancedFilters;
  searchMode: RestaurantSearchMode | null;
  onQueryChange: (query: string) => void;
  onRadiusChange: (radiusM: number) => void;
  onAdvancedChange: (filters: RestaurantAdvancedFilters) => void;
  onClearAll: () => void;
}

export function RestaurantFilters({
  query,
  radiusM,
  advanced,
  searchMode,
  onQueryChange,
  onRadiusChange,
  onAdvancedChange,
  onClearAll,
}: RestaurantFiltersProps) {
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const advancedCount = countActiveAdvancedFilters(advanced);
  const hasFilters = query.length > 0 || advancedCount > 0 || radiusM !== DEFAULT_RADIUS_M;

  return (
    <section
      aria-label="Bộ lọc tìm quán"
      className="flex flex-col gap-3 rounded-2xl border bg-card p-4"
    >
      <FieldGroup className="grid grid-cols-2 gap-4 xl:grid-cols-[minmax(0,1fr)_160px_auto]">
        <Field className="gap-2">
          <FieldLabel htmlFor="restaurant-query">Tìm theo tên quán hoặc món ăn</FieldLabel>
          <InputGroup className="h-11 rounded-xl bg-background">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="restaurant-query"
              placeholder="Bạn muốn ăn món chay gì hôm nay?"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  onQueryChange('');
                }
              }}
            />
            {query && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-sm"
                  className="size-11"
                  onClick={() => onQueryChange('')}
                  aria-label="Xoá từ khoá tìm kiếm"
                >
                  <X aria-hidden="true" />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
        </Field>
        <Field className="gap-2">
          <FieldLabel htmlFor="restaurant-radius">Trong bán kính</FieldLabel>
          <Select
            value={String(radiusM)}
            onValueChange={(value) => {
              const next = Number(value);
              if (Number.isFinite(next) && next >= MIN_RADIUS_M && next <= MAX_RADIUS_M)
                onRadiusChange(next);
            }}
          >
            <SelectTrigger
              id="restaurant-radius"
              className="w-full rounded-xl bg-background data-[size=default]:h-11"
            >
              <SelectValue />
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
        </Field>
        <Field className="gap-2">
          <FieldLabel className="sr-only xl:not-sr-only">Tùy chọn</FieldLabel>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl px-5 [&_svg]:size-4"
            onClick={() => setAdvancedOpen(true)}
          >
            <Filter data-icon="inline-start" aria-hidden="true" />
            Bộ lọc
            {advancedCount > 0 && (
              <Badge variant="secondary" aria-label={`${advancedCount} bộ lọc nâng cao đang bật`}>
                {advancedCount}
              </Badge>
            )}
          </Button>
        </Field>
      </FieldGroup>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 hidden text-xs text-muted-foreground sm:inline">Thử tìm</span>
        {KEYWORD_SUGGESTIONS.map((keyword) => (
          <Button
            key={keyword}
            type="button"
            variant={query === keyword ? 'secondary' : 'ghost'}
            size="sm"
            className="h-9 rounded-lg"
            onClick={() => onQueryChange(keyword)}
            aria-pressed={query === keyword}
          >
            {keyword}
          </Button>
        ))}
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-9 rounded-lg [&_svg]:size-4"
            onClick={onClearAll}
          >
            <RotateCcw data-icon="inline-start" aria-hidden="true" />
            Xoá bộ lọc
          </Button>
        )}
      </div>
      {searchMode !== 'KEYWORD' && advancedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          Bộ lọc nâng cao chỉ áp dụng khi tìm theo từ khoá.
        </p>
      )}
      <AdvancedFiltersSheet
        key={advancedOpen ? 'open' : 'closed'}
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
    </section>
  );
}
