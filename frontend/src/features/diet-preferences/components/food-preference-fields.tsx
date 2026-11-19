'use client';

import { Egg, Flower2, Milk, Vegan } from 'lucide-react';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import type { FoodAllowances } from '../types/food-allowances.model';

export const FOOD_ALLOWANCE_OPTIONS = [
  {
    key: 'allowEggs',
    label: 'Ăn trứng',
    description: 'Trứng và thực phẩm có thành phần từ trứng.',
    icon: Egg,
  },
  {
    key: 'allowDairy',
    label: 'Ăn sữa',
    description: 'Sữa động vật và các sản phẩm như bơ, phô mai, sữa chua.',
    icon: Milk,
  },
  {
    key: 'allowHoney',
    label: 'Ăn mật ong',
    description: 'Mật ong và thực phẩm có thành phần mật ong.',
    icon: Vegan,
  },
  {
    key: 'allowFivePungent',
    label: 'Ăn ngũ vị tân',
    description: 'Hành, hẹ, tỏi, kiệu và hưng cừ.',
    icon: Flower2,
  },
] as const;

export function FoodPreferenceFields({
  value,
  onChange,
  disabled = false,
}: {
  value: FoodAllowances;
  onChange: (value: FoodAllowances) => void;
  disabled?: boolean;
}) {
  return (
    <FieldSet disabled={disabled}>
      <FieldLegend>Bạn có ăn những thực phẩm này không?</FieldLegend>
      <FieldDescription className="text-pretty">
        Bật để cho phép, tắt để kiêng. Thiết lập áp dụng mỗi ngày. Thịt, cá và các thành phần từ
        thịt cá luôn được loại khỏi gợi ý.
      </FieldDescription>
      <FieldGroup className="gap-0 divide-y rounded-xl border px-4">
        {FOOD_ALLOWANCE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const id = `food-allowance-${option.key}`;
          const descriptionId = `${id}-description`;
          return (
            <Field key={option.key} orientation="horizontal" className="items-center py-4">
              <Icon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
              <FieldContent>
                <FieldLabel htmlFor={id}>{option.label}</FieldLabel>
                <FieldDescription id={descriptionId} className="text-pretty">
                  {option.description}
                </FieldDescription>
              </FieldContent>
              <Switch
                id={id}
                checked={value[option.key]}
                disabled={disabled}
                aria-describedby={descriptionId}
                onCheckedChange={(checked) => onChange({ ...value, [option.key]: checked })}
              />
            </Field>
          );
        })}
      </FieldGroup>
      <FieldDescription className="text-pretty">
        Dị ứng và nguyên liệu bạn chọn kiêng luôn được ưu tiên, kể cả khi bạn bật cho phép ở đây.
      </FieldDescription>
    </FieldSet>
  );
}
