import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, type Href, usePathname } from 'expo-router';
import { LogIn, Search, Sparkles } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';
import { ThemeToggle } from './theme-toggle';
import { BrandLogo } from './brand-logo';

interface NavItem {
  label: string;
  href:
    | '/'
    | '/recipes'
    | '/articles'
    | '/videos'
    | '/assistant'
    | '/meal-plans'
    | '/restaurants'
    | null;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Khám phá món', href: '/recipes' },
  { label: 'Cẩm nang', href: '/articles' },
  { label: 'AI Chat', href: '/assistant' },
  { label: 'Video nấu ăn', href: '/videos' },
  { label: 'Thực đơn tuần', href: '/meal-plans' },
  { label: 'Bản đồ quán', href: '/restaurants' },
];

function notifyComingSoon(feature: string) {
  Alert.alert('Sắp ra mắt', `${feature} đang được VeggieConnect hoàn thiện, quay lại sau nhé!`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const colors = useIconColors();
  const { isAuthenticated, user } = useAuthStore();

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <SafeAreaView edges={['top']} className="border-b border-border bg-background">
      <View className="flex-row items-center gap-2 px-4 py-2.5">
        <Link href="/" asChild>
          <Pressable accessibilityLabel="VeggieConnect Trang chủ">
            <BrandLogo variant="horizontal" height={24} />
          </Pressable>
        </Link>

        <View className="ml-auto flex-row items-center gap-1.5">
          <Pressable
            onPress={() => notifyComingSoon('Tìm kiếm')}
            className="h-9 w-9 items-center justify-center rounded-full bg-muted">
            <Search size={15} color={colors.foreground} />
          </Pressable>
          <Link href={'/assistant' as Href} asChild>
            <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-cta/15">
              <Sparkles size={15} color={colors.cta} />
            </Pressable>
          </Link>
          <ThemeToggle />
          {isAuthenticated && user ? (
            <Link href="/profile" asChild>
              <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Text className="text-xs font-bold text-primary">{user.initials}</Text>
              </Pressable>
            </Link>
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5 px-4 pb-2.5">
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
            <Link key={item.label} href={item.href as Href} asChild>
              <Pressable>{pill}</Pressable>
            </Link>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
