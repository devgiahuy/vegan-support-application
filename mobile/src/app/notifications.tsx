import * as React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Link, type Href, useRouter } from 'expo-router';
import { Bell, CheckCheck } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { LoadMoreButton } from '@/components/shared/load-more-button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { NotificationItem } from '@/features/notification/components/notification-item';
import {
  useMarkAllReadMutation,
  useMarkReadMutation,
  useInfiniteNotificationsQuery,
} from '@/features/notification/queries/notification.queries';
import type { AppNotification } from '@/features/notification/types/notification.model';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

type Filter = 'all' | 'unread';

/**
 * Thông báo — đồng bộ panel chuông của web (`notification-panel.tsx`) nhưng là màn riêng cho mobile:
 * danh sách mới nhất trước, bấm mục vừa đánh dấu đã đọc vừa mở nội dung liên quan, nút "Đánh dấu tất cả".
 * Backend không có push/email/realtime, chỉ có polling số chưa đọc ở chuông.
 */
export default function NotificationsScreen() {
  const colors = useIconColors();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [filter, setFilter] = React.useState<Filter>('all');

  const { data, isLoading, isError, refetch, isRefetching, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteNotificationsQuery({
      limit: 20,
      unreadOnly: filter === 'unread',
    });
  const markRead = useMarkReadMutation();
  const markAll = useMarkAllReadMutation();

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const unreadCount = items.filter((item) => !item.read).length;

  const openItem = (item: AppNotification) => {
    if (!item.read) markRead.mutate(item.id);
    if (item.link) router.push(item.link as Href);
  };

  const markAllRead = () => {
    markAll.mutate(undefined, {
      onError: (error) => Alert.alert('Không thể đánh dấu tất cả', getApiErrorMessage(error, 'Vui lòng thử lại.')),
    });
  };

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-3xl border border-border bg-card p-6">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Bell size={28} color={colors.primary} />
            </View>
            <Text className="mt-4 text-center text-xl font-bold text-foreground">Đăng nhập để xem thông báo</Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              Tin mới về bài viết, bình luận và đơn của bạn sẽ hiện ở đây.
            </Text>
            <View className="mt-5 w-full">
              <Link href={'/(auth)/login' as Href} asChild>
                <PrimaryButton label="Đăng nhập ngay" />
              </Link>
            </View>
          </View>
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-4 px-5 pt-4">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-2xl font-bold tracking-tight text-foreground">Thông báo</Text>
            <Text className="mt-1 text-sm text-muted-foreground">Tin mới về bài viết, bình luận và đơn của bạn.</Text>
          </View>
          <Pressable
            disabled={unreadCount === 0 || markAll.isPending}
            onPress={markAllRead}
            className={cn(
              'flex-row items-center gap-1.5 rounded-full border border-input px-3 py-2',
              unreadCount === 0 || markAll.isPending ? 'opacity-50' : ''
            )}>
            <CheckCheck size={14} color={colors.foreground} />
            <Text className="text-xs font-semibold text-foreground">Đọc tất cả</Text>
          </Pressable>
        </View>

        <View className="flex-row gap-2">
          {(
            [
              { value: 'all', label: 'Tất cả' },
              { value: 'unread', label: 'Chưa đọc' },
            ] as const
          ).map((option) => {
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
          <Pressable onPress={() => void refetch()} disabled={isRefetching} className="ml-auto justify-center px-2">
            <Text className="text-xs font-semibold text-primary">{isRefetching ? 'Đang tải...' : 'Làm mới'}</Text>
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
      </View>
    </SiteScreen>
  );
}
