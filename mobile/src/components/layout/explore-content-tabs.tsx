import { Pressable, Text, View } from 'react-native';
import { type Href, usePathname, useRouter } from 'expo-router';
import { BookOpen, ChefHat, Clapperboard, type LucideIcon } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';

const EXPLORE_TABS: { key: 'recipes' | 'articles' | 'videos'; label: string; href: Href; icon: LucideIcon }[] = [
  { key: 'recipes', label: 'Công thức', href: '/recipes' as Href, icon: ChefHat },
  { key: 'articles', label: 'Cẩm nang', href: '/articles' as Href, icon: BookOpen },
  { key: 'videos', label: 'Video', href: '/videos' as Href, icon: Clapperboard },
];

/**
 * Thanh chuyển nhanh giữa 3 nhóm nội dung cộng đồng trong mục Khám phá:
 * Công thức · Cẩm nang · Video. Giữ vùng chạm tối thiểu 44dp cho thao tác một tay.
 */
export function ExploreContentTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const colors = useIconColors();

  const currentKey = pathname.startsWith('/articles')
    ? 'articles'
    : pathname.startsWith('/videos')
      ? 'videos'
      : 'recipes';

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel="Chuyên mục khám phá"
      className="flex-row gap-1 rounded-2xl border border-border bg-muted/70 p-1">
      {EXPLORE_TABS.map((item) => {
        const active = item.key === currentKey;
        const Icon = item.icon;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) {
                router.navigate(item.href);
              }
            }}
            className={cn(
              'min-h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl px-2',
              active ? 'border border-border/60 bg-background' : 'active:bg-background/50'
            )}>
            <Icon size={16} color={active ? colors.primary : colors.mutedForeground} />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              className={cn(
                'text-xs',
                active ? 'font-bold text-primary' : 'font-medium text-muted-foreground'
              )}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
