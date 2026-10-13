/** Tên tiếng Việt của các chất gây dị ứng phổ biến theo mã backend (đồng bộ web: `frontend/src/common/constants/diet-labels.ts`). */
export const ALLERGEN_NAMES: Record<string, string> = {
  SOY: 'Đậu nành',
  PEANUT: 'Đậu phộng (lạc)',
  TREE_NUT: 'Hạt cây',
  TREE_NUTS: 'Hạt cây',
  GLUTEN: 'Gluten (lúa mì)',
  SESAME: 'Mè (vừng)',
  MILK: 'Sữa bò / Chế phẩm sữa',
  EGG: 'Trứng gia cầm',
  CELERY: 'Cần tây',
  MUSTARD: 'Mù tạt',
  SULFITES: 'Sulfite',
  SULFITE: 'Sulfite',
  FISH: 'Cá',
  SHELLFISH: 'Hải sản có vỏ',
  CRUSTACEAN: 'Giáp xác',
  MOLLUSC: 'Thân mềm',
  LUPIN: 'Đậu lupin',
  WHEAT: 'Lúa mì',
  DAIRY: 'Sữa bò / Chế phẩm sữa',
  CORN: 'Bắp (ngô)',
};

/** Tên thân thiện của chất gây dị ứng; mã lạ giữ nguyên để không giấu thông tin. */
export function getAllergenName(code?: string | null): string {
  if (!code) return '';
  const trimmed = code.trim();
  return ALLERGEN_NAMES[trimmed.toUpperCase()] ?? trimmed;
}
