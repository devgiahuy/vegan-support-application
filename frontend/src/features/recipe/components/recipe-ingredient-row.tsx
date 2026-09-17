'use client';

import * as React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CheckCircle2, AlertCircle, Trash2, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { useIngredientsQuery } from '@/features/ingredient/queries/ingredient.queries';
import type { Ingredient } from '@/features/ingredient/types/ingredient.model';
import type { RecipeFormValues } from '../schemas/recipe-form.schema';

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
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const rawName = form.watch(`ingredients.${index}.name`) || '';
  const ingredientId = form.watch(`ingredients.${index}.ingredientId`);
  const debouncedSearch = useDebounce(rawName.trim(), 300);

  // Chỉ query khi có từ khóa >= 2 ký tự và dropdown đang mở
  const { data: ingredientResult, isLoading } = useIngredientsQuery({
    q: debouncedSearch,
    limit: 6,
  });

  const candidates = ingredientResult?.items || [];

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
            {isLoading && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground pointer-events-none" />
            )}
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
          {isOpen && candidates.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground flex items-center justify-between border-b pb-1">
                <span>Gợi ý nguyên liệu chuẩn</span>
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
              <ul className="max-h-48 overflow-y-auto py-1 space-y-0.5">
                {candidates.map((cand) => (
                  <li key={cand.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(cand)}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <div>
                        <span className="font-medium">{cand.canonicalName}</span>
                        {cand.aliases && cand.aliases.length > 0 && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            (
                            {cand.aliases
                              .map((a) => a.alias)
                              .slice(0, 2)
                              .join(', ')}
                            )
                          </span>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded">
                        {cand.foodGroupLabel || 'Chuẩn'}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Số lượng */}
        <div className="col-span-4 sm:col-span-2">
          <Input
            type="number"
            step="any"
            placeholder="Số lượng"
            className="h-10 rounded-lg text-sm"
            {...form.register(`ingredients.${index}.amount` as const, { valueAsNumber: true })}
          />
        </div>

        {/* Đơn vị */}
        <div className="col-span-4 sm:col-span-2">
          <Input
            placeholder="Đơn vị (gram, ml...)"
            className="h-10 rounded-lg text-sm"
            {...form.register(`ingredients.${index}.unit`)}
          />
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
