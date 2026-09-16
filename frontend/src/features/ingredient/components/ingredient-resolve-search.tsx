'use client';

import * as React from 'react';
import { ScanSearch } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { useDebounce } from '@/hooks/useDebounce';
import { useIngredientResolveQuery } from '../queries/ingredient.queries';
import type { Ingredient } from '../types/ingredient.model';
import { ResolvePicker } from './resolve-picker';

/**
 * Ô phân giải tên nguyên liệu: nhập tên (có/không dấu) → thấy 1 trong 3 trạng
 * thái NONE/EXACT/AMBIGUOUS. Chỉ gọi API khi ≥ 2 ký tự (debounce ~400ms).
 */
export function IngredientResolveSearch() {
  const [keyword, setKeyword] = React.useState('');
  const [selected, setSelected] = React.useState<Ingredient | null>(null);
  const debouncedKeyword = useDebounce(keyword.trim(), 400);

  const { data, isLoading, isError, refetch } = useIngredientResolveQuery(debouncedKeyword);

  const handleSelect = (ingredient: Ingredient) => {
    setSelected(ingredient);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="ingredient-resolve">Tên nguyên liệu cần phân giải</Label>
        <div className="relative">
          <ScanSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="ingredient-resolve"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setSelected(null);
            }}
            placeholder="Nhập tên, vd: dau phong, đậu, xyzabc..."
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">Nhập ít nhất 2 ký tự để phân giải.</p>
      </div>

      {debouncedKeyword.length >= 2 && isLoading && <LoadingState message="Đang phân giải..." />}
      {debouncedKeyword.length >= 2 && isError && (
        <ErrorState title="Không phân giải được." onRetry={() => void refetch()} />
      )}

      {debouncedKeyword.length >= 2 && !isLoading && !isError && data && (
        <ResolvePicker resolution={data} onSelect={handleSelect} />
      )}

      {selected && (
        <p className="rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm">
          Đã chọn: <strong className="text-primary">{selected.canonicalName}</strong> (
          {selected.foodGroupLabel})
        </p>
      )}
    </div>
  );
}
