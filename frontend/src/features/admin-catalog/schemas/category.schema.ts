import { z } from 'zod';
import { CategoryType } from '@/common/enums';

const slugSchema = z
  .string()
  .max(120, 'Slug tối đa 120 ký tự')
  .refine((v) => v.trim().length === 0 || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.trim()), {
    message: 'Slug chỉ gồm chữ thường, số và dấu gạch ngang',
  });

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên danh mục').max(120, 'Tên tối đa 120 ký tự'),
  type: z.enum([CategoryType.FOOD_TYPE, CategoryType.RECIPE_GROUP, CategoryType.CONTENT_TOPIC], {
    message: 'Vui lòng chọn loại danh mục',
  }),
  slug: slugSchema.optional(),
  parentId: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0, 'Thứ tự phải từ 0 trở lên').default(0),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
