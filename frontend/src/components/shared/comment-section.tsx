'use client';

import { cn } from '@/lib/utils';
import { CommentThread } from '@/features/community/components/comment-thread';

/**
 * Section bình luận dùng chung cho các trang detail.
 * Bọc `CommentThread` (community queries + fixture ở phase scaffold).
 */
export function CommentSection({
  postId,
  itemType = 'nội dung',
  className,
}: {
  postId: string;
  itemType?: string;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <CommentThread postId={postId} itemType={itemType} />
    </div>
  );
}
