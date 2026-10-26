import { ResolutionMatch } from '@/common/enums';
import { ingredientApi } from '../api/ingredient.api';

/**
 * Tự liên kết tên nguyên liệu tự nhập với nguyên liệu chuẩn khi BE phân giải được đúng MỘT kết quả (EXACT).
 * Trùng nghĩa/không có kết quả (AMBIGUOUS/NONE) thì giữ tên tự nhập — không đoán hộ. Lỗi mạng cũng giữ tên tự nhập.
 */
export async function resolveExactIngredientId(name: string): Promise<string | null> {
  const query = name.trim();
  if (query.length < 2) return null;
  try {
    const resolution = await ingredientApi.resolveIngredient(query);
    return resolution.match === ResolutionMatch.EXACT && resolution.candidates.length === 1
      ? resolution.candidates[0].id || null
      : null;
  } catch {
    return null;
  }
}
