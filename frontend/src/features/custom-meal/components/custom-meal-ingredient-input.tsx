'use client';

import React from 'react';
import { Plus, Trash2, Utensils } from 'lucide-react';
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
  const handleAddRow = () => {
    onChange([
      ...ingredients,
      {
        ingredientId: null,
        name: '',
        quantity: 100,
        unit: 'g',
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index));
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
    };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1.5 text-foreground">
          <Utensils className="w-4 h-4 text-primary" />
          Danh sách nguyên liệu ({ingredients.length})
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddRow}
          disabled={disabled}
          className="text-xs h-8 gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Thêm nguyên liệu
        </Button>
      </div>

      {ingredients.length === 0 ? (
        <div className="text-center py-6 border border-dashed rounded-lg bg-muted/20">
          <Utensils className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-xs text-muted-foreground">Chưa có nguyên liệu nào.</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddRow}
            disabled={disabled}
            className="text-xs text-primary mt-1"
          >
            + Thêm nguyên liệu đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {ingredients.map((row, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-lg border bg-background/50 border-input/80 transition-colors"
            >
              {/* Tên nguyên liệu */}
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Tên nguyên liệu (vd: Đậu hũ non, Bơ sáp)"
                  value={row.name}
                  onChange={(e) => handleUpdateRow(index, 'name', e.target.value)}
                  disabled={disabled}
                  className="h-8 text-xs"
                />
              </div>

              {/* Số lượng */}
              <div className="w-20">
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
                  className="h-8 text-xs"
                />
              </div>

              {/* Đơn vị */}
              <div className="w-28">
                <Select
                  value={row.unit}
                  onValueChange={(val) => handleUpdateRow(index, 'unit', val)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit} className="text-xs">
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
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                aria-label={`Xóa nguyên liệu ${row.name || index + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
