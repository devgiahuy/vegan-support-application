'use client';

import * as React from 'react';
import { Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminContentMapper } from '../mappers/admin-content.mapper';
import type { AdminContentRow } from '../types/admin-content.model';

export const OWNER_EDIT_HINT = 'Bạn có thể chỉnh sửa nội dung do chính mình đăng.';
export const OTHER_AUTHOR_EDIT_HINT =
  'Nội dung do thành viên khác đăng. Quản trị viên chỉ có thể duyệt trong hàng đợi kiểm duyệt.';
export const PENDING_EDIT_HINT = 'Nội dung đang có bản nháp chờ duyệt nên chưa thể chỉnh sửa.';
export const DELETED_EDIT_HINT = 'Nội dung đã bị xoá nên không thể chỉnh sửa.';

/** Video chưa có nguồn tệp đi kèm nên chưa thể gửi duyệt (FR-041). */
export function videoNotReady(row: AdminContentRow): boolean {
  return row.type === 'VIDEO' && !row.videoSource;
}

export const VIDEO_NOT_READY_HINT = 'Video chưa có tệp đi kèm hợp lệ nên chưa thể gửi duyệt.';
/** Nhãn tiếng Việt giải thích vì sao nút Sửa không khả dụng (FR-051). */
export function editDisabledReason(row: AdminContentRow, sessionUserId: string): string | null {
  if (row.status === 'DELETED') return DELETED_EDIT_HINT;
  if (row.status === 'HIDDEN' || row.status === 'FLAGGED' || row.status === 'QUARANTINED') {
    return PENDING_EDIT_HINT;
  }
  if (row.hasPendingRevision) return PENDING_EDIT_HINT;
  if (!sessionUserId || row.authorId !== sessionUserId) return OTHER_AUTHOR_EDIT_HINT;
  return null;
}

function formatUpdatedAt(row: AdminContentRow): string {
  if (!row.updatedAt) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(row.updatedAt);
}

interface AdminContentTableProps {
  rows: AdminContentRow[];
  sessionUserId: string;
  onEdit: (row: AdminContentRow) => void;
  /** Các hành động bổ sung do từng user story gắn thêm (ẩn/xoá/gửi duyệt/lịch sử). */
  onDelete?: (row: AdminContentRow) => void;
  onSubmit?: (row: AdminContentRow) => void;
  onShowHistory?: (row: AdminContentRow) => void;
  /** Vô hiệu hoá toàn bộ thao tác khi đang tải hoặc mutation chạy. */
  busy?: boolean;
}

/**
 * Bảng nội dung của khu vực Quản lý nội dung.
 *
 * Mỗi dòng có **nhóm thao tác riêng**. Cố ý KHÔNG có ô chọn nhiều và không có
 * thanh thao tác hàng loạt (FR-053, quyết định Q3). Nút không khả dụng vẫn hiển
 * thị kèm lý do tiếng Việt — không được ẩn đi im lặng.
 */
export function AdminContentTable({
  rows,
  sessionUserId,
  onEdit,
  onDelete,
  onSubmit,
  onShowHistory,
  busy = false,
}: AdminContentTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[240px]">Tiêu đề</TableHead>
            <TableHead>Tác giả</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="min-w-[140px]">Chuyên mục</TableHead>
            <TableHead>Cập nhật</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const disabledReason = editDisabledReason(row, sessionUserId);
            return (
              <TableRow key={row.id}>
                <TableCell>
                  <p className="font-medium leading-snug">{row.title}</p>
                  <p className="text-xs text-muted-foreground">/{row.slug}</p>
                </TableCell>
                <TableCell className="text-sm">{row.authorName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-full text-xs">
                    {row.typeLabel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`rounded-full text-xs ${adminContentMapper.getStatusBadgeClass(row.status)}`}
                  >
                    {row.statusLabel}
                  </Badge>
                  {row.hasPendingRevision && (
                    <p className="mt-1 text-xs text-muted-foreground">Có bản nháp chờ duyệt</p>
                  )}
                  {row.moderationSignalCount > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.moderationSignalCount} tín hiệu kiểm duyệt (tham chiếu)
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {row.categoryNames.length > 0 ? row.categoryNames.join(', ') : '—'}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">{formatUpdatedAt(row)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {onShowHistory && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onShowHistory(row)}
                      >
                        Lịch sử
                      </Button>
                    )}
                    {onSubmit &&
                      (row.status === 'DRAFT' || row.status === 'REJECTED') &&
                      !row.hasPendingRevision && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onSubmit(row)}
                          disabled={busy || videoNotReady(row)}
                          title={videoNotReady(row) ? VIDEO_NOT_READY_HINT : undefined}
                        >
                          Gửi duyệt
                        </Button>
                      )}
                    {onDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(row)}
                        disabled={busy || Boolean(disabledReason)}
                        title={disabledReason ?? undefined}
                      >
                        Xoá
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(row)}
                      disabled={busy || Boolean(disabledReason)}
                      title={disabledReason ?? OWNER_EDIT_HINT}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      Sửa
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
