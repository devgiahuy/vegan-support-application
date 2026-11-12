'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Plus,
  MessageSquare,
  MessagesSquare,
  Sparkles,
  LogIn,
  Compass,
  Trash2,
  Loader2,
} from 'lucide-react';
import { AlertDialog } from 'radix-ui';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useChatSessionsQuery,
  useCreateChatSessionMutation,
  useDeleteChatSessionMutation,
} from '../queries/chat.queries';
import type { ChatSession } from '../types/chat.model';

/**
 * Danh sách phiên trò chuyện trong Sidebar:
 * - Khi đã đăng nhập: Hiển thị nút "Đoạn chat mới" + danh sách các phiên có highlight phiên đang chọn.
 * - Khi là Khách (Guest): Hiển thị thẻ mời đăng nhập để lưu trữ lịch sử + gợi ý chủ đề tư vấn.
 */
export function SessionList({
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  isStreaming = false,
}: {
  activeId: string;
  onSelect: (sessionId: string) => void;
  onNewChat?: () => void;
  onDelete: (sessionId: string) => void;
  isStreaming?: boolean;
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionsQuery = useChatSessionsQuery();
  const createSession = useCreateChatSessionMutation();
  const deleteSession = useDeleteChatSessionMutation();
  const [pendingDelete, setPendingDelete] = React.useState<ChatSession | null>(null);

  const handleDelete = async () => {
    if (!pendingDelete || deleteSession.isPending) return;
    try {
      const deleted = await deleteSession.mutateAsync(pendingDelete.id);
      setPendingDelete(null);
      onDelete(deleted.id);
    } catch {
      // Mutation displays the documented business error and keeps confirmation open.
    }
  };

  const handleNew = () => {
    if (onNewChat) {
      onNewChat();
      return;
    }
    createSession.mutate(undefined, {
      onSuccess: (session) => onSelect(session.id),
    });
  };

  // Trạng thái KHÁCH (Guest): Thay vì để trống, hiển thị hướng dẫn hữu ích
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-4">
        {/* Nút tạo chat mới tạm thời */}
        <Button
          onClick={handleNew}
          disabled={createSession.isPending}
          className="w-full justify-start gap-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
          variant="outline"
          size="sm"
        >
          <Plus className="size-4" />
          <span className="font-semibold">Đoạn chat mới</span>
        </Button>

        {/* Thẻ mời đăng nhập */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-4 text-left">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="size-4" />
          </div>
          <h4 className="mt-2.5 text-xs font-semibold text-foreground">Lưu giữ lịch sử tư vấn</h4>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Đăng nhập để xem lại các cuộc trò chuyện trước đây và đồng bộ mục tiêu dinh dưỡng cá
            nhân.
          </p>
          <Button asChild size="sm" className="mt-3 w-full rounded-xl text-xs gap-1.5 shadow-xs">
            <Link href="/login">
              <LogIn className="size-3.5" />
              Đăng nhập ngay
            </Link>
          </Button>
        </div>

        {/* Gợi ý chủ đề thường gặp */}
        <div className="space-y-2">
          <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Compass className="size-3" />
            Chủ đề phổ biến
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Thực đơn tuần',
              'Bổ sung Đạm',
              'Thiếu máu B12',
              'Món thanh nhiệt',
              'Ăn chay giảm cân',
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-border/80 bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Trạng thái ĐÃ ĐĂNG NHẬP (Member)
  const sessions = sessionsQuery.data?.items ?? [];

  return (
    <div className="flex flex-col gap-2">
      {/* Nút tạo chat mới */}
      <Button
        onClick={handleNew}
        disabled={createSession.isPending}
        className="w-full justify-start gap-2 rounded-xl bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
        size="sm"
      >
        <Plus className="size-4" />
        <span className="font-semibold">Đoạn chat mới</span>
      </Button>

      {/* Loading Skeletons */}
      {sessionsQuery.isLoading && (
        <div className="flex flex-col gap-1.5 pt-2">
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      )}

      {/* Lỗi tải */}
      {sessionsQuery.isError && (
        <p className="px-1 py-2 text-xs text-muted-foreground">Không tải được danh sách phiên.</p>
      )}

      {/* Danh sách rỗng */}
      {!sessionsQuery.isLoading && !sessionsQuery.isError && sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <MessagesSquare className="size-6 text-muted-foreground/40" />
          <p className="mt-2 text-xs text-muted-foreground">Chưa có đoạn chat nào.</p>
        </div>
      )}

      {/* Danh sách các phiên */}
      <div className="flex flex-col gap-1 pt-1">
        {sessions.map((session) => {
          const isActive = session.id === activeId;
          return (
            <div key={session.id} className="group flex items-center gap-1 rounded-xl">
              <button
                type="button"
                onClick={() => onSelect(session.id)}
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-all duration-150',
                  isActive
                    ? 'bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
                title={session.title}
              >
                <MessageSquare
                  className={cn(
                    'size-3.5 shrink-0 transition-colors',
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground/70 group-hover:text-foreground'
                  )}
                />
                <span className="truncate flex-1">{session.title}</span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive focus-visible:text-destructive"
                aria-label={`Xóa cuộc trò chuyện ${session.title}`}
                title={
                  isStreaming && isActive
                    ? 'Chờ câu trả lời hoàn tất để xóa'
                    : `Xóa ${session.title}`
                }
                disabled={(isStreaming && isActive) || deleteSession.isPending}
                onClick={() => setPendingDelete(session)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          );
        })}
      </div>
      <AlertDialog.Root
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteSession.isPending) setPendingDelete(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-black/50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[61] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background p-6 shadow-lg outline-none">
            <AlertDialog.Title className="text-lg font-semibold">
              Xóa cuộc trò chuyện?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
              “{pendingDelete?.title}” sẽ biến mất khỏi lịch sử và không thể mở lại. Nội dung vẫn
              được lưu trên máy chủ theo chính sách lưu trữ.
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline" disabled={deleteSession.isPending}>
                  Hủy
                </Button>
              </AlertDialog.Cancel>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteSession.isPending}
                onClick={() => void handleDelete()}
              >
                {deleteSession.isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                Xóa khỏi lịch sử
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
