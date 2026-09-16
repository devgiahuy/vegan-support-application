import { CatalogStatus, CategoryType } from '@/common/enums';

/**
 * Danh mục dùng cho UI. Cây tối đa 2 tầng do backend giới hạn.
 */
export interface Category {
  id: string;
  /** null = gốc. */
  parentId: string | null;
  name: string;
  slug: string;
  type: CategoryType;
  typeLabel: string;
  status: CatalogStatus;
  sortOrder: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  /** Con trực tiếp (tầng 2); `[]` khi không có. */
  children: Category[];
}
