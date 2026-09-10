'use client';

import React from 'react';
import { useProductsQuery } from '../queries/product.queries';
import { ProductCard } from './product-card';
import { Loader2, AlertCircle } from 'lucide-react';

export function ProductList() {
  const { data, isLoading, isError, error } = useProductsQuery();

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Đang tải danh sách qua TanStack Query & Mapper...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <span>Lỗi tải dữ liệu: {(error as any)?.message || 'Không thể kết nối máy chủ.'}</span>
      </div>
    );
  }

  const products = data?.items || [];

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Chưa có sản phẩm nào.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
