'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldDescription, FieldGroup } from '@/components/ui/field';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Allergy, IngredientAllergy } from '../types/diet.model';
import { IngredientSuggestions } from '@/features/ingredient/components/ingredient-suggestions';
import type { AllergenOption } from '../types/allergen.model';
import { searchAllergens } from '../utils/allergen-search';

const SEVERITIES = [
  { value: 'MILD', label: 'Nhẹ' },
  { value: 'MODERATE', label: 'Trung bình' },
  { value: 'SEVERE', label: 'Nặng' },
];

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
  const [severity, setSeverity] = React.useState('MODERATE');
  const available = catalog.filter(
    (item) => !value.some((entry) => entry.allergenCode === item.code)
  );
  const results = searchAllergens(available, search);
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="allergy-search">Thực phẩm gây dị ứng</FieldLabel>
        <FieldDescription>
          Chọn tên thực phẩm bên dưới. Mọi mức độ dị ứng đều được áp dụng khi lọc món.
        </FieldDescription>
        {value.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Dị ứng đã chọn">
            {value.map((entry) => (
              <li
                key={entry.allergenCode}
                className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm"
              >
                <span>
                  {catalog.find((item) => item.code === entry.allergenCode)?.label ?? entry.label}
                </span>
                <Badge variant="secondary">
                  {SEVERITIES.find((item) => item.value === entry.severity)?.label ?? 'Trung bình'}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Bỏ ${entry.label}`}
                  onClick={() =>
                    onChange(value.filter((item) => item.allergenCode !== entry.allergenCode))
                  }
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {!loading &&
          !failed &&
          value.some((entry) => !catalog.some((item) => item.code === entry.allergenCode)) && (
            <Alert variant="destructive">
              <AlertDescription>
                Có lựa chọn không còn trong danh mục. Hãy bỏ mục đó và chọn lại thực phẩm trước khi
                lưu.
              </AlertDescription>
            </Alert>
          )}
        <Input
          id="allergy-search"
          value={search}
          maxLength={160}
          placeholder="Tìm thực phẩm, ví dụ: lạc, đậu phộng, vừng…"
          onChange={(event) => onSearchChange(event.target.value)}
          aria-describedby="allergy-selection-note"
        />
        {ingredientValue.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Nguyên liệu dị ứng đã chọn">
            {ingredientValue.map((entry) => (
              <li
                key={entry.ingredientId}
                className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm"
              >
                <span>{entry.ingredientName}</span>
                <Badge variant="secondary">
                  Nguyên liệu ·{' '}
                  {SEVERITIES.find((item) => item.value === entry.severity)?.label ?? 'Trung bình'}
                </Badge>
                {!entry.ingredientActive && <span>Không còn hoạt động — hãy chọn lại</span>}
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
              </li>
            ))}
          </ul>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor="allergy-severity">Mức độ cho lựa chọn tiếp theo</FieldLabel>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger id="allergy-severity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SEVERITIES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      {loading && <Skeleton className="h-24 w-full" />}
      {failed && (
        <Alert variant="destructive">
          <AlertDescription>
            Không tải được danh mục dị ứng.{' '}
            <Button type="button" variant="outline" onClick={onRetry}>
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {!loading && !failed && (
        <>
          <p className="text-sm font-medium">Nhóm dị ứng</p>
          {results.suggested && results.items.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Có phải bạn muốn tìm một trong các thực phẩm này? Hãy chọn để xác nhận.
            </p>
          )}
          {results.items.length > 0 ? (
            <ScrollArea className="h-48 rounded-md border">
              <ul aria-label="Kết quả tìm thực phẩm dị ứng" className="flex flex-col gap-1 p-2">
                {results.items.map((item) => (
                  <li key={item.code}>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto w-full justify-start whitespace-normal py-3 text-left"
                      onClick={() => {
                        onChange([
                          ...value,
                          { allergenCode: item.code, label: item.label, severity },
                        ]);
                        onSearchChange('');
                      }}
                    >
                      {item.label}
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <Alert>
              <AlertDescription>
                {search.trim()
                  ? 'Không có nhóm dị ứng trùng tên. Bạn có thể chọn nguyên liệu cụ thể bên dưới.'
                  : 'Bạn đã chọn tất cả mục trong danh mục hoặc danh mục đang trống.'}
              </AlertDescription>
            </Alert>
          )}
          <p id="allergy-selection-note" className="text-sm text-muted-foreground" role="status">
            {search.trim()
              ? 'Hãy chọn một kết quả hoặc xóa nội dung tìm kiếm trước khi lưu hồ sơ.'
              : 'Dị ứng được lưu khi bạn bấm Xác nhận & Lưu chế độ ăn.'}
          </p>
        </>
      )}
      <Field>
        <FieldLabel>Nguyên liệu cụ thể</FieldLabel>
        <FieldDescription>
          Tìm trong cùng danh mục chuẩn như khi nhập công thức. Chọn nguyên liệu chỉ loại nguyên
          liệu đó và món có chứa nó; chọn nhóm dị ứng để áp dụng cả nhóm.
        </FieldDescription>
        {search.trim().length >= 2 ? (
          <IngredientSuggestions
            query={search}
            excludedIds={ingredientValue.map((entry) => entry.ingredientId)}
            onSelect={(item) => {
              onIngredientChange([
                ...ingredientValue,
                {
                  ingredientId: item.id,
                  ingredientName: item.canonicalName,
                  severity,
                  ingredientActive: true,
                },
              ]);
              onSearchChange('');
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Nhập ít nhất 2 ký tự để tìm nguyên liệu chuẩn.
          </p>
        )}
      </Field>
    </FieldGroup>
  );
}
