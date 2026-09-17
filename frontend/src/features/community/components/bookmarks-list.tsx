'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { useBookmarksQuery } from '../queries/community.queries';

const FILTERS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'RECIPE', label: 'Công thức' },
  { value: 'VIDEO', label: 'Video' },
] as const;

/** Danh sách nội dung đã lưu của current user, lọc theo loại. */
export function BookmarksList() {
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]['value']>('ALL');
  const { data, isLoading, isError, refetch } = useBookmarksQuery();
  const items = (data?.items ?? []).filter((item) => filter === 'ALL' || item.type === filter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo loại">
        {FILTERS.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {isLoading && <LoadingState message="Đang tải danh sách đã lưu..." />}
      {isError && (
        <ErrorState title="Không tải được danh sách đã lưu." onRetry={() => void refetch()} />
      )}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title="Chưa lưu nội dung nào"
          description={
            filter === 'ALL'
              ? 'Bấm nút Lưu ở món ăn hoặc video yêu thích để xem lại tại đây.'
              : 'Không có nội dung loại này trong danh sách đã lưu.'
          }
        />
      )}
      {!isLoading && !isError && items.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.postId} className="rounded-xl border p-3">
              <Link
                href={
                  item.type === 'VIDEO'
                    ? `/videos/${item.slug || item.postId}`
                    : `/recipes/${item.slug || item.postId}`
                }
                className="font-medium hover:text-primary hover:underline"
              >
                {item.title}
              </Link>
              {item.excerpt && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.excerpt}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
