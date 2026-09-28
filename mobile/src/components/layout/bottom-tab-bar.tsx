import * as React from 'react';
import { Animated, Dimensions, Keyboard, Platform, Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import {
  BookOpen,
  CalendarDays,
  ChefHat,
  Clapperboard,
  House,
  MapPin,
  Plus,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';

import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';

interface TabConfig {
  label: string;
  icon: LucideIcon;
}

/** Khóa là tên route trong `app/(tabs)/`. */
const TAB_CONFIG: Record<string, TabConfig> = {
  index: { label: 'Trang chủ', icon: House },
  recipes: { label: 'Món chay', icon: ChefHat },
  restaurants: { label: 'Bản đồ', icon: MapPin },
  profile: { label: 'Hồ sơ', icon: UserRound },
};

/**
 * Thứ tự 5 nút hiển thị trên thanh. `__fan__` là nút menu quạt ảo (không gắn route
 * cụ thể) — bấm vào bung 3 lối tắt Video/Cẩm nang/Thực đơn theo hình quạt phía trên.
 * Đặt ở GIỮA (nút nổi to nhất) để khi bung quạt lên, hai bên đều là tab thường —
 * khoảng cách tới tab liền kề đều nhau ở cả hai phía, tránh đè lên bất kỳ nút nào.
 */
const TAB_ORDER = ['index', 'recipes', '__fan__', 'restaurants', 'profile'] as const;

interface FanItem {
  label: string;
  icon: LucideIcon;
  href: Href;
}

const FAN_ITEMS: FanItem[] = [
  { label: 'Video', icon: Clapperboard, href: '/videos' as Href },
  { label: 'Cẩm nang', icon: BookOpen, href: '/articles' as Href },
  { label: 'Thực đơn', icon: CalendarDays, href: '/meal-plans' as Href },
];

/**
 * Góc toả (độ, 0=phải, 90=thẳng lên) và bán kính (px) của 3 nút vệ tinh khi bung ra.
 * Đối xứng quanh 90° vì nút "Thêm" nằm GIỮA thanh tab — tab liền kề bên trái (Món
 * chay) và bên phải (Bản đồ) cách tâm nút "Thêm" đều ~88dp (đo thực tế bằng
 * `uiautomator dump`, mật độ màn hình 3x). Góc 135°/45° (cách đỉnh 45°, rộng hơn
 * bản trước) cho khoảng cách tới 2 tab liền kề ~72dp (vẫn > mức tối thiểu ~48dp)
 * và khoảng cách giữa các nút vệ tinh với nhau ~65dp — thấy rõ khe hở giữa 3 nút.
 */
const FAN_ANGLES_DEG = [135, 90, 45];
const FAN_RADIUS = 90;
const SCREEN_HEIGHT = Dimensions.get('window').height;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Ẩn thanh tab khi bàn phím mở trên Android để không đè lên ô nhập liệu. */
function useKeyboardVisible() {
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
  const router = useRouter();
  const keyboardVisible = useKeyboardVisible();
  const [fanOpen, setFanOpen] = React.useState(false);
  const progress = React.useRef(new Animated.Value(0)).current;

  const animateTo = (open: boolean) => {
    Animated.spring(progress, {
      toValue: open ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 68,
    }).start();
  };

  const toggleFan = () => {
    setFanOpen((prev) => {
      const next = !prev;
      animateTo(next);
      return next;
    });
  };

  const closeFan = () => {
    setFanOpen((prev) => {
      if (!prev) return prev;
      animateTo(false);
      return false;
    });
  };

  const goToFanItem = (href: Href) => {
    closeFan();
    router.push(href);
  };

  if (keyboardVisible) return null;

  return (
    <View
      className="border-t border-border bg-background px-1"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
      {fanOpen ? (
        // Lớp phủ trong suốt phủ hết phần màn hình phía trên thanh tab — bấm ra
        // ngoài 3 nút vệ tinh sẽ đóng menu quạt lại.
        <Pressable
          onPress={closeFan}
          accessibilityLabel="Đóng menu"
          style={{ position: 'absolute', top: -SCREEN_HEIGHT, left: 0, right: 0, height: SCREEN_HEIGHT }}
        />
      ) : null}

      <View className="flex-row items-end">
        {TAB_ORDER.map((key) => {
          if (key === '__fan__') {
            return (
              <FanTrigger
                key="__fan__"
                open={fanOpen}
                progress={progress}
                onToggle={toggleFan}
                onSelect={goToFanItem}
                colors={colors}
              />
            );
          }

          const routeIndex = state.routes.findIndex((r) => r.name === key);
          const config = TAB_CONFIG[key];
          if (routeIndex === -1 || !config) return null;

          const route = state.routes[routeIndex];
          const focused = state.index === routeIndex;
          const Icon = config.icon;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
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
              className="flex-1 items-center pt-2">
              <View
                className={cn(
                  'absolute top-0 h-[3px] w-8 rounded-full',
                  focused ? 'bg-primary' : 'bg-transparent'
                )}
              />
              <Icon
                size={22}
                color={focused ? colors.primary : colors.mutedForeground}
                strokeWidth={focused ? 2.4 : 1.8}
              />
              <Text
                numberOfLines={1}
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

/**
 * Nút "Thêm" ở giữa thanh tab — bấm vào bung 3 nút vệ tinh (Video/Cẩm nang/Thực đơn)
 * theo hình quạt phía trên, giống bản phác thảo người dùng cung cấp. Không gắn với
 * một route cụ thể nên không có trạng thái active/focused như tab thường.
 */
function FanTrigger({
  open,
  progress,
  onToggle,
  onSelect,
  colors,
}: {
  open: boolean;
  progress: Animated.Value;
  onToggle: () => void;
  onSelect: (href: Href) => void;
  colors: ReturnType<typeof useIconColors>;
}) {
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  return (
    // Không có pt-2 (khác tab thường) để `-mt-6` của nút tròn kéo lên đúng 24dp,
    // giống cách nút featured (Bản đồ) nổi lên trước đây.
    <View className="flex-1 items-center">
      {FAN_ITEMS.map((item, index) => {
        const angle = toRad(FAN_ANGLES_DEG[index] ?? 90);
        const dx = FAN_RADIUS * Math.cos(angle);
        const dy = -FAN_RADIUS * Math.sin(angle);
        const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
        const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
        const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
        const Icon = item.icon;

        return (
          <Animated.View
            key={item.label}
            pointerEvents={open ? 'auto' : 'none'}
            className="absolute bottom-2 items-center"
            style={{ opacity: progress, transform: [{ translateX }, { translateY }, { scale }] }}>
            {/* Nhãn màu cố định (không theo token theme) để luôn tương phản rõ với nền nút
                tròn primary, tránh trường hợp theme sáng/tối vô tình trùng màu chữ-nền. */}
            <View className="mb-1 rounded-full bg-slate-900 px-2 py-0.5">
              <Text numberOfLines={1} className="text-[10px] font-semibold text-white">
                {item.label}
              </Text>
            </View>
            <Pressable
              onPress={() => onSelect(item.href)}
              accessibilityLabel={item.label}
              className="h-11 w-11 items-center justify-center rounded-full bg-primary"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
                elevation: 5,
              }}>
              <Icon size={18} color={colors.primaryForeground} strokeWidth={2.2} />
            </Pressable>
          </Animated.View>
        );
      })}

      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="Thêm: Video, Cẩm nang, Thực đơn"
        className="-mt-6 h-14 w-14 items-center justify-center rounded-full border-4 border-background bg-primary"
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Plus size={24} color={colors.primaryForeground} strokeWidth={2.2} />
        </Animated.View>
      </Pressable>
      <Text
        numberOfLines={1}
        className={cn('mt-1 text-[11px]', open ? 'font-bold text-primary' : 'font-medium text-muted-foreground')}>
        Thêm
      </Text>
    </View>
  );
}
