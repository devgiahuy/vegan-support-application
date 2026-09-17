'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorCode } from '@/lib/api-error';
import { useCreateCommentMutation, useUpdateCommentMutation } from '../queries/community.queries';
import {
  commentSchema,
  MAX_COMMENT_LENGTH,
  type CommentFormValues,
} from '../schemas/comment.schema';

/**
 * Form bình luận mới / reply / sửa. Giữ draft khi lỗi (chỉ xóa khi thành công).
 * Reply tầng 2 bị chặn: `parentId` phải là bình luận gốc (caller đảm bảo).
 */
export function CommentForm({
  postId,
  parentId,
  commentId,
  initialContent = '',
  submitLabel = 'Gửi bình luận',
  onDone,
}: {
  postId: string;
  parentId?: string;
  commentId?: string;
  initialContent?: string;
  submitLabel?: string;
  onDone?: () => void;
}) {
  const [rateLimited, setRateLimited] = React.useState(false);
  const createMutation = useCreateCommentMutation();
  const updateMutation = useUpdateCommentMutation();
  const pending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: initialContent, parentId: parentId ?? '' },
  });

  const onSubmit = async (values: CommentFormValues) => {
    setRateLimited(false);
    try {
      if (commentId) {
        await updateMutation.mutateAsync({ postId, commentId, content: values.content });
      } else {
        await createMutation.mutateAsync({
          postId,
          content: values.content,
          parentId: values.parentId || undefined,
        });
      }
      form.reset({ content: '', parentId: parentId ?? '' });
      onDone?.();
    } catch (error) {
      // Lỗi rate-limit: giữ nguyên draft để user thử lại.
      if (getApiErrorCode(error) === 'COMMUNITY_RATE_LIMITED') setRateLimited(true);
    }
  };

  return (
    <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-2" noValidate>
      <Label htmlFor={`comment-${commentId ?? parentId ?? 'new'}`} className="sr-only">
        Nội dung bình luận
      </Label>
      <Textarea
        id={`comment-${commentId ?? parentId ?? 'new'}`}
        rows={3}
        maxLength={MAX_COMMENT_LENGTH}
        placeholder="Viết bình luận..."
        className="resize-none text-sm"
        {...form.register('content')}
      />
      {form.formState.errors.content && (
        <p className="text-xs text-destructive">{form.formState.errors.content.message}</p>
      )}
      {rateLimited && (
        <p className="text-xs text-destructive">
          Bạn thao tác quá nhanh. Nội dung đã giữ lại — vui lòng chờ giây lát rồi gửi lại.
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending} className="gap-1.5">
          <Send data-icon="inline-start" />
          {pending ? 'Đang gửi...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
