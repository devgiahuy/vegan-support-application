'use client';

import * as React from 'react';
import { Pencil, Trash2, History, Send, MoreVertical, ShieldAlert } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
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

function getTypeBadgeStyle(type: string): string {
  switch (type) {
    case 'RECIPE':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
    case 'BLOG':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400';
    case 'VIDEO':
      return 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400';
    default:
      return '';
  }
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
 *
 * Hỗ trợ giao diện kép responsive:
 * - Desktop/Tablet (md+): Bảng dữ liệu chuẩn với cột cố định chống tràn và dropdown hành động
 * - Mobile (< md): Danh sách thẻ card tối ưu màn hình cảm ứng
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
    <div className="space-y-4">
      {/* 1. GIAO DIỆN DESKTOP / TABLET (BẢNG DỮ LIỆU CHUẨN) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border/80 bg-card shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/80">
              <TableHead className="min-w-[220px] font-semibold text-foreground">Tiêu đề</TableHead>
              <TableHead className="min-w-[130px] font-semibold text-foreground">Tác giả</TableHead>
              <TableHead className="w-[100px] font-semibold text-foreground">Loại</TableHead>
              <TableHead className="min-w-[130px] font-semibold text-foreground">
                Trạng thái
              </TableHead>
              <TableHead className="min-w-[120px] font-semibold text-foreground">
                Chuyên mục
              </TableHead>
              <TableHead className="w-[125px] font-semibold text-foreground">Cập nhật</TableHead>
              <TableHead className="w-[100px] text-right font-semibold text-foreground">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const disabledReason = editDisabledReason(row, sessionUserId);
              return (
                <TableRow key={row.id} className="transition-colors hover:bg-muted/30">
                  <TableCell className="py-3.5">
                    <div className="space-y-0.5">
                      <p
                        className="font-medium leading-snug text-foreground line-clamp-1 hover:text-primary transition-colors cursor-default"
                        title={row.title}
                      >
                        {row.title}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-[260px]">
                        /{row.slug}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm font-medium text-foreground/90 py-3.5">
                    {row.authorName}
                  </TableCell>

                  <TableCell className="py-3.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-full text-xs font-medium px-2.5 py-0.5 whitespace-nowrap',
                        getTypeBadgeStyle(row.type)
                      )}
                    >
                      {row.typeLabel}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <div className="space-y-1">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'rounded-full text-xs font-medium whitespace-nowrap',
                          adminContentMapper.getStatusBadgeClass(row.status)
                        )}
                      >
                        {row.statusLabel}
                      </Badge>
                      {row.hasPendingRevision && (
                        <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          Bản nháp chờ duyệt
                        </p>
                      )}
                      {row.moderationSignalCount > 0 && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3 text-destructive" />
                          {row.moderationSignalCount} tín hiệu
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground py-3.5">
                    {row.categoryNames.length > 0 ? (
                      <span className="line-clamp-1">{row.categoryNames.join(', ')}</span>
                    ) : (
                      '—'
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-3.5">
                    {formatUpdatedAt(row)}
                  </TableCell>

                  <TableCell className="py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(row)}
                        disabled={busy || Boolean(disabledReason)}
                        title={disabledReason ?? OWNER_EDIT_HINT}
                        className="h-8 gap-1 px-2.5 text-xs font-medium"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Sửa
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            aria-label={`Thao tác cho ${row.title}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {onSubmit &&
                            (row.status === 'DRAFT' || row.status === 'REJECTED') &&
                            !row.hasPendingRevision && (
                              <DropdownMenuItem
                                onClick={() => onSubmit(row)}
                                disabled={busy || videoNotReady(row)}
                                className="gap-2 cursor-pointer font-medium text-primary"
                              >
                                <Send className="h-3.5 w-3.5" />
                                Gửi duyệt
                              </DropdownMenuItem>
                            )}
                          {onShowHistory && (
                            <DropdownMenuItem
                              onClick={() => onShowHistory(row)}
                              className="gap-2 cursor-pointer"
                            >
                              <History className="h-3.5 w-3.5" />
                              Lịch sử thay đổi
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(row)}
                              disabled={busy || Boolean(disabledReason)}
                              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Xoá nội dung
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 2. GIAO DIỆN MOBILE (< md: CARDS TIỆN ÍCH CẢM ỨNG) */}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => {
          const disabledReason = editDisabledReason(row, sessionUserId);
          return (
            <div
              key={row.id}
              className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs space-y-3"
            >
              {/* Header card: Loại + Trạng thái + Dropdown menu */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-full text-xs font-medium px-2 py-0.5',
                      getTypeBadgeStyle(row.type)
                    )}
                  >
                    {row.typeLabel}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'rounded-full text-xs font-medium',
                      adminContentMapper.getStatusBadgeClass(row.status)
                    )}
                  >
                    {row.statusLabel}
                  </Badge>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      aria-label={`Thao tác cho ${row.title}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {onShowHistory && (
                      <DropdownMenuItem
                        onClick={() => onShowHistory(row)}
                        className="gap-2 cursor-pointer"
                      >
                        <History className="h-3.5 w-3.5" />
                        Lịch sử thay đổi
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(row)}
                        disabled={busy || Boolean(disabledReason)}
                        className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Xoá nội dung
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Title & Slug */}
              <div>
                <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
                  {row.title}
                </h3>
                <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                  /{row.slug}
                </p>
              </div>

              {/* Metadata: Tác giả, chuyên mục, ngày cập nhật */}
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                <div>
                  <span className="text-muted-foreground/70">Tác giả: </span>
                  <span className="font-medium text-foreground">{row.authorName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground/70">Chuyên mục: </span>
                  <span className="font-medium text-foreground">
                    {row.categoryNames.length > 0 ? row.categoryNames.join(', ') : '—'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground/70">Cập nhật: </span>
                  <span>{formatUpdatedAt(row)}</span>
                </div>
              </div>

              {row.hasPendingRevision && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ Có bản nháp chờ duyệt
                </p>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-8"
                  onClick={() => onEdit(row)}
                  disabled={busy || Boolean(disabledReason)}
                  title={disabledReason ?? OWNER_EDIT_HINT}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Sửa nội dung
                </Button>

                {onSubmit &&
                  (row.status === 'DRAFT' || row.status === 'REJECTED') &&
                  !row.hasPendingRevision && (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={() => onSubmit(row)}
                      disabled={busy || videoNotReady(row)}
                      title={videoNotReady(row) ? VIDEO_NOT_READY_HINT : undefined}
                    >
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Gửi duyệt
                    </Button>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
