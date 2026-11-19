import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';
import { useUnreadCountQuery } from '../queries/notification.queries';
import { NotificationPopup } from './notification-popup';

/**
 * Chuông ở header: badge số chưa đọc (`9+` khi lớn), bấm mở hộp thông báo.
 * Chỉ hiện khi đã đăng nhập; vùng chạm 44dp chuẩn di động.
 */
export function NotificationBell() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: unread } = useUnreadCountQuery();
  const [open, setOpen] = React.useState(false);

  if (!isAuthenticated) return null;

  const count = unread?.count ?? 0;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={count > 0 ? `Thông báo (${count} chưa đọc)` : 'Thông báo'}
        onPress={() => setOpen(true)}
        className="h-11 w-11 items-center justify-center rounded-full bg-muted active:opacity-80">
        <Bell size={18} color={colors.foreground} />
        {unread?.capped ? (
          <View className="absolute right-0.5 top-0.5 h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1">
            <Text className="text-[10px] font-bold text-white">{unread.capped}</Text>
          </View>
        ) : null}
      </Pressable>
      {open ? <NotificationPopup onClose={() => setOpen(false)} /> : null}
    </>
  );
}
