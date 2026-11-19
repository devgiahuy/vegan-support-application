import * as React from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, type Href, usePathname, useRouter } from 'expo-router';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import { NotificationBell } from '@/features/notification/components/notification-bell';
import { useIconColors } from '@/lib/theme-colors';
import { BrandLogo } from './brand-logo';

const ROOT_TAB_TITLES: Record<string, string> = {
  '/recipes': 'Khám phá',
  '/articles': 'Khám phá',
  '/videos': 'Khám phá',
  '/meal-plans': 'Thực đơn tuần',
  '/restaurants': 'Quán chay',
  '/profile': 'Hồ sơ & Cài đặt',
};

const EXACT_TITLES: Record<string, string> = {
  '/assistant': 'Trợ lý AI',
  '/search': 'Tìm kiếm',
  '/recipes/new': 'Đăng công thức',
  '/articles/new': 'Viết bài mới',
  '/videos/new': 'Đăng video',
  '/meal-plans/saved': 'Thực đơn đã lưu',
  '/meal-programs': 'Lộ trình nhiều tuần',
  '/meal-programs/new': 'Tạo lộ trình mới',
  '/custom-meals': 'Món ăn của tôi',
  '/custom-meals/new': 'Tạo món ăn mới',
  '/restaurants/mine': 'Quán chay đã đề xuất',
  '/restaurants/new': 'Đề xuất quán chay',
  '/pantry': 'Tủ bếp gia đình',
  '/fridge-scan': 'Quét tủ lạnh',
  '/receipt-scan': 'Quét hóa đơn',
  '/receipts': 'Quét hóa đơn',
  '/shopping-preview': 'Danh sách cần mua',
  '/diet-preferences': 'Thiết lập ăn uống',
  '/diet-repair': 'Điều chỉnh thực đơn',
  '/my-content': 'Bài viết của tôi',
  '/food-data': 'Tra cứu dinh dưỡng',
  '/billing': 'Gói tiện ích',
  '/contributor-status': 'Đăng ký đóng góp',
  '/contributor-dashboard': 'Kiểm duyệt cộng đồng',
  '/ai-knowledge': 'Tri thức AI cộng đồng',
  '/about': 'Về VeggieConnect',
  '/help': 'Trung tâm trợ giúp',
  '/privacy': 'Chính sách bảo mật',
  '/terms': 'Điều khoản sử dụng',
  '/guidelines': 'Quy chế cộng đồng',
  '/contact': 'Liên hệ hỗ trợ',
  '/feedback': 'Góp ý & Báo lỗi',
};

function resolveScreenTitle(pathname: string): string {
  const exact = EXACT_TITLES[pathname];
  if (exact) return exact;

  if (/^\/recipes\/[^/]+\/edit$/.test(pathname)) return 'Chỉnh sửa công thức';
  if (/^\/recipes\/[^/]+$/.test(pathname)) return 'Chi tiết công thức';
  if (/^\/articles\/[^/]+\/edit$/.test(pathname)) return 'Chỉnh sửa bài viết';
  if (/^\/articles\/[^/]+$/.test(pathname)) return 'Chi tiết bài viết';
  if (/^\/videos\/[^/]+\/edit$/.test(pathname)) return 'Chỉnh sửa video';
  if (/^\/videos\/[^/]+$/.test(pathname)) return 'Chi tiết video';
  if (/^\/meal-plans\/[^/]+$/.test(pathname)) return 'Chi tiết thực đơn';
  if (/^\/meal-programs\/[^/]+$/.test(pathname)) return 'Chi tiết lộ trình';
  if (/^\/custom-meals\/[^/]+\/edit$/.test(pathname)) return 'Chỉnh sửa món ăn';
  if (/^\/custom-meals\/[^/]+$/.test(pathname)) return 'Chi tiết món ăn';
  if (/^\/restaurants\/[^/]+$/.test(pathname)) return 'Chi tiết quán chay';
  if (/^\/ai-knowledge\/[^/]+$/.test(pathname)) return 'Chi tiết tri thức AI';

  return 'VeggieConnect';
}

export interface SiteHeaderProps {
  /** Tiêu đề tùy chỉnh; khi ở màn hình con nếu bỏ trống sẽ tự suy ra từ đường dẫn. */
  title?: string;
  /** Thao tác phụ bên phải thanh tiêu đề (theo ngữ cảnh từng màn hình). */
  headerRight?: React.ReactNode;
}

/**
 * Header chuyên biệt theo màn hình cho điện thoại:
 * - Trang chủ (`/`): Logo gọn + Thông báo (khi đã đăng nhập) + Trợ lý AI.
 * - Các tab gốc khác (`/recipes`, `/meal-plans`, `/restaurants`, `/profile`...): Tiêu đề rõ + thao tác liên quan (nếu có).
 * - Màn hình con / chi tiết: Nút quay lại (44dp) + tiêu đề màn hình + thao tác liên quan (nếu có).
 */
export function SiteHeader({ title, headerRight }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const colors = useIconColors();
  const { width } = useWindowDimensions();

  const isHome = pathname === '/' || pathname === '/index';
  const rootTitle = ROOT_TAB_TITLES[pathname];
  const isRootTab = !isHome && Boolean(rootTitle);
  const resolvedTitle = title ?? (rootTitle || resolveScreenTitle(pathname));
  const logoHeight = width < 380 ? 20 : 22;

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/' as Href);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="border-b border-border bg-background">
      {isHome ? (
        <View className="flex-row items-center justify-between gap-2 px-4 py-2">
          <BrandLogo variant="horizontal" height={logoHeight} />

          <View className="flex-row items-center gap-1.5">
            <NotificationBell />
            <Link href={'/assistant' as Href} asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mở Trợ lý AI dinh dưỡng"
                className="h-11 flex-row items-center gap-1.5 rounded-full bg-primary/10 px-3.5 active:opacity-80">
                <Sparkles size={15} color={colors.primary} />
                <Text numberOfLines={1} className="text-xs font-bold text-primary">
                  Trợ lý AI
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      ) : isRootTab ? (
        <View className="flex-row items-center gap-3 px-4 py-2">
          <Text numberOfLines={1} className="min-w-0 flex-1 text-xl font-bold text-foreground">
            {resolvedTitle}
          </Text>

          {(pathname === '/profile' || headerRight) ? (
            <View className="flex-row items-center gap-1.5">
              {pathname === '/profile' ? <NotificationBell /> : null}
              {headerRight}
            </View>
          ) : (
            <View className="h-11" />
          )}
        </View>
      ) : (
        <View className="flex-row items-center gap-2 px-3 py-2">
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            hitSlop={6}
            className="h-11 w-11 items-center justify-center rounded-full bg-muted active:opacity-80">
            <ChevronLeft size={20} color={colors.foreground} />
          </Pressable>

          <Text numberOfLines={1} className="min-w-0 flex-1 text-base font-bold text-foreground">
            {resolvedTitle}
          </Text>

          {headerRight ? <View className="flex-row items-center gap-1.5">{headerRight}</View> : null}
        </View>
      )}
    </SafeAreaView>
  );
}
