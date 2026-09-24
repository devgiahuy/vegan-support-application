import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, type Href, usePathname, useRouter } from 'expo-router';
import { ChevronLeft, LogIn, Search } from 'lucide-react-native';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';
import { ThemeToggle } from './theme-toggle';
import { BrandLogo } from './brand-logo';

/**
 * Đường dẫn các màn nằm trong nhóm tab (`app/(tabs)/`) — có thanh điều hướng dưới
 * đáy nên KHÔNG cần nút quay lại trên header, kể cả khi không có nút riêng trên
 * thanh tab (`assistant`, `meal-plans`, `articles`, `videos` tới qua menu quạt
 * hoặc Trang chủ). Màn khác (chi tiết công thức/video, tạo video...) là màn phụ
 * ở Stack gốc và có nút quay lại.
 */
const TAB_ROOT_PATHS = new Set([
  '/',
  '/recipes',
  '/restaurants',
  '/assistant',
  '/meal-plans',
  '/articles',
  '/videos',
  '/profile',
]);

/**
 * Header gọn cho mobile: logo + tác vụ nhanh. Điều hướng chính đã chuyển xuống
 * thanh tab dưới đáy (`bottom-tab-bar.tsx`).
 */
export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const colors = useIconColors();
  const { isAuthenticated } = useAuthStore();

  const isSubScreen = !TAB_ROOT_PATHS.has(pathname);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/' as Href);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="border-b border-border bg-background">
      <View className="flex-row items-center gap-2 px-4 py-2.5">
        {isSubScreen ? (
          <Pressable
            onPress={goBack}
            accessibilityLabel="Quay lại"
            className="-ml-1 h-9 w-9 items-center justify-center rounded-full bg-muted">
            <ChevronLeft size={18} color={colors.foreground} />
          </Pressable>
        ) : null}

        <Link href={'/' as Href} asChild>
          <Pressable accessibilityLabel="VeggieConnect Trang chủ">
            <BrandLogo variant="horizontal" height={24} />
          </Pressable>
        </Link>

        <View className="ml-auto flex-row items-center gap-1.5">
          <Link href={'/search' as Href} asChild>
            <Pressable accessibilityLabel="Tìm kiếm" className="h-9 w-9 items-center justify-center rounded-full bg-muted">
              <Search size={15} color={colors.foreground} />
            </Pressable>
          </Link>
          <ThemeToggle />
          {!isAuthenticated ? (
            <Link href={'/(auth)/login' as Href} asChild>
              <Pressable className="flex-row items-center gap-1.5 rounded-full bg-primary px-3 py-1.5">
                <LogIn size={13} color={colors.primaryForeground} />
                <Text className="text-xs font-semibold text-primary-foreground">Đăng nhập</Text>
              </Pressable>
            </Link>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
