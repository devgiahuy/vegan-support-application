'use client';

import { AlertTriangle, Plus, Search, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldDescription, FieldLabel, FieldLegend, FieldSet, Field } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Allergy, IngredientAllergy } from '../types/diet.model';
import { IngredientSuggestions } from '@/features/ingredient/components/ingredient-suggestions';
import type { AllergenOption } from '../types/allergen.model';
import { searchAllergens } from '../utils/allergen-search';

export const SEVERITIES = [
  { value: 'MILD', label: 'Nhẹ' },
  { value: 'MODERATE', label: 'Trung bình' },
  { value: 'SEVERE', label: 'Nặng' },
] as const;

export function severityLabel(value: string) {
  return SEVERITIES.find((item) => item.value === value)?.label ?? 'Trung bình';
}

function SeverityToggle({
  value,
  onChange,
  name,
}: {
  value: string;
  onChange: (value: string) => void;
  name: string;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
      aria-label={`Mức độ dị ứng ${name}`}
    >
      {SEVERITIES.map((item) => (
        <ToggleGroupItem key={item.value} value={item.value} className="px-2.5 text-xs">
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/**
 * Khai báo dị ứng bằng một ô tìm kiếm: kết quả gồm nhóm dị ứng (áp dụng cả nhóm) và
 * nguyên liệu chuẩn cụ thể. Mức độ chỉnh trực tiếp trên từng mục đã chọn.
 */
export function AllergyEditor({
  value,
  onChange,
  search,
  onSearchChange,
  catalog,
  loading,
  failed,
  onRetry,
  ingredientValue,
  onIngredientChange,
}: {
  value: Allergy[];
  onChange: (value: Allergy[]) => void;
  search: string;
  onSearchChange: (search: string) => void;
  catalog: AllergenOption[];
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  ingredientValue: IngredientAllergy[];
  onIngredientChange: (value: IngredientAllergy[]) => void;
}) {
  const query = search.trim();
  const available = catalog.filter(
    (item) => !value.some((entry) => entry.allergenCode === item.code)
  );
  const results = query
    ? searchAllergens(available, query)
    : { items: available, suggested: false };
  const selectedCount = value.length + ingredientValue.length;
  const staleGroups =
    !loading && !failed
      ? value.filter((entry) => !catalog.some((item) => item.code === entry.allergenCode))
      : [];

  const addGroup = (item: AllergenOption) => {
    onChange([...value, { allergenCode: item.code, label: item.label, severity: 'MODERATE' }]);
    onSearchChange('');
  };

  return (
    <FieldSet>
      <FieldLegend>Dị ứng thực phẩm</FieldLegend>
      <FieldDescription>
        Món chứa thứ bạn dị ứng sẽ bị loại khỏi mọi gợi ý, kể cả khi mức độ là nhẹ. Bỏ qua phần này
        nếu bạn không dị ứng.
      </FieldDescription>

      <Field>
        <FieldLabel htmlFor="allergy-search" className="sr-only">
          Tìm nhóm dị ứng hoặc nguyên liệu
        </FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            id="allergy-search"
            value={search}
            maxLength={160}
            autoComplete="off"
            placeholder="Tìm nhóm dị ứng hoặc nguyên liệu, vd: đậu phộng, nấm hương…"
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {search && (
            <InputGroupAddon align="inline-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Xóa nội dung tìm kiếm dị ứng"
                onClick={() => onSearchChange('')}
              >
                <X />
              </Button>
            </InputGroupAddon>
          )}
        </InputGroup>
      </Field>

      <div className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {query ? 'Nhóm dị ứng phù hợp' : 'Nhóm dị ứng thường gặp'}
            <span className="font-normal"> · áp dụng cho cả nhóm</span>
          </p>
          {loading && <Skeleton className="h-16 w-full" />}
          {failed && (
            <Alert variant="destructive">
              <AlertDescription className="flex flex-wrap items-center gap-2">
                Không tải được danh mục dị ứng.
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                  Thử lại
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {!loading && !failed && (
            <>
              {results.suggested && results.items.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Không có tên trùng khớp. Có phải bạn muốn tìm:
                </p>
              )}
              {results.items.length > 0 ? (
                <ul className="flex flex-wrap gap-2" aria-label="Kết quả nhóm dị ứng">
                  {results.items.map((item) => (
                    <li key={item.code}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        title={item.description || undefined}
                        onClick={() => addGroup(item)}
                      >
                        <Plus data-icon="inline-start" />
                        {item.label}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {query
                    ? 'Không có nhóm dị ứng trùng tên.'
                    : 'Bạn đã chọn tất cả nhóm trong danh mục.'}
                </p>
              )}
            </>
          )}
        </div>

        {query.length >= 2 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Nguyên liệu cụ thể
              <span className="font-normal"> · chỉ nguyên liệu này và món có chứa nó</span>
            </p>
            <IngredientSuggestions
              query={search}
              excludedIds={ingredientValue.map((entry) => entry.ingredientId)}
              onSelect={(item) => {
                onIngredientChange([
                  ...ingredientValue,
                  {
                    ingredientId: item.id,
                    ingredientName: item.canonicalName,
                    severity: 'MODERATE',
                    ingredientActive: true,
                  },
                ]);
                onSearchChange('');
              }}
            />
          </div>
        )}
        {query.length === 1 && (
          <p className="text-xs text-muted-foreground">
            Nhập thêm ít nhất 1 ký tự để tìm nguyên liệu cụ thể.
          </p>
        )}
      </div>

      {staleGroups.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden />
          <AlertDescription>
            {staleGroups.map((entry) => entry.label).join(', ')} không còn trong danh mục. Hãy bỏ và
            chọn lại trước khi lưu.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Đã khai báo ({selectedCount})</p>
        {selectedCount === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa khai báo dị ứng nào.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-xl border" aria-label="Dị ứng đã chọn">
            {value.map((entry) => {
              const name =
                catalog.find((item) => item.code === entry.allergenCode)?.label ?? entry.label;
              return (
                <li
                  key={`group-${entry.allergenCode}`}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate text-sm font-medium">{name}</span>
                    <Badge variant="secondary">Cả nhóm</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <SeverityToggle
                      name={name}
                      value={entry.severity || 'MODERATE'}
                      onChange={(severity) =>
                        onChange(
                          value.map((item) =>
                            item.allergenCode === entry.allergenCode ? { ...item, severity } : item
                          )
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Bỏ dị ứng ${name}`}
                      onClick={() =>
                        onChange(value.filter((item) => item.allergenCode !== entry.allergenCode))
                      }
                    >
                      <X />
                    </Button>
                  </div>
                </li>
              );
            })}
            {ingredientValue.map((entry) => (
              <li
                key={`ingredient-${entry.ingredientId}`}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium">{entry.ingredientName}</span>
                  <Badge variant="outline">Nguyên liệu</Badge>
                  {!entry.ingredientActive && (
                    <Badge variant="destructive">Ngừng hoạt động, hãy bỏ</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <SeverityToggle
                    name={entry.ingredientName}
                    value={entry.severity || 'MODERATE'}
                    onChange={(severity) =>
                      onIngredientChange(
                        ingredientValue.map((item) =>
                          item.ingredientId === entry.ingredientId ? { ...item, severity } : item
                        )
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Bỏ dị ứng ${entry.ingredientName}`}
                    onClick={() =>
                      onIngredientChange(
                        ingredientValue.filter((item) => item.ingredientId !== entry.ingredientId)
                      )
                    }
                  >
                    <X />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </FieldSet>
  );
}
