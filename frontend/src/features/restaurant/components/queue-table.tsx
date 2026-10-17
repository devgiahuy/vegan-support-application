'use client';

import * as React from 'react';
import { Store, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Restaurant } from '../types/restaurant.model';
import { useRestaurantQueueQuery } from '../queries/restaurant.queries';
import { ReviewRestaurantDialog } from './review-restaurant-dialog';

/**
 * Hàng chờ kiểm duyệt quán ăn chay dành riêng cho Admin (FR-010).
 */
export function RestaurantQueueTable() {
  const [selected, setSelected] = React.useState<Restaurant | null>(null);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const { data, isLoading, isError, refetch } = useRestaurantQueueQuery();
  const queue = data?.items ?? [];

  const handleOpenReview = (item: Restaurant) => {
    setSelected(item);
    setReviewOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Store className="size-4 text-primary" /> Hàng chờ duyệt quán ăn ({queue.length})
        </p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Làm mới
        </Button>
      </div>

      {isLoading && <LoadingState message="Đang tải danh sách quán chờ duyệt..." />}
      {isError && (
        <ErrorState title="Không tải được hàng chờ kiểm duyệt." onRetry={() => void refetch()} />
      )}
      {!isLoading && !isError && queue.length === 0 && (
        <EmptyState
          title="Hàng chờ trống"
          description="Hiện không có đề xuất quán chay nào cần phê duyệt."
        />
      )}
      {!isLoading && !isError && queue.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quán ăn đề xuất</TableHead>
                <TableHead>Chế độ ăn & Món</TableHead>
                <TableHead>Người gửi</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-semibold">{item.name}</p>
                    <p className="max-w-64 truncate text-xs text-muted-foreground">
                      {item.address}
                    </p>
                    {item.phoneNumber && (
                      <p className="text-[11px] text-muted-foreground">SĐT: {item.phoneNumber}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {item.dietaryTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.dietaryTags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {item.dishes.length > 0 && (
                        <p className="max-w-48 truncate text-xs text-muted-foreground">
                          {item.dishes.join(', ')}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {item.submittedByName ?? 'Thành viên cộng đồng'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => handleOpenReview(item)} className="gap-1.5">
                      <Eye className="size-3.5" /> Xem & Duyệt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ReviewRestaurantDialog
        key={`${selected?.id ?? 'none'}:${reviewOpen}`}
        restaurant={selected}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
      />
    </div>
  );
}
