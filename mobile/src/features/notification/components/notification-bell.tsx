import { Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { Bell } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';
import { useUnreadCountQuery } from '../queries/notification.queries';

/**
 * Chuông ở header: badge số chưa đọc (`9+` khi lớn), bấm mở màn Thông báo.
 * Chỉ hiện khi đã đăng nhập (query cũng chỉ chạy khi đã đăng nhập).
 */
export function NotificationBell() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: unread } = useUnreadCountQuery();

  if (!isAuthenticated) return null;

  const count = unread?.count ?? 0;

  return (
    <Link href={'/notifications' as Href} asChild>
      <Pressable
        accessibilityLabel={count > 0 ? `Thông báo (${count} chưa đọc)` : 'Thông báo'}
        className="h-9 w-9 items-center justify-center rounded-full bg-muted">
        <Bell size={15} color={colors.foreground} />
        {unread?.capped ? (
          <View className="absolute -right-1 -top-1 h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1">
            <Text className="text-[10px] font-bold text-white">{unread.capped}</Text>
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
}
