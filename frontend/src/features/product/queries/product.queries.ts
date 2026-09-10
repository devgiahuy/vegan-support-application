import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../api/product.api';
import { Product } from '../types/product.model';
import { toast } from 'sonner';

export const PRODUCT_QUERY_KEYS = {
  all: ['products'] as const,
  list: (params?: Record<string, any>) => [...PRODUCT_QUERY_KEYS.all, 'list', params] as const,
  detail: (id: string | number) => [...PRODUCT_QUERY_KEYS.all, 'detail', id] as const,
};

export const useProductsQuery = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.list(params),
    queryFn: () => productApi.getProducts(params),
  });
};

export const useProductDetailQuery = (id: string | number) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.detail(id),
    queryFn: () => productApi.getProductDetail(id),
    enabled: !!id,
  });
};

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newProduct: Partial<Product>) => productApi.createProduct(newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      toast.success('Thêm sản phẩm thành công!');
    },
  });
};
