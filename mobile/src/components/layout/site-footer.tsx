import * as React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { Lock, ShieldCheck, Sprout } from 'lucide-react-native';
import { useIconColors } from '@/lib/theme-colors';

interface FooterLink {
  label: string;
  href: '/' | '/recipes' | '/articles' | '/assistant' | '/meal-plans' | null;
}

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Khám phá',
    links: [
      { label: 'Món chay theo mùa', href: '/recipes' },
      { label: 'Cẩm nang dinh dưỡng', href: '/articles' },
      { label: 'Video hướng dẫn nấu', href: null },
      { label: 'Thực đơn 7 ngày', href: '/meal-plans' },
      { label: 'Trợ lý AI dinh dưỡng', href: '/assistant' },
      { label: 'Bản đồ quán chay', href: null },
    ],
  },
  {
    title: 'Về VeggieConnect',
    links: [
      { label: 'Sứ mệnh sống xanh', href: '/' },
      { label: 'Đội ngũ chuyên gia', href: '/' },
      { label: 'Cộng đồng chay Việt', href: '/' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Hướng dẫn sử dụng', href: '/' },
      { label: 'Đóng góp công thức', href: null },
      { label: 'Liên hệ hỗ trợ', href: '/' },
    ],
  },
];

function notifyComingSoon(feature: string) {
  Alert.alert('Sắp ra mắt', `${feature} đang được VeggieConnect hoàn thiện, quay lại sau nhé!`);
}

export function SiteFooter() {
  const colors = useIconColors();

  return (
    <View className="mt-10 border-t border-border bg-muted/40 px-5 py-8">
      <Text className="text-lg font-bold text-primary">VeggieConnect</Text>
      <Text className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Ăn chay đủ chất, dễ dàng mỗi ngày. Đồng hành dinh dưỡng thực vật chuẩn vị Việt.
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1.5">
        <View className="flex-row items-center gap-1">
          <ShieldCheck size={13} color={colors.primary} />
          <Text className="text-xs text-muted-foreground">Bảo mật dữ liệu cá nhân</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Lock size={13} color={colors.primary} />
          <Text className="text-xs text-muted-foreground">Mã hóa SSL/TLS</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Sprout size={13} color={colors.primary} />
          <Text className="text-xs text-muted-foreground">Cộng đồng lành tính</Text>
        </View>
      </View>

      {COLUMNS.map((col) => (
        <View key={col.title} className="mt-6">
          <Text className="text-sm font-semibold text-foreground">{col.title}</Text>
          <View className="mt-2.5 gap-2">
            {col.links.map((link) =>
              link.href === null ? (
                <Pressable key={link.label} onPress={() => notifyComingSoon(link.label)}>
                  <Text className="text-sm text-muted-foreground">{link.label}</Text>
                </Pressable>
              ) : (
                <Link key={link.label} href={link.href as Href} asChild>
                  <Pressable>
                    <Text className="text-sm text-muted-foreground">{link.label}</Text>
                  </Pressable>
                </Link>
              )
            )}
          </View>
        </View>
      ))}

      <View className="mt-8 border-t border-border pt-4">
        <Text className="text-xs text-muted-foreground">
          © 2026 VeggieConnect. Lan tỏa lối sống thuần thực vật an vui.
        </Text>
      </View>
    </View>
  );
}
