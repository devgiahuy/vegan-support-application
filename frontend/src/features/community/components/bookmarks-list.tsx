'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import type { BookmarkedItem } from '../types/community.model';
import { useBookmarksQuery } from '../queries/community.queries';

const FILTERS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'RECIPE', label: 'Công thức' },
  { value: 'VIDEO', label: 'Video' },
] as const;

function BookmarkedContentCard({ item }: { item: BookmarkedItem }) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const href =
    item.type === 'VIDEO'
      ? `/videos/${item.slug || item.postId}`
      : `/recipes/${item.slug || item.postId}`;
  const typeLabel = item.type === 'VIDEO' ? 'Video' : 'Công thức';

  return (
    <li>
      <Link
        href={href}
        className="group grid grid-cols-[112px_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-border/70 bg-background p-2.5 transition-colors hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[144px_minmax(0,1fr)]"
      >
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted">
          {item.coverImageUrl && !imageFailed ? (
            <Image
              src={item.coverImageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 112px, 144px"
              unoptimized
              onError={() => setImageFailed(true)}
              className="object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon aria-hidden="true" className="size-5" />
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1.5 py-0.5">
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge variant="success" className="px-2 py-0 text-[10px]">
              Đã xuất bản
            </Badge>
            <Badge variant="outline" className="px-2 py-0 text-[10px]">
              {typeLabel}
            </Badge>
          </span>
          <span className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:text-base">
            {item.title}
          </span>
          {item.excerpt && (
            <span className="line-clamp-1 text-xs text-muted-foreground">{item.excerpt}</span>
          )}
        </div>
      </Link>
    </li>
  );
}

/** Danh sách nội dung đã lưu của current user, lọc theo loại. */
export function BookmarksList() {
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]['value']>('ALL');
  const { data, isLoading, isError, refetch } = useBookmarksQuery();
  const items = (data?.items ?? []).filter((item) => filter === 'ALL' || item.type === filter);

  return (
    <div className="flex flex-col gap-3">
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
        <ul className="flex flex-col gap-2.5">
          {items.map((item) => (
            <BookmarkedContentCard key={item.postId} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
