'use client';

import * as React from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IngredientSuggestions } from '@/features/ingredient/components/ingredient-suggestions';
import type { Ingredient } from '@/features/ingredient/types/ingredient.model';
import type { RecipeFormValues } from '../schemas/recipe-form.schema';

/** Các đơn vị định lượng phổ biến trong nấu ăn chay */
export const COMMON_UNITS_CONFIG = [
  {
    category: 'Khối lượng & Thể tích',
    units: [
      { value: 'g', label: 'g (gam)' },
      { value: 'kg', label: 'kg (kilôgam)' },
      { value: 'ml', label: 'ml (mililít)' },
      { value: 'l', label: 'l (lít)' },
      { value: 'muỗng canh', label: 'muỗng canh (tbsp)' },
      { value: 'muỗng cà phê', label: 'muỗng cà phê (tsp)' },
      { value: 'chén', label: 'chén (bát)' },
    ],
  },
  {
    category: 'Đơn vị đếm & Sơ chế',
    units: [
      { value: 'quả', label: 'quả / trái' },
      { value: 'củ', label: 'củ' },
      { value: 'tép', label: 'tép (tỏi/hành)' },
      { value: 'cây', label: 'cây (sả/hành)' },
      { value: 'nhánh', label: 'nhánh (gừng/cần)' },
      { value: 'lát', label: 'lát (miếng)' },
      { value: 'bìa', label: 'bìa (đậu hũ)' },
      { value: 'bó', label: 'bó (rau)' },
      { value: 'gói', label: 'gói' },
      { value: 'hộp', label: 'hộp' },
      { value: 'lon', label: 'lon' },
      { value: 'tai', label: 'tai (nấm/mộc nhĩ)' },
      { value: 'nắm', label: 'nắm' },
      { value: 'chút', label: 'chút / nhúm' },
    ],
  },
] as const;

export const ALL_COMMON_UNIT_VALUES: readonly string[] = COMMON_UNITS_CONFIG.flatMap((cat) =>
  cat.units.map((u) => u.value)
);

interface RecipeIngredientRowProps {
  index: number;
  form: UseFormReturn<RecipeFormValues>;
  onRemove: () => void;
  canRemove: boolean;
}

