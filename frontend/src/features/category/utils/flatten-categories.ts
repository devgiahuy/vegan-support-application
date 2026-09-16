import type { Category } from '../types/category.model';

/**
 * Trải cây danh mục tối đa 2 tầng thành list phẳng.
 * Thứ tự: cha trước, các con ngay sau cha — giữ ngữ cảnh hiển thị filter.
 */
export function flattenCategories(tree: Category[]): Category[] {
  const flat: Category[] = [];
  for (const parent of tree) {
    flat.push(parent);
    for (const child of parent.children) {
      flat.push(child);
    }
  }
  return flat;
}

/** Tìm 1 node theo id trong cây 2 tầng (cha hoặc con). */
export function findCategoryById(tree: Category[], id: string): Category | undefined {
  for (const parent of tree) {
    if (parent.id === id) return parent;
    const child = parent.children.find((c) => c.id === id);
    if (child) return child;
  }
  return undefined;
}

/**
 * So khớp tên danh mục với nhãn phân loại tự do (dữ liệu mẫu).
 * Tạm thời cho tới khi API công thức/bài viết hỗ trợ lọc theo `categoryId`.
 */
export function matchesCategoryName(categoryName: string, label: string): boolean {
  const a = categoryName.trim().toLowerCase();
  const b = label.trim().toLowerCase();
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}
