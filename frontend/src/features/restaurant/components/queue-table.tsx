'use client';

import * as React from 'react';
import { Store } from 'lucide-react';
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

/** Hàng chờ duyệt quán (fixture ở phase scaffold). */
export function RestaurantQueueTable() {
  const [selected, setSelected] = React.useState<Restaurant | null>(null);
  const { data, isLoading, isError, refetch } = useRestaurantQueueQuery();
  const queue = data?.items ?? [];

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Store className="size-4" /> Quán chờ duyệt ({queue.length})
      </p>

      {isLoading && <LoadingState message="Đang tải hàng chờ..." />}
      {isError && <ErrorState title="Không tải được hàng chờ." onRetry={() => void refetch()} />}
      {!isLoading && !isError && queue.length === 0 && (
        <EmptyState title="Hết quán chờ" description="Không còn quán nào cần duyệt." />
      )}
      {!isLoading && !isError && queue.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quán</TableHead>
                <TableHead>Người gửi</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.name}</p>
                    <p className="max-w-60 truncate text-xs text-muted-foreground">
                      {item.address}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{item.submittedByName ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Badge variant="secondary">{item.statusLabel}</Badge>
                      <Button size="sm" variant="outline" onClick={() => setSelected(item)}>
                        Duyệt
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ReviewRestaurantDialog
        restaurant={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
