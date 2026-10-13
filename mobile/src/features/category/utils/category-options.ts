import type { DropdownOption } from '@/components/ui/dropdown-field';
import type { Category } from '../types/category.model';

/** Lựa chọn cho `DropdownField` từ cây danh mục 2 tầng: mục "Tất cả" đầu tiên, danh mục con thụt lề dưới cha. */
export function buildCategoryOptions(tree: Category[], allLabel = 'Tất cả danh mục'): DropdownOption<string | null>[] {
  return [
    { value: null, label: allLabel, shortLabel: 'Tất cả' },
    ...tree.flatMap((parent) => [
      { value: parent.id, label: parent.name, depth: 0 },
      ...parent.children.map((child) => ({ value: child.id, label: child.name, depth: 1 })),
    ]),
  ];
}
