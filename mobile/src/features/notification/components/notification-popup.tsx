import * as React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Bell, CheckCheck } from 'lucide-react-native';

import { FormSheet } from '@/components/shared/form-sheet';
import { LoadMoreButton } from '@/components/shared/load-more-button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import {
  useInfiniteNotificationsQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
} from '../queries/notification.queries';
import type { AppNotification } from '../types/notification.model';
import { NotificationItem } from './notification-item';

type Filter = 'all' | 'unread';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' },
];

/**
 * Hộp thông báo dạng popup mở từ chuông ở header (tương đương panel chuông của web): danh sách mới nhất trước, lọc
 * chưa đọc, "Đọc tất cả", bấm một mục vừa đánh dấu đã đọc vừa mở nội dung liên quan. Chỉ mount khi mở nên danh sách
 * chỉ được tải lúc người dùng xem.
 */
export function NotificationPopup({ onClose }: { onClose: () => void }) {
  const colors = useIconColors();
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>('all');

  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteNotificationsQuery({ limit: 20, unreadOnly: filter === 'unread' });
  const markRead = useMarkReadMutation();
  const markAll = useMarkAllReadMutation();

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const unreadCount = items.filter((item) => !item.read).length;

  const openItem = (item: AppNotification) => {
    if (!item.read) markRead.mutate(item.id);
    if (item.link) {
      onClose();
      router.push(item.link as Href);
    }
  };

  const markAllRead = () => {
    markAll.mutate(undefined, {
      onError: (error) => Alert.alert('Không thể đánh dấu tất cả', getApiErrorMessage(error, 'Vui lòng thử lại.')),
    });
  };

  return (
    <FormSheet title="Thông báo" onClose={onClose} variant="popup">
      <View className="flex-row items-center gap-2">
        {FILTERS.map((option) => {
          const selected = filter === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setFilter(option.value)}
              className={cn('rounded-full px-3.5 py-2', selected ? 'bg-primary' : 'bg-muted')}>
              <Text
                className={cn(
                  'text-xs font-medium',
                  selected ? 'font-semibold text-primary-foreground' : 'text-muted-foreground'
                )}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          disabled={unreadCount === 0 || markAll.isPending}
          onPress={markAllRead}
          className={cn(
            'ml-auto flex-row items-center gap-1.5 rounded-full border border-input px-3 py-2',
            unreadCount === 0 || markAll.isPending ? 'opacity-50' : ''
          )}>
          <CheckCheck size={14} color={colors.foreground} />
          <Text className="text-xs font-semibold text-foreground">Đọc tất cả</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingState message="Đang tải thông báo..." />
      ) : isError ? (
        <ErrorState title="Không tải được thông báo." onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title={filter === 'unread' ? 'Không còn thông báo chưa đọc' : 'Chưa có thông báo nào'}
          description="Tin mới về bài viết, bình luận và đơn của bạn sẽ hiện ở đây."
          icon={<Bell size={24} color={colors.mutedForeground} />}
        />
      ) : (
        <View className="gap-2.5">
          {items.map((item) => (
            <NotificationItem key={item.id} item={item} onOpen={openItem} />
          ))}
          <LoadMoreButton
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onPress={() => void fetchNextPage()}
          />
        </View>
      )}
    </FormSheet>
  );
}
