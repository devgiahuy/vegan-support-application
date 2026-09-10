import { z } from 'zod';

/** Form tạo sản phẩm. price/stock dùng coerce để nhận giá trị từ <input> (string). */
export const createProductSchema = z.object({
  name: z.string().min(2, 'Tên sản phẩm ít nhất 2 ký tự').max(200, 'Tên tối đa 200 ký tự'),
  price: z.coerce.number().min(0, 'Giá không được âm'),
  stock: z.coerce.number().int('Tồn kho phải là số nguyên').min(0, 'Tồn kho không âm').default(0),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  imageUrl: z.string().url('URL ảnh không hợp lệ').optional().or(z.literal('')),
  /** Nhập dạng "tag1, tag2" — khi submit split thành string[] ở tầng gọi mapper. */
  tags: z.string().max(500, 'Tags quá dài').optional().or(z.literal('')),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();

export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;
