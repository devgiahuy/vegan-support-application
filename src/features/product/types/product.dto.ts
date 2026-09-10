/**
 * DTO dữ liệu thô mô phỏng các biến thể payload thực tế từ Backend.
 * Backend có thể đổi tên trường, trả về số dạng chuỗi ("150000"),
 * null/undefined hoặc lồng object không nhất quán.
 */
export interface ProductDto {
  // Alias ID
  id?: string | number;
  product_id?: string | number;
  _id?: string;

  // Alias Tên sản phẩm
  name?: string;
  product_name?: string;
  item_title?: string;
  title?: string;

  // Alias Giá (có thể là số hoặc chuỗi '250000')
  price?: number | string;
  unit_price?: number | string;
  selling_price?: number | string;
  cost?: number | string;

  // Alias Trạng thái (0 | 1 hoặc 'ACTIVE' | 'INACTIVE')
  status?: string | number;
  status_code?: number;
  is_active?: boolean;

  // Alias Danh mục: lồng hoặc phẳng
  category?: {
    id?: string | number;
    category_id?: string | number;
    name?: string;
    category_name?: string;
  };
  category_id?: string | number;
  category_name?: string;

  // Alias Hình ảnh
  image?: string;
  image_url?: string;
  imageUrl?: string;
  thumbnail?: string;

  // Alias Kho hàng
  stock?: number | string;
  stock_quantity?: number | string;
  inventory?: number | string;

  // Alias Tags (có thể là mảng, chuỗi phân tách bởi dấu phẩy, hoặc null)
  tags?: string[] | string | null;

  created_at?: string;
  createdAt?: string;
}

export interface CreateProductReqDto {
  product_name: string;
  selling_price: number;
  category_id?: string | number;
  image_url?: string;
  stock_quantity?: number;
}
