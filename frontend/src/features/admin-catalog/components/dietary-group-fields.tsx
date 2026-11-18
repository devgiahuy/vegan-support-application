'use client';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { DIETARY_GROUP_OPTIONS } from '@/features/ingredient/constants/dietary-groups';

export function DietaryGroupFields({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <FieldSet disabled={disabled}>
      <FieldLegend>Nhóm thực phẩm đã rà soát</FieldLegend>
      <FieldDescription className="text-pretty">
        Chọn mọi nhóm có trong nguyên liệu theo nguồn bên dưới. Không chọn nhóm nào chỉ khi nguồn đã
        xác nhận nguyên liệu không thuộc cả bảy nhóm; đây là dữ liệu phân loại, không phải danh sách
        dị ứng.
      </FieldDescription>
      <FieldGroup className="gap-3">
        {DIETARY_GROUP_OPTIONS.map((option) => {
          const id = `review-dietary-group-${option.value}`;
          return (
            <Field key={option.value} orientation="horizontal">
              <Checkbox
                id={id}
                checked={value.includes(option.value)}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  onChange(
                    checked === true
                      ? [...value.filter((group) => group !== option.value), option.value]
                      : value.filter((group) => group !== option.value)
                  )
                }
              />
              <FieldLabel htmlFor={id}>{option.label}</FieldLabel>
            </Field>
          );
        })}
      </FieldGroup>
    </FieldSet>
  );
}
