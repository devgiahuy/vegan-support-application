'use client';

import { BookmarkButton } from '@/features/community/components/bookmark-button';
import { useBookmarksQuery } from '@/features/community/queries/community.queries';
import { cn } from '@/lib/utils';

export function RecipeCardBookmark({ postId }: { postId: string }) {
  const { data, isLoading } = useBookmarksQuery({ page: 1, limit: 100, type: 'RECIPE' });
  const bookmarked = data?.items.some((item) => item.postId === postId) ?? false;

  return (
    <BookmarkButton
      postId={postId}
      bookmarked={bookmarked}
      disabled={isLoading}
      iconOnly
      className={cn(
        'rounded-full border-0 p-2 shadow-sm backdrop-blur transition-all duration-200',
        bookmarked
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-background/90 text-primary hover:bg-primary hover:text-primary-foreground'
      )}
    />
  );
}
