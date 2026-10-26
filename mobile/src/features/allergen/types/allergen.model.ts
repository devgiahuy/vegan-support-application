/** Một mục trong danh mục dị ứng chuẩn — người dùng phải chọn tường minh từ danh mục này. */
export interface AllergenOption {
  code: string;
  label: string;
  description: string | null;
  /** Tên đồng nghĩa đã được duyệt, dùng để tìm kiếm. */
  searchTerms: string[];
}
