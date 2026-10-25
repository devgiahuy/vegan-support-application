'use client';

import * as React from 'react';
import { useFormState, useWatch, type UseFormReturn } from 'react-hook-form';
import { CheckCircle2, AlertCircle, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';
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
import { fieldDomId } from './recipe-editor-steps';

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
  const { errors } = useFormState({ control: form.control, name: `ingredients.${index}` });
  const rowErrors = errors.ingredients?.[index];
  const errorList = [rowErrors?.name, rowErrors?.amount, rowErrors?.unit];
  const hasError = errorList.some(Boolean);
  const errorId = `${fieldDomId(`ingredients.${index}`)}-error`;

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
    form.setValue(`ingredients.${index}.name`, val, {
      shouldValidate: Boolean(rowErrors?.name),
      shouldDirty: true,
    });
    // Sửa tên khác tên chuẩn → bỏ liên kết cũ (backend trả INGREDIENT_ID_NAME_MISMATCH nếu giữ).
    if (ingredientId) {
      form.setValue(`ingredients.${index}.ingredientId`, null, { shouldDirty: true });
    }
    setIsOpen(true);
  };

  const setUnit = (unit: string) =>
    form.setValue(`ingredients.${index}.unit`, unit, {
      shouldValidate: Boolean(rowErrors?.unit),
      shouldDirty: true,
    });

  const amountField = form.register(`ingredients.${index}.amount` as const, {
    valueAsNumber: true,
  });

  return (
    <div
      data-invalid={hasError || undefined}
      className="rounded-xl border bg-card p-3 shadow-xs transition-colors hover:border-primary/40 data-[invalid]:border-destructive/60"
    >
      <div className="grid grid-cols-12 items-start gap-2 sm:gap-3">
        <span
          aria-hidden
          className="col-span-1 mt-2.5 hidden text-xs font-semibold text-muted-foreground tabular-nums sm:block"
        >
          {index + 1}.
        </span>

        {/* Tên nguyên liệu + gợi ý từ danh mục chuẩn */}
        <div className="relative col-span-12 sm:col-span-5" ref={dropdownRef}>
          <Input
            id={fieldDomId(`ingredients.${index}.name`)}
            value={rawName}
            onChange={handleNameChange}
            onFocus={() => {
              if (rawName.trim().length >= 2) setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsOpen(false);
            }}
            placeholder="Tên nguyên liệu, vd: Đậu hũ"
            aria-label={`Tên nguyên liệu ${index + 1}`}
            aria-invalid={Boolean(rowErrors?.name)}
            aria-describedby={hasError ? errorId : undefined}
            autoComplete="off"
            className="h-10 rounded-lg text-sm"
          />

          <div className="mt-1 flex min-h-4 items-center gap-1.5">
            {ingredientId ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 aria-hidden className="h-3 w-3" /> Đã liên kết danh mục chuẩn
              </span>
            ) : rawName.trim().length > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                <AlertCircle aria-hidden className="h-3 w-3" /> Chưa liên kết — chọn từ gợi ý để
                hiển thị cho người ăn kiêng
              </span>
            ) : null}
          </div>

          {isOpen && rawName.trim().length >= 2 && (
            <div className="absolute top-11 left-0 z-50 w-full rounded-xl border bg-popover p-1 shadow-lg">
              <IngredientSuggestions query={rawName} onSelect={handleSelect} />
            </div>
          )}
        </div>

        {/* Định lượng */}
        <div className="col-span-5 sm:col-span-2">
          <Input
            id={fieldDomId(`ingredients.${index}.amount`)}
            type="number"
            step="any"
            min={0}
            inputMode="decimal"
            placeholder="Số lượng"
            aria-label={`Định lượng nguyên liệu ${index + 1}`}
            aria-invalid={Boolean(rowErrors?.amount)}
            aria-describedby={hasError ? errorId : undefined}
            className="h-10 rounded-lg text-sm"
            {...amountField}
          />
        </div>

        {/* Đơn vị: chọn nhanh hoặc tự nhập */}
        <div className="col-span-5 sm:col-span-3">
          {isCustomUnit ? (
            <div className="relative flex items-center">
              <Input
                id={fieldDomId(`ingredients.${index}.unit`)}
                value={currentUnit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Nhập đơn vị"
                aria-label={`Đơn vị nguyên liệu ${index + 1}`}
                aria-invalid={Boolean(rowErrors?.unit)}
                className="h-10 rounded-lg bg-background pr-8 text-sm"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsCustomUnit(false);
                  setUnit('g');
                }}
                aria-label="Quay lại danh sách đơn vị"
                className="absolute right-0.5 size-8 text-muted-foreground"
              >
                <X aria-hidden className="size-3.5" />
              </Button>
            </div>
          ) : (
            <Select
              value={currentUnit}
              onValueChange={(val) => {
                if (val === '__custom__') {
                  setIsCustomUnit(true);
                  setUnit('');
                } else {
                  setUnit(val);
                }
              }}
            >
              <SelectTrigger
                id={fieldDomId(`ingredients.${index}.unit`)}
                aria-label={`Đơn vị nguyên liệu ${index + 1}`}
                aria-invalid={Boolean(rowErrors?.unit)}
                className="h-10 w-full rounded-lg bg-background text-sm"
              >
                <SelectValue placeholder="Đơn vị" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {COMMON_UNITS_CONFIG.map((group, groupIdx) => (
                  <React.Fragment key={group.category}>
                    {groupIdx > 0 && <SelectSeparator className="my-1" />}
                    <SelectGroup>
                      <SelectLabel className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase">
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
                      <SelectLabel className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase">
                        Đơn vị hiện tại
                      </SelectLabel>
                      <SelectItem value={currentUnit} className="text-sm">
                        {currentUnit}
                      </SelectItem>
                    </SelectGroup>
                  </>
                )}

                <SelectSeparator className="my-1" />
                <SelectItem value="__custom__" className="text-sm font-medium text-primary">
                  Tự nhập đơn vị khác…
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="col-span-2 flex justify-end sm:col-span-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={!canRemove}
            aria-label={`Xóa nguyên liệu ${index + 1}`}
            className="size-10 text-muted-foreground hover:text-destructive"
          >
            <Trash2 aria-hidden className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {hasError && (
        <FieldError
          id={errorId}
          className="mt-1 text-xs sm:pl-[8.33%]"
          errors={errorList.filter(Boolean)}
        />
      )}
    </div>
  );
}
