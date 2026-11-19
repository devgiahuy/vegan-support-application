import * as React from 'react';
import { Keyboard, Platform, Pressable, Text, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import {
  CalendarDays,
  ChefHat,
  House,
  MapPin,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';

import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';

interface TabConfig {
  label: string;
  icon: LucideIcon;
  /** Các route con trong `(tabs)` dùng chung mục điều hướng này (ví dụ Khám phá gồm công thức/cẩm nang/video). */
  matchRoutes?: readonly string[];
}

/** Khóa là tên route trong `app/(tabs)/`. */
const TAB_CONFIG: Record<string, TabConfig> = {
  index: { label: 'Trang chủ', icon: House },
  recipes: {
    label: 'Khám phá',
    icon: ChefHat,
    matchRoutes: ['recipes', 'articles', 'videos'],
  },
  'meal-plans': { label: 'Thực đơn', icon: CalendarDays },
  restaurants: { label: 'Quán chay', icon: MapPin },
  profile: { label: 'Hồ sơ', icon: UserRound },
};

/**
 * 5 mục điều hướng cấp cao theo mục tiêu sử dụng trên điện thoại:
 * Trang chủ · Khám phá (Công thức / Cẩm nang / Video) · Thực đơn · Quán chay · Hồ sơ.
 */
const TAB_ORDER = ['index', 'recipes', 'meal-plans', 'restaurants', 'profile'] as const;

/** Ẩn thanh tab khi bàn phím mở trên Android để không đè lên ô nhập liệu. */
export function useKeyboardVisible() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}

export function BottomTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const colors = useIconColors();
  const keyboardVisible = useKeyboardVisible();

  if (keyboardVisible) return null;

  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View
      className="border-t border-border bg-background px-1"
      style={{ paddingBottom: Math.max(insets.bottom, 6) }}>
      <View className="flex-row items-stretch">
        {TAB_ORDER.map((key) => {
          const routeIndex = state.routes.findIndex((r) => r.name === key);
          const config = TAB_CONFIG[key];
          if (routeIndex === -1 || !config) return null;

          const route = state.routes[routeIndex];
          const isExactFocused = state.index === routeIndex;
          const focused =
            isExactFocused ||
            Boolean(activeRouteName && config.matchRoutes?.includes(activeRouteName));
          const Icon = config.icon;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isExactFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={config.label}
              className="min-h-[56px] flex-1 items-center justify-center px-1 pb-1.5 pt-2 active:opacity-75">
              <View
                className={cn(
                  'absolute top-0 h-[3px] w-8 rounded-full',
                  focused ? 'bg-primary' : 'bg-transparent'
                )}
              />
              <Icon
                size={21}
                color={focused ? colors.primary : colors.mutedForeground}
                strokeWidth={focused ? 2.4 : 1.8}
              />
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                className={cn(
                  'mt-1 text-[11px]',
                  focused ? 'font-bold text-primary' : 'font-medium text-muted-foreground'
                )}>
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
