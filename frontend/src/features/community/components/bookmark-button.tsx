'use client';

import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useBookmarkMutation, useCommunitySummaryQuery } from '../queries/community.queries';

/**
 * Nút lưu/gỡ lưu (recipe/video only — caller đảm bảo đúng loại).
 * Trạng thái từ summary query, toggle idempotent.
 */
export function BookmarkButton({ postId }: { postId: string }) {
  const { data: summary } = useCommunitySummaryQuery(postId);
  const bookmarkMutation = useBookmarkMutation();

  const bookmarked = summary?.viewerBookmarked ?? false;

  return (
    <Button
      variant={bookmarked ? 'default' : 'outline'}
      size="sm"
      disabled={bookmarkMutation.isPending}
      onClick={() => bookmarkMutation.mutate({ postId, bookmarked: !bookmarked })}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? 'Gỡ lưu' : 'Lưu để xem sau'}
      className="gap-1.5"
    >
      <Bookmark data-icon="inline-start" className={cn(bookmarked && 'fill-current')} />
      {bookmarked ? 'Đã lưu' : 'Lưu'}
    </Button>
  );
}
