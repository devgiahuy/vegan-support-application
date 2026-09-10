import api from '@/lib/axios';
import { APIResponse, PaginationResult } from '@/types/api';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { ProductDto } from '../types/product.dto';
import { Product } from '../types/product.model';
import { productMapper } from '../mappers/product.mapper';

// Dữ liệu mock giả lập phong phú để FE chạy demo ngay lập tức không phụ thuộc Backend
const MOCK_BACKEND_PRODUCTS: ProductDto[] = [
  {
    product_id: 'PRD-001', // Backend dùng product_id
    item_title: 'Áo Sơ Mi Oxford Slim Fit', // Backend dùng item_title
    selling_price: '380000', // Backend trả về chuỗi số
    status_code: 1, // Backend dùng status_code dạng số
    category: { category_id: 'cat-1', category_name: 'Áo sơ mi' },
    image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    inventory: 45, // Backend dùng inventory
    tags: 'oxford,congso,nam', // Backend trả về chuỗi comma-separated
    created_at: '2026-03-01T08:30:00Z',
  },
  {
    _id: 'PRD-002', // Backend đổi sang _id
    product_name: 'Quần Jeans Tapered Indigo', // Backend đổi sang product_name
    cost: 550000, // Backend gửi cost thay vì price
    status: 'ACTIVE', // Backend gửi chuỗi 'ACTIVE'
    category_name: 'Quần jeans', // Backend trả về phẳng không lồng
    thumbnail: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80',
    stock_quantity: '28',
    tags: ['denim', 'casual', 'indigo'],
    createdAt: '2026-03-05T10:15:00Z',
  },
  {
    id: 'PRD-003',
    name: 'Áo Khoác Bomber Minimalist',
    price: 890000,
    status: 1,
    category: { id: 'cat-3', name: 'Áo khoác' },
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80',
    stock: 12,
    tags: null, // Backend trả về null
    created_at: '2026-03-08T14:20:00Z',
  },
];

export const productApi = {
  getProducts: async (params?: { page?: number; limit?: number }): Promise<PaginationResult<Product>> => {
    try {
      const res = await api.get<APIResponse<PaginationResult<ProductDto>>>(API_ENDPOINTS.PRODUCTS.LIST, {
        params,
        silent: true,
      });
      return productMapper.toPaginationModel(res.data.data);
    } catch {
      // Khi chưa có backend thật, fallback trả về Mock Data đã được map qua Mapper
      const mapped = productMapper.toModelList(MOCK_BACKEND_PRODUCTS);
      return {
        items: mapped,
        metadata: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          totalItems: mapped.length,
          totalPages: 1,
        },
      };
    }
  },

  getProductDetail: async (id: string | number): Promise<Product> => {
    try {
      const res = await api.get<APIResponse<ProductDto>>(API_ENDPOINTS.PRODUCTS.DETAIL(id));
      return productMapper.toModel(res.data.data);
    } catch {
      const found = MOCK_BACKEND_PRODUCTS.find((p) => p.product_id === id || p._id === id || p.id === id);
      return productMapper.toModel(found || MOCK_BACKEND_PRODUCTS[0]);
    }
  },

  createProduct: async (product: Partial<Product>): Promise<Product> => {
    const payload = productMapper.toCreateDto(product);
    const res = await api.post<APIResponse<ProductDto>>(API_ENDPOINTS.PRODUCTS.CREATE, payload);
    return productMapper.toModel(res.data.data);
  },
};
