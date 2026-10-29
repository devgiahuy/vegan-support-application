import type { UnitGroup } from '@/features/recipe/components/recipe-unit-picker';

/** Đơn vị thông dụng khi thêm nguyên liệu vào tủ bếp — đồng bộ `COMMON_UNITS` của `pantry-item-dialog.tsx` (web). */
export const PANTRY_UNIT_GROUPS: readonly UnitGroup[] = [
  {
    category: 'Đơn vị thông dụng',
    units: [
      { value: 'g', label: 'g (Gam)' },
      { value: 'kg', label: 'kg (Kilôgam)' },
      { value: 'ml', label: 'ml (Mililít)' },
      { value: 'l', label: 'l (Lít)' },
      { value: 'quả', label: 'quả / trái' },
      { value: 'củ', label: 'củ' },
      { value: 'tép', label: 'tép / nhánh' },
      { value: 'cây', label: 'cây' },
      { value: 'bó', label: 'bó' },
      { value: 'miếng', label: 'miếng / lát' },
      { value: 'muỗng canh', label: 'muỗng canh (tbsp)' },
      { value: 'muỗng cà phê', label: 'muỗng cà phê (tsp)' },
      { value: 'chén', label: 'chén / bát' },
      { value: 'gói', label: 'gói' },
      { value: 'hộp', label: 'hộp' },
      { value: 'lon', label: 'lon' },
      { value: 'túi', label: 'túi / bịch' },
    ],
  },
];
