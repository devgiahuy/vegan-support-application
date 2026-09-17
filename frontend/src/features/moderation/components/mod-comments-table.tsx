'use client';

import * as React from 'react';
import { MessagesSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ModeratedComment } from '../types/moderation.model';
import { useModeratedCommentsQuery } from '../queries/moderation.queries';
import { CommentStatusDialog } from './comment-status-dialog';

/** Bảng kiểm duyệt bình luận: ẩn/khôi phục, báo rõ mục tác giả đã xóa. */
export function ModCommentsTable() {
  const [status, setStatus] = React.useState<string>('');
  const [selected, setSelected] = React.useState<ModeratedComment | null>(null);
  const { data, isLoading, isError, refetch } = useModeratedCommentsQuery(
    status ? { status, limit: 20 } : { limit: 20 }
  );
  const comments = data?.items ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc trạng thái">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <MessagesSquare className="size-4" /> Bình luận cần kiểm duyệt
        </span>
        {[
          { value: '', label: 'Tất cả' },
          { value: 'VISIBLE', label: 'Hiển thị' },
          { value: 'HIDDEN', label: 'Đã ẩn' },
        ].map((option) => (
          <Button
            key={option.value}
            variant={status === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatus(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {isLoading && <LoadingState message="Đang tải bình luận..." />}
      {isError && <ErrorState title="Không tải được danh sách." onRetry={() => void refetch()} />}
      {!isLoading && !isError && comments.length === 0 && (
        <EmptyState title="Không có bình luận nào" description="Thử đổi bộ lọc." />
      )}
      {!isLoading && !isError && comments.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nội dung</TableHead>
                <TableHead>Bài chứa</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.map((comment) => {
                const deleted = comment.deletedAt !== null;
                return (
                  <TableRow key={comment.id}>
                    <TableCell className="max-w-70">
                      <p className="truncate text-sm">
                        {comment.content ?? '(nội dung không còn hiển thị)'}
                      </p>
                      <p className="text-xs text-muted-foreground">{comment.authorName}</p>
                    </TableCell>
                    <TableCell className="max-w-45">
                      <p className="truncate text-sm">{comment.postTitle || comment.postId}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={comment.status === 'HIDDEN' ? 'destructive' : 'secondary'}>
                        {comment.statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deleted}
                        title={deleted ? 'Tác giả đã xóa, không thể thao tác' : 'Ẩn hoặc khôi phục'}
                        onClick={() => setSelected(comment)}
                      >
                        Xử lý
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CommentStatusDialog
        comment={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
