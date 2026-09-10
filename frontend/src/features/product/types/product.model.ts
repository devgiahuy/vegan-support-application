import { StatusEnum } from '@/common/enums';

/**
 * Domain Model chuẩn Frontend - Đảm bảo tính nhất quán 100% cho UI
 */
export interface ProductCategory {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  formattedPrice: string;
  status: StatusEnum;
  statusLabel: string;
  category: ProductCategory;
  imageUrl: string;
  stock: number;
  tags: string[];
  createdAt: Date | null;
}
