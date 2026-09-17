'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import type { AppNotification } from '../types/notification.model';
import {
  useMarkAllReadMutation,
  useMarkReadMutation,
  useNotificationsQuery,
} from '../queries/notification.queries';
import { NotificationItem } from './notification-item';

/**
 * Panel danh sách trong dropdown chuông: bấm mục vừa điều hướng vừa đánh dấu.
 * Nút tất cả ở header panel (US2 nối đầy đủ; hiển thị từ US1).
 */
export function NotificationPanel({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useNotificationsQuery();
  const markAllMutation = useMarkAllReadMutation();
  const markReadMutation = useMarkReadMutation();
  const items = data?.items ?? [];
  const unread = items.filter((item) => !item.read).length;

  const handleOpen = (item: AppNotification) => {
    // Bấm mục vừa điều hướng vừa đánh dấu (không await — panel đóng ngay).
    if (!item.read) markReadMutation.mutate(item.id);
    onNavigate?.();
    if (item.link) router.push(item.link);
  };

  return (
    <div className="flex max-h-[60vh] flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Thông báo</p>
        <Button
          variant="ghost"
          size="sm"
          disabled={unread === 0 || markAllMutation.isPending}
          onClick={() => markAllMutation.mutate()}
        >
          Đánh dấu tất cả
        </Button>
      </div>

      <div className="flex flex-col gap-1 overflow-y-auto pr-1">
        {isLoading && <LoadingState message="Đang tải thông báo..." />}
        {isError && <ErrorState title="Không tải được thông báo." onRetry={() => void refetch()} />}
        {!isLoading && !isError && items.length === 0 && (
          <EmptyState
            title="Chưa có thông báo nào"
            description="Tin mới về bài viết, bình luận và đơn của bạn sẽ hiện ở đây."
          />
        )}
        {!isLoading &&
          !isError &&
          items.map((item) => <NotificationItem key={item.id} item={item} onOpen={handleOpen} />)}
      </div>
    </div>
  );
}
