'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { RestaurantPriceLevel, RestaurantWeekday } from '@/common/enums';
import { countActiveAdvancedFilters } from '../utils/restaurant-search';
import type { RestaurantAdvancedFilters, RestaurantSearchMode } from '../types/restaurant.model';

const NONE = 'none';

/**
 * Thang giá 4 mức của nhà cung cấp (contract `minPrice`/`maxPrice`: 0..4).
 * KHÔNG phải số tiền VND — gửi số tiền sẽ bị backend từ chối.
 */
const PRICE_LABELS: Record<number, string> = {
  0: '0$ — Miễn phí / rất rẻ',
  1: '1$ — Rẻ',
  2: '2$ — Trung bình',
  3: '3$ — Đắt',
  4: '4$ — Rất đắt',
};

const PRICE_OPTIONS = (
  [
    RestaurantPriceLevel.FREE,
    RestaurantPriceLevel.CHEAP,
    RestaurantPriceLevel.MODERATE,
    RestaurantPriceLevel.EXPENSIVE,
    RestaurantPriceLevel.LUXURY,
  ] as number[]
).map((level) => ({ value: level, label: PRICE_LABELS[level] }));

const RATING_OPTIONS = [2, 2.5, 3, 3.5, 4, 4.5];

const OPEN_STATE_OPTIONS: { value: RestaurantAdvancedFilters['openState']; label: string }[] = [
  { value: 'now', label: 'Đang mở' },
  { value: '24h', label: 'Mở 24 giờ' },
];

const WEEKDAY_OPTIONS: {
  value: NonNullable<RestaurantAdvancedFilters['openOnDay']>;
  label: string;
}[] = [
  { value: RestaurantWeekday.MON, label: 'Thứ 2' },
  { value: RestaurantWeekday.TUE, label: 'Thứ 3' },
  { value: RestaurantWeekday.WED, label: 'Thứ 4' },
  { value: RestaurantWeekday.THU, label: 'Thứ 5' },
  { value: RestaurantWeekday.FRI, label: 'Thứ 6' },
  { value: RestaurantWeekday.SAT, label: 'Thứ 7' },
  { value: RestaurantWeekday.SUN, label: 'Chủ nhật' },
];

const HOUR_LABELS: string[] = Array.from({ length: 24 }, (_, hour) => `${hour}:00`);

export interface AdvancedFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: RestaurantAdvancedFilters;
  searchMode: RestaurantSearchMode | null;
  onApply: (filters: RestaurantAdvancedFilters) => void;
  onClear: () => void;
}

function SelectRow({
  id,
  label,
  value,
  placeholder,
  options,
  onValueChange,
}: {
  id: string;
  label: string;
  value: number | string;
  placeholder: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={String(value)} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Hộp bộ lọc nâng cao dạng thu gọn (FR-023).
 *
 * Mọi điều khiển dùng giá trị cố định đúng ràng buộc backend, KHÔNG cho nhập tự do — nhập tay
 * ngoài khoảng sẽ tạo 400 và người dùng chỉ thấy lỗi kỹ thuật.
 */
export function AdvancedFiltersSheet({
  open,
  onOpenChange,
  filters,
  searchMode,
  onApply,
  onClear,
}: AdvancedFiltersSheetProps) {
  // Bản nháp nằm trong `useState` initializer; parent đổi `key` mỗi lần mở/đóng nên bản nháp
  // luôn bắt đầu từ giá trị hiện tại mà không cần effect setState.
  const [draft, setDraft] = React.useState<RestaurantAdvancedFilters>(filters);

  const activeCount = countActiveAdvancedFilters(draft);
  const notKeyword = searchMode !== 'KEYWORD';

  const priceOptions = [
    { value: NONE, label: 'Bất kỳ' },
    ...PRICE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label })),
  ];
  const ratingOptions = [
    { value: NONE, label: 'Bất kỳ' },
    ...RATING_OPTIONS.map((o) => ({
      value: String(o),
      label: `${o.toFixed(1).replace('.', ',')} ★ trở lên`,
    })),
  ];
  const openStateOptions = [
    { value: NONE, label: 'Bất kỳ' },
    ...OPEN_STATE_OPTIONS.map((o) => ({ value: o.value as string, label: o.label })),
  ];
  const weekdayOptions = [
    { value: NONE, label: 'Bất kỳ' },
    ...WEEKDAY_OPTIONS.map((o) => ({ value: o.value as string, label: o.label })),
  ];
  const hourOptions = [
    { value: NONE, label: 'Bất kỳ' },
    ...HOUR_LABELS.map((label, hour) => ({ value: String(hour), label })),
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Bộ lọc nâng cao</SheetTitle>
          <SheetDescription>
            Lọc theo giá, đánh giá và giờ mở cửa của quán. Các bộ lọc này chỉ áp dụng khi tìm theo
            từ khoá.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          {notKeyword && (
            <p className="flex items-start gap-2 rounded-lg border border-sky-500/25 bg-sky-50/60 px-3 py-2 text-xs text-sky-800 dark:bg-sky-950/20 dark:text-sky-300">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                Bạn đang ở chế độ tìm lân cận. Hãy nhập từ khoá để các bộ lọc này có hiệu lực.
              </span>
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <SelectRow
              id="advanced-min-price"
              label="Giá tối thiểu"
              value={draft.minPrice ?? NONE}
              placeholder="Bất kỳ"
              options={priceOptions}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  minPrice: value === NONE ? undefined : Number(value),
                }))
              }
            />
            <SelectRow
              id="advanced-max-price"
              label="Giá tối đa"
              value={draft.maxPrice ?? NONE}
              placeholder="Bất kỳ"
              options={priceOptions}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  maxPrice: value === NONE ? undefined : Number(value),
                }))
              }
            />
          </div>

          <SelectRow
            id="advanced-min-rating"
            label="Đánh giá tối thiểu"
            value={draft.minRating ?? NONE}
            placeholder="Bất kỳ"
            options={ratingOptions}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                minRating: value === NONE ? undefined : Number(value),
              }))
            }
          />

          <SelectRow
            id="advanced-open-state"
            label="Trạng thái mở cửa"
            value={draft.openState ?? NONE}
            placeholder="Bất kỳ"
            options={openStateOptions}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                openState: value === NONE ? undefined : (value as 'now' | '24h'),
              }))
            }
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <SelectRow
              id="advanced-open-day"
              label="Mở cửa vào ngày"
              value={draft.openOnDay ?? NONE}
              placeholder="Bất kỳ"
              options={weekdayOptions}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  openOnDay:
                    value === NONE
                      ? undefined
                      : (value as NonNullable<RestaurantAdvancedFilters['openOnDay']>),
                }))
              }
            />
            <SelectRow
              id="advanced-open-hour"
              label="Mở cửa lúc giờ"
              value={draft.openAtHour ?? NONE}
              placeholder="Bất kỳ"
              options={hourOptions}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  openAtHour: value === NONE ? undefined : Number(value),
                }))
              }
            />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 px-4">
          <Button
            variant="ghost"
            onClick={() => {
              setDraft({});
              onClear();
            }}
            disabled={activeCount === 0}
          >
            Xoá
          </Button>
          <Button onClick={() => onApply(draft)}>
            Áp dụng {activeCount > 0 ? `(${activeCount})` : ''}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
