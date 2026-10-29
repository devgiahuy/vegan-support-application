'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Link2, Plus, Trash2, Utensils } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IngredientSuggestions } from '@/features/ingredient/components/ingredient-suggestions';
import type { Ingredient } from '@/features/ingredient/types/ingredient.model';

export interface IngredientRow {
  ingredientId?: string | null;
  name: string;
  quantity: number;
  unit: string;
}

interface CustomMealIngredientInputProps {
  ingredients: IngredientRow[];
  onChange: (ingredients: IngredientRow[]) => void;
  disabled?: boolean;
}

const COMMON_UNITS = [
  'g',
  'ml',
  'kg',
  'l',
  'muỗng cà phê',
  'muỗng canh',
  'quả',
  'chén',
  'lát',
  'bìa',
];

export const CustomMealIngredientInput: React.FC<CustomMealIngredientInputProps> = ({
  ingredients,
  onChange,
  disabled = false,
}) => {
  const [linkingIndex, setLinkingIndex] = React.useState<number | null>(null);
  const unlinkedCount = ingredients.filter(
    (row) => row.name.trim().length > 0 && !row.ingredientId
  ).length;

  const handleAddRow = () => {
    onChange([
      ...ingredients,
      {
        ingredientId: null,
        name: '',
        quantity: 0,
        unit: 'g',
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setLinkingIndex(null);
    onChange(ingredients.filter((_, i) => i !== index));
  };

  // Tên phải trùng tên chuẩn để backend không trả INGREDIENT_ID_NAME_MISMATCH.
  const handleLink = (index: number, item: Ingredient) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], name: item.canonicalName, ingredientId: item.id };
    onChange(updated);
    setLinkingIndex(null);
  };

  const handleUpdateRow = (
    index: number,
    field: keyof IngredientRow,
    value: string | number | null
  ) => {
    const updated = [...ingredients];
    updated[index] = {
      ...updated[index],
      [field]: value,
      ...(field === 'name' ? { ingredientId: null } : {}),
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <Utensils className="w-4 h-4 text-primary" />
          Danh sách nguyên liệu ({ingredients.length})
        </Label>
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={handleAddRow}
          disabled={disabled}
          className="text-sm h-9 gap-1.5 px-3 font-medium"
        >
          <Plus className="w-4 h-4" />
          Thêm nguyên liệu
        </Button>
      </div>

      {unlinkedCount > 0 && (
        <Alert className="border-amber-500/40 bg-amber-500/5">
          <AlertTriangle className="text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-xs">
            Có {unlinkedCount} nguyên liệu tự do chưa liên kết với Ngân hàng Thực phẩm. Hệ thống
            không kiểm tra được dị ứng, nguyên liệu cần tránh và chế độ ăn với các nguyên liệu này,
            nên món sẽ không thêm được vào thực đơn tuần nếu hồ sơ ăn uống của bạn có các yêu cầu
            đó. Chọn &quot;Liên kết&quot; ở từng dòng để khắc phục.
          </AlertDescription>
        </Alert>
      )}

      {ingredients.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-xl bg-muted/20 space-y-2">
          <Utensils className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
          <p className="text-sm text-muted-foreground font-medium">Chưa có nguyên liệu nào.</p>
          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={handleAddRow}
            disabled={disabled}
            className="text-sm text-primary hover:text-primary/90 h-9 font-medium"
          >
            + Thêm nguyên liệu đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {ingredients.map((row, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 sm:gap-2.5 p-3 rounded-xl border bg-background/50 border-input transition-colors shadow-2xs"
            >
              {/* Tên nguyên liệu + trạng thái liên kết */}
              <div className="flex-1 space-y-1.5">
                <Input
                  type="text"
                  placeholder="Tên nguyên liệu (vd: Đậu hũ non, Bơ sáp)"
                  value={row.name}
                  onChange={(e) => handleUpdateRow(index, 'name', e.target.value)}
                  disabled={disabled}
                  className="h-10 text-sm bg-background"
                />
                {row.ingredientId ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 aria-hidden className="h-3 w-3" /> Đã liên kết nguyên liệu chuẩn
                  </span>
                ) : row.name.trim().length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      <AlertTriangle aria-hidden className="h-3 w-3" /> Tự do, chưa liên kết
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => setLinkingIndex(linkingIndex === index ? null : index)}
                      disabled={disabled}
                      aria-expanded={linkingIndex === index}
                      className="h-auto gap-1 p-0 text-[11px]"
                    >
                      <Link2 aria-hidden className="h-3 w-3" />
                      {linkingIndex === index ? 'Đóng gợi ý' : 'Liên kết'}
                    </Button>
                  </div>
                ) : null}
                {linkingIndex === index && !row.ingredientId && row.name.trim().length > 0 && (
                  <IngredientSuggestions
                    query={row.name}
                    onSelect={(item) => handleLink(index, item)}
                  />
                )}
              </div>

              {/* Nhóm Số lượng + Đơn vị + Nút xóa */}
              <div className="flex items-center gap-2">
                {/* Số lượng */}
                <div className="w-28 sm:w-28">
                  <Input
                    type="number"
                    placeholder="Số lượng"
                    min="0.1"
                    step="any"
                    value={row.quantity || ''}
                    onChange={(e) =>
                      handleUpdateRow(index, 'quantity', parseFloat(e.target.value) || 0)
                    }
                    disabled={disabled}
                    className="h-10 text-sm bg-background"
                  />
                </div>

                {/* Đơn vị */}
                <div className="flex-1 sm:w-32">
                  <Select
                    value={row.unit}
                    onValueChange={(val) => handleUpdateRow(index, 'unit', val)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-10 text-sm bg-background">
                      <SelectValue placeholder="Đơn vị" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit} className="text-sm">
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Nút xóa dòng */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveRow(index)}
                  disabled={disabled}
                  className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 rounded-lg"
                  aria-label={`Xóa nguyên liệu ${row.name || index + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
