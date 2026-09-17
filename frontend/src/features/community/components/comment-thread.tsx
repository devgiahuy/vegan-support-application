'use client';

import * as React from 'react';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import type { CommunityComment } from '../types/community.model';
import { useCommentThreadQuery } from '../queries/community.queries';
import { CommentForm } from './comment-form';
import { CommentItem } from './comment-item';

/**
 * Thread bình luận 1 post: form gốc + list + reply inline 1 tầng.
 * Chỉ nhận `postId` (định danh thật khi nối live; fixture dùng postId bất kỳ).
 */
export function CommentThread({
  postId,
  itemType = 'nội dung',
}: {
  postId: string;
  itemType?: string;
}) {
  const [replyingTo, setReplyingTo] = React.useState<CommunityComment | null>(null);
  const { data, isLoading, isError, refetch } = useCommentThreadQuery(postId, {
    page: 1,
    limit: 20,
    order: 'newest',
  });
  const comments = data?.items ?? [];
  const total = data?.metadata.totalItems ?? 0;

  return (
    <Card>
      <CardHeader className="border-b bg-muted/30 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="size-4" />
          </span>
          <CardTitle className="text-lg font-bold">Bình luận &amp; Thảo luận ({total})</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-5 sm:p-6">
        <CommentForm postId={postId} submitLabel="Gửi bình luận" />

        {replyingTo && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
            <p className="mb-2 text-xs text-muted-foreground">
              Đang trả lời <span className="font-medium">{replyingTo.author?.displayName}</span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="ml-2 underline hover:text-primary"
              >
                Hủy
              </button>
            </p>
            <CommentForm
              postId={postId}
              parentId={replyingTo.id}
              submitLabel="Gửi phản hồi"
              onDone={() => setReplyingTo(null)}
            />
          </div>
        )}

        {isLoading && <LoadingState message="Đang tải bình luận..." />}
        {isError && <ErrorState title="Không tải được bình luận." onRetry={() => void refetch()} />}
        {!isLoading && !isError && comments.length === 0 && (
          <EmptyState
            title="Chưa có bình luận nào"
            description={`Hãy là người đầu tiên chia sẻ ý kiến về ${itemType} này.`}
          />
        )}
        {!isLoading && !isError && comments.length > 0 && (
          <div className="space-y-4 divide-y divide-border/60 border-t pt-2">
            {comments.map((comment) => (
              <div key={comment.id} className="pt-4 first:pt-0">
                <CommentItem comment={comment} postId={postId} onReply={setReplyingTo} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
