'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, PackageCheck, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { useProductDetailQuery } from '@/features/product/queries/product.queries';
import { formatDate } from '@/lib/utils';
import { StatusEnum } from '@/common/enums';

/**
 * Route mẫu: chi tiết 1 entity (TanStack detail query + Mapper + shared states).
 * Copy-paste cho mọi trang [id]: đổi query hook + khối render là xong.
 */
export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data: product, isLoading, isError, error, refetch } = useProductDetailQuery(id);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      {isLoading && <LoadingState message="Đang tải chi tiết sản phẩm..." />}

      {isError && (
        <ErrorState
          error={error}
          title="Không tải được chi tiết sản phẩm."
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && !product && (
        <EmptyState title="Không tìm thấy sản phẩm." description={`ID: ${id}`} />
      )}

      {product && (
        <Card className="overflow-hidden">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="relative aspect-square w-full overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            <CardContent className="flex flex-col gap-3 p-6">
              <div className="flex items-center gap-2">
                <Badge variant={product.status === StatusEnum.ACTIVE ? 'success' : 'secondary'}>
                  {product.statusLabel}
                </Badge>
                <span className="text-xs text-muted-foreground">{product.category.name}</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
              <p className="text-3xl font-extrabold text-primary">{product.formattedPrice}</p>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <PackageCheck className="h-4 w-4" /> Tồn kho:{' '}
                  <strong className="text-foreground">{product.stock}</strong>
                </p>
                <p className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Ngày nhập: {formatDate(product.createdAt)}
                </p>
              </div>
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                    >
                      <Tag className="h-3 w-3" /> {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-auto pt-4">
                <Button asChild>
                  <Link href="/products">Xem danh sách</Link>
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  );
}