export function RecipeIngredientRow({
  index,
  form,
  onRemove,
  canRemove,
}: RecipeIngredientRowProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCustomUnit, setIsCustomUnit] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const rawName = useWatch({ control: form.control, name: `ingredients.${index}.name` }) || '';
  const ingredientId = useWatch({
    control: form.control,
    name: `ingredients.${index}.ingredientId`,
  });
  const currentUnit = useWatch({ control: form.control, name: `ingredients.${index}.unit` }) || '';
  // Đóng dropdown khi click ngoài
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: Ingredient) => {
    form.setValue(`ingredients.${index}.name`, item.canonicalName, { shouldValidate: true });
    form.setValue(`ingredients.${index}.ingredientId`, item.id, { shouldValidate: true });
    setIsOpen(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    form.setValue(`ingredients.${index}.name`, val, { shouldValidate: true });
    // Nếu sửa text khác với tên chuẩn ban đầu, reset ingredientId
    if (ingredientId) {
      form.setValue(`ingredients.${index}.ingredientId`, null, { shouldValidate: true });
    }
    setIsOpen(true);
  };

  return (
    <div className="rounded-xl border bg-card p-3 shadow-xs transition-colors hover:border-primary/40 space-y-2">
      <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center">
        {/* Tên nguyên liệu + Auto-suggest dropdown */}
        <div className="col-span-12 sm:col-span-5 relative" ref={dropdownRef}>
          <div className="relative">
            <Input
              value={rawName}
              onChange={handleNameChange}
              onFocus={() => {
                if (rawName.trim().length >= 2) setIsOpen(true);
              }}
              placeholder="Tên nguyên liệu (vd: Đậu hũ, Nấm đùi gà...)"
              className="h-10 rounded-lg text-sm pr-8"
            />
          </div>

          {/* Trạng thái chuẩn hóa */}
          <div className="mt-1 flex items-center gap-1.5">
            {ingredientId ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Chuẩn hóa (Khớp cơ sở dữ liệu)
              </span>
            ) : rawName.trim().length > 0 ? (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 cursor-help"
                title="Nguyên liệu tự do có thể bị ẩn đối với các tài khoản có chế độ ăn kiêng nghiêm ngặt cho tới khi được duyệt chuẩn."
              >
                <AlertCircle className="h-3 w-3" /> Tự do (Chưa liên kết chuẩn)
              </span>
            ) : null}
          </div>

          {/* Dropdown gợi ý */}
          {isOpen && rawName.trim().length >= 2 && (
            <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border bg-popover p-1 shadow-lg">
              <IngredientSuggestions query={rawName} onSelect={handleSelect} />
            </div>
          )}
        </div>

        {/* Số lượng */}
        <div className="col-span-4 sm:col-span-2">
          <Input
            type="number"
            step="any"
            placeholder="Số lượng (vd: 150)"
            className="h-10 rounded-lg text-sm"
            {...form.register(`ingredients.${index}.amount` as const, { valueAsNumber: true })}
          />
        </div>

        {/* Đơn vị (Dropdown chọn nhanh hoặc tự nhập) */}
        <div className="col-span-4 sm:col-span-2">
          {isCustomUnit ? (
            <div className="relative flex items-center">
              <Input
                value={currentUnit}
                onChange={(e) =>
                  form.setValue(`ingredients.${index}.unit`, e.target.value, {
                    shouldValidate: true,
                  })
                }
                placeholder="Nhập đơn vị..."
                className="h-10 rounded-lg text-sm pr-7 bg-background"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setIsCustomUnit(false);
                  form.setValue(`ingredients.${index}.unit`, 'g', { shouldValidate: true });
                }}
                title="Quay lại danh sách chọn nhanh"
                className="absolute right-2 text-muted-foreground hover:text-foreground text-xs p-1"
              >
                ✕
              </button>
            </div>
          ) : (
            <Select
              value={currentUnit}
              onValueChange={(val) => {
                if (val === '__custom__') {
                  setIsCustomUnit(true);
                  form.setValue(`ingredients.${index}.unit`, '', { shouldValidate: true });
                } else {
                  setIsCustomUnit(false);
                  form.setValue(`ingredients.${index}.unit`, val, { shouldValidate: true });
                }
              }}
            >
              <SelectTrigger className="h-10 rounded-lg text-sm w-full bg-background border-input">
                <SelectValue placeholder="Đơn vị" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {COMMON_UNITS_CONFIG.map((group, groupIdx) => (
                  <React.Fragment key={group.category}>
                    {groupIdx > 0 && <SelectSeparator className="my-1" />}
                    <SelectGroup>
                      <SelectLabel className="text-[11px] font-semibold text-muted-foreground uppercase px-2 py-1">
                        {group.category}
                      </SelectLabel>
                      {group.units.map((u) => (
                        <SelectItem key={u.value} value={u.value} className="text-sm">
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </React.Fragment>
                ))}

                {currentUnit && !ALL_COMMON_UNIT_VALUES.includes(currentUnit) && (
                  <>
                    <SelectSeparator className="my-1" />
                    <SelectGroup>
                      <SelectLabel className="text-[11px] font-semibold text-muted-foreground uppercase px-2 py-1">
                        Đơn vị hiện tại
                      </SelectLabel>
                      <SelectItem value={currentUnit} className="text-sm">
                        {currentUnit}
                      </SelectItem>
                    </SelectGroup>
                  </>
                )}

                <SelectSeparator className="my-1" />
                <SelectItem value="__custom__" className="text-sm text-primary font-medium">
                  ✏️ Tự nhập đơn vị khác...
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Ghi chú */}
        <div className="col-span-3 sm:col-span-2">
          <Input
            placeholder="Ghi chú (sơ chế...)"
            className="h-10 rounded-lg text-sm"
            {...form.register(`ingredients.${index}.notes`)}
          />
        </div>

        {/* Nút xóa */}
        <div className="col-span-1 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={!canRemove}
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
