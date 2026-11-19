import * as React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ChevronRight, Heart, ShieldCheck, Sprout, Star, type LucideIcon } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

import { SOCIAL_LINKS } from '@/lib/env';
import { SOCIAL_ICON_PATHS } from './social-icon-paths';

const EMERALD_ICON = '#34d399';
const SOCIAL_ICON_COLOR = '#a7f3d0';

const PALETTES = {
  light: { base: '#062014', border: 'rgba(16,185,129,0.38)', card: 'rgba(9,40,26,0.92)' },
  dark: { base: '#0b291b', border: 'rgba(52,211,153,0.4)', card: 'rgba(6,28,18,0.92)' },
} as const;

const SOCIALS: { key: keyof typeof SOCIAL_LINKS; label: string; paths: readonly string[] }[] = [
  { key: 'facebook', label: 'Facebook VeggieConnect', paths: SOCIAL_ICON_PATHS.facebook },
  { key: 'instagram', label: 'Instagram VeggieConnect', paths: SOCIAL_ICON_PATHS.instagram },
  { key: 'youtube', label: 'YouTube VeggieConnect', paths: SOCIAL_ICON_PATHS.youTube },
  { key: 'tiktok', label: 'TikTok VeggieConnect', paths: SOCIAL_ICON_PATHS.tikTok },
  { key: 'pinterest', label: 'Pinterest VeggieConnect', paths: SOCIAL_ICON_PATHS.pinterest },
  { key: 'x', label: 'X VeggieConnect', paths: SOCIAL_ICON_PATHS.xTwitter },
];

const QUICK_LINKS: { label: string; href: string }[] = [
  { label: 'Về VeggieConnect', href: '/about' },
  { label: 'Trung tâm trợ giúp', href: '/help' },
  { label: 'Quy chế cộng đồng', href: '/guidelines' },
  { label: 'Chính sách bảo mật', href: '/privacy' },
  { label: 'Điều khoản sử dụng', href: '/terms' },
  { label: 'Liên hệ & Góp ý', href: '/contact' },
];

const COMMITMENTS: { icon: LucideIcon; title: string }[] = [
  { icon: Sprout, title: '100% thực vật' },
  { icon: Heart, title: 'Dinh dưỡng minh bạch' },
  { icon: ShieldCheck, title: 'Cộng đồng kiểm duyệt' },
  { icon: Star, title: 'Cá nhân hóa an toàn' },
];

function SocialIcon({ paths }: { paths: readonly string[] }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill={SOCIAL_ICON_COLOR}>
      {paths.map((d) => (
        <Path key={d.slice(0, 24)} d={d} />
      ))}
    </Svg>
  );
}

/**
 * Footer gọn thiết kế riêng cho điện thoại (dùng ở cuối Trang chủ):
 * nhận diện thương hiệu, 4 cam kết ngắn, danh sách liên kết trợ giúp có vùng chạm >= 44dp và bản quyền.
 */
export function SiteFooter() {
  const { colorScheme } = useColorScheme();
  const palette = PALETTES[colorScheme === 'dark' ? 'dark' : 'light'];
  const socials = SOCIALS.filter((item) => SOCIAL_LINKS[item.key].length > 0);

  const openSocial = (url: string) => {
    void Linking.openURL(url).catch(() => undefined);
  };

  return (
    <View
      style={{
        marginTop: 28,
        backgroundColor: palette.base,
        borderTopWidth: 1,
        borderColor: palette.border,
      }}>
      <View className="gap-5 px-5 py-7">
        {/* Thương hiệu */}
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <Image source={require('@/assets/images/logo/logo-mark.png')} style={{ width: 38, height: 38 }} contentFit="contain" />
            <View className="flex-1">
              <Text className="text-lg font-bold tracking-tight text-white">VeggieConnect</Text>
              <Text className="text-xs font-medium text-emerald-300/90">
                Ăn chay · Sống khỏe · Kết nối cộng đồng
              </Text>
            </View>
          </View>
          <Text className="text-xs leading-5 text-emerald-50/85">
            Nền tảng hỗ trợ ăn chay khoa học, quản lý thực đơn cá nhân và kết nối cộng đồng thực vật Việt Nam.
          </Text>
        </View>

        {/* Cam kết 2x2 */}
        <View className="flex-row flex-wrap gap-2">
          {COMMITMENTS.map((item) => (
            <View
              key={item.title}
              style={{ borderColor: palette.border, backgroundColor: palette.card }}
              className="w-[48.5%] flex-row items-center gap-2 rounded-xl border px-3 py-2.5">
              <item.icon size={14} color={EMERALD_ICON} />
              <Text numberOfLines={1} className="flex-1 text-xs font-medium text-emerald-50">
                {item.title}
              </Text>
            </View>
          ))}
        </View>

        {/* Liên kết thông tin & hỗ trợ — bố cục 2 cột dễ chạm (cao >= 44dp) */}
        <View className="gap-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
            Thông tin & Hỗ trợ
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {QUICK_LINKS.map((link) => (
              <Link key={link.href} href={link.href as Href} asChild>
                <Pressable
                  accessibilityRole="link"
                  style={{ borderColor: palette.border, backgroundColor: palette.card }}
                  className="min-h-11 w-[48.5%] flex-row items-center justify-between rounded-xl border px-3 py-2 active:opacity-80">
                  <Text numberOfLines={1} className="flex-1 text-xs font-medium text-emerald-50">
                    {link.label}
                  </Text>
                  <ChevronRight size={14} color={EMERALD_ICON} />
                </Pressable>
              </Link>
            ))}
          </View>
        </View>

        {/* Mạng xã hội */}
        {socials.length > 0 ? (
          <View className="flex-row flex-wrap gap-2.5">
            {socials.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => openSocial(SOCIAL_LINKS[item.key])}
                accessibilityRole="link"
                accessibilityLabel={item.label}
                className="h-11 w-11 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-950/50 active:bg-emerald-800/50">
                <SocialIcon paths={item.paths} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Bản quyền */}
        <View className="items-center gap-1 pt-3" style={{ borderTopWidth: 1, borderColor: palette.border }}>
          <Text className="text-center text-xs text-emerald-100/75">
            © {new Date().getFullYear()} VeggieConnect · Ăn chay hôm nay, khỏe mạnh ngày mai
          </Text>
        </View>
      </View>
    </View>
  );
}
