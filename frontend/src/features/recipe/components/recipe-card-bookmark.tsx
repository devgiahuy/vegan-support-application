'use client';

import { BookmarkButton } from '@/features/community/components/bookmark-button';
import { useBookmarksQuery } from '@/features/community/queries/community.queries';

export function RecipeCardBookmark({ postId }: { postId: string }) {
  const { data, isLoading } = useBookmarksQuery({ page: 1, limit: 100, type: 'RECIPE' });
  const bookmarked = data?.items.some((item) => item.postId === postId) ?? false;

  return (
    <BookmarkButton
      postId={postId}
      bookmarked={bookmarked}
      disabled={isLoading}
      iconOnly
      className="rounded-full border-0 bg-background/90 p-2 text-foreground shadow-sm hover:bg-background"
    />
  );
}
