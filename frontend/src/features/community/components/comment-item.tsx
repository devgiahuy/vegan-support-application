'use client';

import * as React from 'react';
import { CornerDownRight, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/useAuthStore';
import type { CommunityComment } from '../types/community.model';
import { useDeleteCommentMutation } from '../queries/community.queries';
import { CommentForm } from './comment-form';
import { ReportButton } from '@/components/shared/report-button';
import { ReportTargetKind } from '@/common/enums';

function formatDateTime(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * 1 bình luận (gốc hoặc reply). Sửa/xóa chỉ của chủ sở hữu.
 * Reply mới do `CommentThread` quản lý qua `onReply`.
 */
export function CommentItem({
  comment,
  postId,
  depth = 0,
  onReply,
}: {
  comment: CommunityComment;
  postId: string;
  depth?: number;
  onReply: (parent: CommunityComment) => void;
}) {
  const { user } = useAuthStore();
  const [editing, setEditing] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const deleteMutation = useDeleteCommentMutation();
  const isOwner = Boolean(
    user && comment.author && (comment.author.id === user.id || comment.author.id === 'me')
  );
  const initials = (comment.author?.displayName ?? '?').slice(0, 1).toUpperCase();

  if (comment.isPlaceholder || !comment.content) {
    return (
      <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        Bình luận này không còn hiển thị.
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <Avatar className="size-9 shrink-0">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">
            {comment.author?.displayName ?? 'Người dùng ẩn danh'}
          </span>
          {comment.editedAt && (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              Đã sửa
            </Badge>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground">
            {formatDateTime(comment.createdAt)}
          </span>
        </div>

        {editing ? (
          <CommentForm
            postId={postId}
            commentId={comment.id}
            initialContent={comment.content}
            submitLabel="Lưu"
            onDone={() => setEditing(false)}
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
        )}

        <div className="flex items-center gap-1 pt-0.5">
          {!isOwner && (
            <ReportButton
              targetKind={ReportTargetKind.COMMENT}
              targetId={comment.id}
              authorId={comment.author?.id}
            />
          )}
          {depth === 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(comment)}
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-primary"
            >
              <CornerDownRight className="size-3" /> Trả lời
            </Button>
          )}
          {isOwner && !editing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-primary"
              >
                <Pencil className="size-3" /> Sửa
              </Button>
              {confirmingDelete ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setConfirmingDelete(false);
                      deleteMutation.mutate({ postId, commentId: comment.id });
                    }}
                    disabled={deleteMutation.isPending}
                    className="h-7 px-2 text-xs text-destructive"
                  >
                    Xác nhận xóa
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmingDelete(false)}
                    className="h-7 px-2 text-xs"
                  >
                    Hủy
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingDelete(true)}
                  className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3" /> Xóa
                </Button>
              )}
            </>
          )}
        </div>

        {depth === 0 && comment.replies.length > 0 && (
          <div className="space-y-3 border-l-2 border-muted pt-1 pl-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                depth={1}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
