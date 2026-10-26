'use client';

import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useBookmarkMutation, useCommunitySummaryQuery } from '../queries/community.queries';

/**
 * Nút lưu/gỡ lưu (recipe/video only — caller đảm bảo đúng loại).
 * Trạng thái từ summary query, toggle idempotent.
 */
interface BookmarkButtonProps {
  postId: string;
  saveLabel?: string;
  savedLabel?: string;
  bookmarked?: boolean;
  disabled?: boolean;
  iconOnly?: boolean;
  className?: string;
}

export function BookmarkButton({
  postId,
  saveLabel = 'Lưu',
  savedLabel = 'Đã lưu',
  bookmarked: bookmarkedOverride,
  disabled = false,
  iconOnly = false,
  className,
}: BookmarkButtonProps) {
  const { data: summary } = useCommunitySummaryQuery(postId, {
    enabled: bookmarkedOverride === undefined,
  });
  const bookmarkMutation = useBookmarkMutation();

  const bookmarked = bookmarkedOverride ?? summary?.viewerBookmarked ?? false;

  return (
    <Button
      variant={bookmarked ? 'default' : 'outline'}
      size={iconOnly ? 'icon' : 'sm'}
      disabled={disabled || bookmarkMutation.isPending}
      onClick={() => bookmarkMutation.mutate({ postId, bookmarked: !bookmarked })}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? 'Gỡ lưu' : saveLabel}
      className={cn('gap-1.5', className)}
    >
      <Bookmark className={cn(bookmarked && 'fill-current')} />
      {!iconOnly && <span>{bookmarked ? savedLabel : saveLabel}</span>}
    </Button>
  );
}
