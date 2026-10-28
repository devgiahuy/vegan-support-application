'use client';

import * as React from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import type { IngredientExclusion } from '../types/diet.model';
import { IngredientSuggestions } from '@/features/ingredient/components/ingredient-suggestions';

const exclusionKey = (entry: IngredientExclusion) =>
  entry.ingredientId ?? `name:${entry.ingredientName.trim().toLowerCase()}`;

/**
 * Quản lý nguyên liệu kiêng. Danh sách kiêng luôn là ràng buộc cứng ở backend.
 * Ưu tiên nguyên liệu chuẩn; tên tự nhập chỉ là phương án dự phòng.
 */
export function ExclusionEditor({
  value,
  onChange,
  search,
  onSearchChange,
}: {
  value: IngredientExclusion[];
  onChange: (v: IngredientExclusion[]) => void;
  search: string;
  onSearchChange: (search: string) => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const query = search.trim();

  const isDuplicate = (name: string, id: string | null) =>
    value.some(
      (entry) =>
        (id !== null && entry.ingredientId === id) ||
        entry.ingredientName.trim().toLowerCase() === name.trim().toLowerCase()
    );

  const add = (entry: IngredientExclusion) => {
    if (isDuplicate(entry.ingredientName, entry.ingredientId)) {
      setError(`“${entry.ingredientName}” đã có trong danh sách kiêng.`);
      return;
    }
    setError(null);
    onChange([...value, entry]);
    onSearchChange('');
  };

  const update = (key: string, patch: Partial<IngredientExclusion>) =>
    onChange(value.map((entry) => (exclusionKey(entry) === key ? { ...entry, ...patch } : entry)));

  return (
    <FieldSet>
      <FieldLegend>Nguyên liệu không ăn</FieldLegend>
      <FieldDescription>
        Dù không dị ứng, bạn vẫn có thể loại hẳn nguyên liệu mình không muốn ăn. Món chứa chúng sẽ
        không bao giờ được gợi ý.
      </FieldDescription>

      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="exclusion-search" className="sr-only">
          Tìm nguyên liệu muốn kiêng
        </FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            id="exclusion-search"
            value={search}
            maxLength={160}
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            placeholder="Tìm nguyên liệu, vd: dứa, sầu riêng, mắm tôm…"
            onChange={(event) => {
              setError(null);
              onSearchChange(event.target.value);
            }}
          />
          {search && (
            <InputGroupAddon align="inline-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Xóa nội dung tìm kiếm nguyên liệu kiêng"
                onClick={() => onSearchChange('')}
              >
                <X />
              </Button>
            </InputGroupAddon>
          )}
        </InputGroup>
        {error && <FieldError>{error}</FieldError>}
      </Field>

      {query.length >= 2 && (
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground">Nguyên liệu chuẩn</p>
          <IngredientSuggestions
            query={search}
            excludedIds={value.flatMap((entry) => (entry.ingredientId ? [entry.ingredientId] : []))}
            onSelect={(item) =>
              add({ ingredientId: item.id, ingredientName: item.canonicalName, reason: '' })
            }
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-pretty text-muted-foreground">
              Không có trong danh mục? Tên tự nhập chỉ khớp theo tên nên lọc kém chính xác hơn.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => add({ ingredientId: null, ingredientName: query, reason: '' })}
            >
              <Plus data-icon="inline-start" />
              Thêm “{query}”
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Đang kiêng ({value.length})</p>
        {value.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có nguyên liệu kiêng nào.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-xl border" aria-label="Nguyên liệu kiêng">
            {value.map((entry) => {
              const key = exclusionKey(entry);
              return (
                <li key={key} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-center gap-2 sm:w-2/5">
                    <span className="truncate text-sm font-medium">{entry.ingredientName}</span>
                    <Badge variant={entry.ingredientId ? 'secondary' : 'outline'}>
                      {entry.ingredientId ? 'Chuẩn' : 'Tự nhập'}
                    </Badge>
                  </div>
                  <div className="flex flex-1 items-center gap-1">
                    <Input
                      value={entry.reason}
                      maxLength={500}
                      placeholder="Lý do (tùy chọn)"
                      aria-label={`Lý do kiêng ${entry.ingredientName}`}
                      className="h-8 text-sm"
                      onChange={(event) => update(key, { reason: event.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Bỏ kiêng ${entry.ingredientName}`}
                      onClick={() => onChange(value.filter((item) => exclusionKey(item) !== key))}
                    >
                      <X />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </FieldSet>
  );
}
