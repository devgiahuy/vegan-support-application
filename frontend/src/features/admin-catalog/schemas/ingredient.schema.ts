import { z } from 'zod';
import { FoodGroup } from '@/common/enums';

const nonEmptyString = (label: string) => z.string().trim().min(1, `${label} không được trống`);

export const ingredientFormSchema = z.object({
  canonicalName: nonEmptyString('Tên chuẩn').pipe(
    z.string().max(200, 'Tên chuẩn tối đa 200 ký tự')
  ),
  foodGroup: z.enum(
    [
      FoodGroup.GRAINS,
      FoodGroup.LEGUMES,
      FoodGroup.VEGETABLES,
      FoodGroup.FRUITS,
      FoodGroup.NUTS_SEEDS,
      FoodGroup.MUSHROOMS,
      FoodGroup.DAIRY_EGGS,
      FoodGroup.HERBS_SPICES,
      FoodGroup.OTHER,
    ],
    { message: 'Vui lòng chọn nhóm thực phẩm' }
  ),
  allergenCodes: z.array(nonEmptyString('Mã dị ứng')).default([]),
  dietCompatibilities: z
    .array(
      z.object({
        dietPattern: nonEmptyString('Kiểu ăn'),
        compatible: z.boolean(),
      })
    )
    .default([]),
  traditionWarnings: z
    .array(
      z.object({
        tradition: nonEmptyString('Truyền thống'),
        warningCode: nonEmptyString('Mã cảnh báo'),
        label: nonEmptyString('Nhãn cảnh báo'),
      })
    )
    .default([]),
});

export type IngredientFormValues = z.infer<typeof ingredientFormSchema>;

export const aliasFormSchema = z.object({
  alias: nonEmptyString('Tên gọi khác').pipe(z.string().max(200, 'Tên gọi khác tối đa 200 ký tự')),
});

export type AliasFormValues = z.infer<typeof aliasFormSchema>;
