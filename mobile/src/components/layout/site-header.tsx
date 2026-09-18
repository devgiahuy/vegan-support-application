import * as React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, usePathname } from 'expo-router';
import { LogIn, Search, Sparkles } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';
import { ThemeToggle } from './theme-toggle';

interface NavItem {
  label: string;
  href: '/' | '/recipes' | '/articles' | null;
}

/** Các mục chưa có màn hình thật (`href: null`) hiện thông báo thay vì điều hướng vỡ route. */
const NAV_ITEMS: NavItem[] = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Khám phá món', href: '/recipes' },
  { label: 'Cẩm nang', href: '/articles' },
  { label: 'Video nấu ăn', href: null },
  { label: 'Thực đơn tuần', href: null },
  { label: 'Bản đồ quán', href: null },
];

function notifyComingSoon(feature: string) {
  Alert.alert('Sắp ra mắt', `${feature} đang được VeggieConnect hoàn thiện, quay lại sau nhé!`);
}

/**
 * Header điều hướng dùng chung cho mọi trang chính, đồng bộ
 * `frontend/src/components/layout/site-header.tsx` (logo, nav, tìm kiếm,
 * AI Trợ lý, đổi giao diện, đăng nhập). Thay nav ngang cố định của web bằng
 * hàng pill cuộn ngang phù hợp mobile.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const colors = useIconColors();
  const { isAuthenticated, user } = useAuthStore();

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <SafeAreaView edges={['top']} className="border-b border-border bg-background">
      <View className="flex-row items-center gap-2 px-4 py-2.5">
        <Link href="/" asChild>
          <Pressable>
            <Text className="text-base font-bold text-primary">VeggieConnect</Text>
          </Pressable>
        </Link>

        <View className="ml-auto flex-row items-center gap-1.5">
          <Pressable
            onPress={() => notifyComingSoon('Tìm kiếm')}
            className="h-9 w-9 items-center justify-center rounded-full bg-muted">
            <Search size={15} color={colors.foreground} />
          </Pressable>
          <Pressable
            onPress={() => notifyComingSoon('Trợ lý AI dinh dưỡng')}
            className="h-9 w-9 items-center justify-center rounded-full bg-cta/15">
            <Sparkles size={15} color={colors.cta} />
          </Pressable>
          <ThemeToggle />
          {isAuthenticated && user ? (
            <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Text className="text-xs font-bold text-primary">{user.initials}</Text>
            </View>
          ) : (
            <Link href="/(auth)/login" asChild>
              <Pressable className="flex-row items-center gap-1.5 rounded-full bg-primary px-3 py-1.5">
                <LogIn size={13} color={colors.primaryForeground} />
                <Text className="text-xs font-semibold text-primary-foreground">Đăng nhập</Text>
              </Pressable>
            </Link>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-1.5 px-4 pb-2.5">
        {NAV_ITEMS.map((item) => {
          const active = item.href !== null && isActive(item.href);
          const pill = (
            <View className={cn('rounded-full px-3 py-1.5', active ? 'bg-primary' : 'bg-muted')}>
              <Text
                className={cn(
                  'text-xs font-medium',
                  active ? 'font-semibold text-primary-foreground' : 'text-muted-foreground'
                )}>
                {item.label}
              </Text>
            </View>
          );
          if (item.href === null) {
            return (
              <Pressable key={item.label} onPress={() => notifyComingSoon(item.label)}>
                {pill}
              </Pressable>
            );
          }
          return (
            <Link key={item.label} href={item.href} asChild>
              <Pressable>{pill}</Pressable>
            </Link>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
