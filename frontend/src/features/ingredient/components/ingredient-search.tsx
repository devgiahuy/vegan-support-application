'use client';

import * as React from 'react';
import { Search, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { NutritionFactsPanel } from '@/features/food-data/components/nutrition-facts-panel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useIngredientsQuery } from '../queries/ingredient.queries';
import { FoodGroup } from '@/common/enums';

const FOOD_GROUP_OPTIONS: Array<{ value: FoodGroup | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Mọi nhóm' },
  { value: FoodGroup.GRAINS, label: 'Ngũ cốc' },
  { value: FoodGroup.LEGUMES, label: 'Đậu' },
  { value: FoodGroup.VEGETABLES, label: 'Rau' },
  { value: FoodGroup.FRUITS, label: 'Trái cây' },
  { value: FoodGroup.NUTS_SEEDS, label: 'Hạt' },
  { value: FoodGroup.MUSHROOMS, label: 'Nấm' },
  { value: FoodGroup.DAIRY_EGGS, label: 'Trứng sữa' },
  { value: FoodGroup.HERBS_SPICES, label: 'Thảo mộc – gia vị' },
  { value: FoodGroup.OTHER, label: 'Khác' },
];

/**
 * Tìm nguyên liệu chuẩn (debounce ~400ms, tìm không dấu do backend xử lý).
 * Tự quản lý query + lọc + phân trang.
 */
export function IngredientSearch() {
  const [keyword, setKeyword] = React.useState('');
  const [foodGroup, setFoodGroup] = React.useState<FoodGroup | 'ALL'>('ALL');
  const [page, setPage] = React.useState(1);
  const [selectedIngredient, setSelectedIngredient] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const debouncedKeyword = useDebounce(keyword.trim(), 400);

  const { data, isLoading, isError, refetch } = useIngredientsQuery({
    page,
    limit: 12,
    ...(debouncedKeyword.length > 0 ? { q: debouncedKeyword } : {}),
    ...(foodGroup !== 'ALL' ? { foodGroup } : {}),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm nguyên liệu, vd: dau phong..."
            aria-label="Tìm nguyên liệu"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="ingredient-food-group" className="sr-only">
            Lọc theo nhóm
          </Label>
          <Select
            value={foodGroup}
            onValueChange={(v) => {
              setFoodGroup(v as FoodGroup | 'ALL');
              setPage(1);
            }}
          >
            <SelectTrigger id="ingredient-food-group" className="w-44">
              <SelectValue placeholder="Nhóm thực phẩm" />
            </SelectTrigger>
            <SelectContent>
              {FOOD_GROUP_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <LoadingState message="Đang tìm nguyên liệu..." />}
      {isError && <ErrorState title="Không tải được danh sách." onRetry={() => void refetch()} />}

      {!isLoading && !isError && (!data || data.items.length === 0) && (
        <EmptyState
          title="Không tìm thấy nguyên liệu."
          description="Thử từ khóa khác (có hoặc không dấu) hoặc đổi nhóm thực phẩm."
        />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <>
          <ul className="grid gap-3 md:grid-cols-2">
            {data.items.map((item) => (
              <li key={item.id} className="rounded-2xl border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{item.canonicalName}</p>
                  <Badge variant="secondary" className="rounded-full text-[11px]">
                    {item.foodGroupLabel}
                  </Badge>
                </div>
                {item.aliases.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Còn gọi: {item.aliases.map((a) => a.alias).join(', ')}
                  </p>
                )}
                {item.allergenCodes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.allergenCodes.map((code) => (
                      <Badge key={code} variant="outline" className="rounded-full text-[11px]">
                        Dị ứng: {code}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center justify-end border-t border-muted/60 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIngredient({ id: item.id, name: item.canonicalName })}
                    className="h-8 gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                  >
                    <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span>Dinh dưỡng (100g)</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <Dialog
            open={Boolean(selectedIngredient)}
            onOpenChange={(open) => !open && setSelectedIngredient(null)}
          >
            <DialogContent className="max-w-md p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
              <DialogTitle className="sr-only">Dinh dưỡng {selectedIngredient?.name}</DialogTitle>
              {selectedIngredient && (
                <NutritionFactsPanel
                  ingredientId={selectedIngredient.id}
                  className="w-full max-w-none border-0 shadow-none p-0"
                />
              )}
            </DialogContent>
          </Dialog>
          {data.metadata.totalPages > 1 && (
            <Pagination
              page={data.metadata.page}
              totalPages={data.metadata.totalPages}
              onChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
