import * as React from 'react';
import { Linking, Pressable, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ArrowRight, CheckCircle2, Heart, Mail, ShieldCheck, Sprout, Star, type LucideIcon } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

import { SOCIAL_LINKS } from '@/lib/env';
import { SOCIAL_ICON_PATHS } from './social-icon-paths';

const EMERALD_ICON = '#34d399';
const ART_RATIO = 1671 / 483;

/** Nền footer luôn xanh đậm, nhưng ở chế độ tối phải sáng hơn nền trang và có viền để không chìm vào nền. */
const PALETTES = {
  light: { base: '#04120b', veil: 'rgba(2,11,6,0.25)', border: 'rgba(16,185,129,0.45)', card: 'rgba(6,30,19,0.92)' },
  dark: { base: '#0c3220', veil: 'rgba(4,22,13,0.10)', border: 'rgba(52,211,153,0.55)', card: 'rgba(5,28,17,0.88)' },
} as const;
const SOCIAL_ICON_COLOR = '#a7f3d0';

const SOCIALS: { key: keyof typeof SOCIAL_LINKS; label: string; paths: readonly string[] }[] = [
  { key: 'facebook', label: 'Facebook VeggieConnect', paths: SOCIAL_ICON_PATHS.facebook },
  { key: 'instagram', label: 'Instagram VeggieConnect', paths: SOCIAL_ICON_PATHS.instagram },
  { key: 'youtube', label: 'YouTube VeggieConnect', paths: SOCIAL_ICON_PATHS.youTube },
  { key: 'tiktok', label: 'TikTok VeggieConnect', paths: SOCIAL_ICON_PATHS.tikTok },
  { key: 'pinterest', label: 'Pinterest VeggieConnect', paths: SOCIAL_ICON_PATHS.pinterest },
  { key: 'x', label: 'X VeggieConnect', paths: SOCIAL_ICON_PATHS.xTwitter },
];

const EXPLORE_LINKS: { label: string; href: string }[] = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Công thức nấu ăn', href: '/recipes' },
  { label: 'Blog & Bài viết', href: '/articles' },
  { label: 'Video', href: '/videos' },
  { label: 'Nhà hàng chay', href: '/restaurants' },
  { label: 'Danh mục', href: '/categories' },
  { label: 'Lên kế hoạch dinh dưỡng', href: '/meal-plans' },
  { label: 'Về VeggieConnect', href: '/about' },
];

const SUPPORT_LINKS: { label: string; href: string }[] = [
  { label: 'Trung tâm trợ giúp', href: '/help' },
  { label: 'Chính sách bảo mật', href: '/privacy' },
  { label: 'Điều khoản sử dụng', href: '/terms' },
  { label: 'Quy chế cộng đồng', href: '/guidelines' },
  { label: 'Liên hệ', href: '/contact' },
  { label: 'Góp ý & Báo lỗi', href: '/feedback' },
];

const TRUST_POINTS: { icon: LucideIcon; title: string; note: string }[] = [
  { icon: Sprout, title: 'Không spam', note: 'Cam kết chỉ gửi nội dung giá trị' },
  { icon: ShieldCheck, title: 'Bảo mật thông tin', note: 'Tôn trọng quyền riêng tư' },
  { icon: Heart, title: 'Hủy đăng ký dễ dàng', note: 'Bất cứ lúc nào' },
];

const COMMITMENTS: { icon: LucideIcon; title: string; note: string }[] = [
  { icon: Sprout, title: '100% thực vật', note: 'Thân thiện với môi trường' },
  { icon: Heart, title: 'Dinh dưỡng khoa học', note: 'Được chuyên gia tư vấn' },
  { icon: ShieldCheck, title: 'Cộng đồng tích cực', note: 'Lan tỏa lối sống lành mạnh' },
  { icon: Star, title: 'Chất lượng hàng đầu', note: 'Luôn đặt người dùng lên trước' },
];

function SocialIcon({ paths }: { paths: readonly string[] }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill={SOCIAL_ICON_COLOR}>
      {paths.map((d) => (
        <Path key={d.slice(0, 24)} d={d} />
      ))}
    </Svg>
  );
}

function LinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <View className="flex-1 gap-3">
      <Text className="text-[13px] font-semibold text-white">{title}</Text>
      <View className="gap-2.5">
        {links.map((link) => (
          <Link key={link.label} href={link.href as Href} asChild>
            <Pressable hitSlop={6}>
              <Text className="text-[11px] leading-snug text-emerald-50/90">{link.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

/**
 * Footer trang chủ — đồng bộ `site-footer.tsx` của web: khối đăng ký nhận tin, thương hiệu + mạng xã hội, hai cột liên kết,
 * cam kết và thanh bản quyền. Nền xanh đậm cố định ở cả chế độ sáng/tối (giống web). Khác web: bỏ cột "Tải ứng dụng"
 * (người dùng đã ở trong app) và bố cục xếp dọc. Backend chưa có API nhận email nên ô đăng ký chỉ kiểm tra định dạng và
 * thông báo rõ chưa lưu email.
 */
export function SiteFooter() {
  const [email, setEmail] = React.useState('');
  const [notice, setNotice] = React.useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  const { colorScheme } = useColorScheme();
  const palette = PALETTES[colorScheme === 'dark' ? 'dark' : 'light'];
  const socials = SOCIALS.filter((item) => SOCIAL_LINKS[item.key].length > 0);

  const subscribe = () => {
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setNotice({ tone: 'error', text: 'Vui lòng nhập địa chỉ email hợp lệ.' });
      return;
    }
    setNotice({ tone: 'info', text: 'Tính năng nhận tin qua email đang được hoàn thiện, email của bạn chưa được lưu.' });
  };

  const openSocial = (url: string) => {
    void Linking.openURL(url).catch(() => undefined);
  };

  return (
    <View
      style={{
        marginTop: 40,
        overflow: 'hidden',
        backgroundColor: palette.base,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1.5,
        borderColor: palette.border,
      }}>
      {/* Tranh lá chỉ là dải trang trí ở mép trên/dưới (ảnh ngang nên giữ nguyên tỉ lệ để không bị cắt mất lá). */}
      <Image
        source={require('@/assets/images/footer/footer-2.png')}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, aspectRatio: ART_RATIO }}
        contentFit="cover"
      />
      <Image
        source={require('@/assets/images/footer/footer-2.png')}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, aspectRatio: ART_RATIO, transform: [{ scaleY: -1 }] }}
        contentFit="cover"
      />
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: palette.veil }} />

      <View className="px-4 pb-6" style={{ paddingTop: 40 }}>
        {/* 1. Đăng ký nhận tin */}
        <View className="gap-4 rounded-3xl p-5" style={{ borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card }}>
          <View className="flex-row items-center gap-4">
            <Image source={require('@/assets/images/footer/sprout-glow-feathered.png')} style={{ width: 86, height: 74 }} contentFit="contain" />
            <View className="flex-1 items-start">
              <View className="rounded-full border border-emerald-400/40 bg-emerald-950/70 px-3 py-1">
                <Text className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Đăng ký nhận tin</Text>
              </View>
            </View>
          </View>

          <Text className="text-2xl font-bold leading-snug text-white">
            Hành trình <Text style={{ fontFamily: 'serif', fontStyle: 'italic', fontWeight: '400', color: '#9eedb5' }}>sống xanh</Text>
            {'\n'}bắt đầu từ những điều nhỏ bé
          </Text>
          <Text className="text-xs leading-relaxed text-emerald-100/75">
            Nhận công thức ăn chay mới, mẹo dinh dưỡng, bài viết hữu ích và cập nhật từ cộng đồng VeggieConnect mỗi tuần.
          </Text>

          <View className="flex-row items-center rounded-full border border-emerald-500/50 bg-[#04130c]/90 p-1.5">
            <Mail size={18} color={EMERALD_ICON} style={{ marginLeft: 10 }} />
            <TextInput
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setNotice(null);
              }}
              placeholder="Nhập địa chỉ email của bạn..."
              placeholderTextColor="rgba(167,243,208,0.5)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Địa chỉ email đăng ký"
              className="min-w-0 flex-1 px-2.5 py-2 text-xs text-white"
            />
            <Pressable onPress={subscribe} className="flex-row items-center gap-1.5 rounded-full bg-[#dff2b2] px-4 py-2.5 active:opacity-80">
              <Text className="text-xs font-semibold text-[#0d2a1c]">Đăng ký</Text>
              <ArrowRight size={14} color="#0d2a1c" />
            </Pressable>
          </View>
          {notice ? (
            <View className="flex-row items-start gap-1.5">
              {notice.tone === 'info' ? <CheckCircle2 size={13} color={EMERALD_ICON} style={{ marginTop: 1 }} /> : null}
              <Text className={notice.tone === 'error' ? 'flex-1 text-xs text-red-300' : 'flex-1 text-xs text-emerald-200/80'}>{notice.text}</Text>
            </View>
          ) : null}

          <View className="flex-row gap-2.5">
            {TRUST_POINTS.map((point) => (
              <View key={point.title} className="flex-1 gap-1">
                <point.icon size={15} color={EMERALD_ICON} />
                <Text className="text-xs font-semibold leading-tight text-white">{point.title}</Text>
                <Text className="text-[10px] leading-tight text-emerald-100/75">{point.note}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. Thương hiệu */}
        <View className="gap-4" style={{ marginTop: 36 }}>
          <View className="flex-row items-center gap-3">
            <Image source={require('@/assets/images/logo/logo-mark.png')} style={{ width: 40, height: 40 }} contentFit="contain" />
            <View className="flex-1">
              <Text className="text-2xl font-bold tracking-tight text-white">VeggieConnect</Text>
              <Text style={{ fontSize: 9, letterSpacing: 1.5, fontWeight: '600', textTransform: 'uppercase', color: 'rgba(110,231,183,0.9)' }}>
                Ăn chay • Sống khỏe • Kết nối cộng đồng
              </Text>
            </View>
          </View>
          <Text className="text-xs leading-relaxed text-emerald-50/85">
            VeggieConnect là nền tảng dinh dưỡng thực vật, nuôi dưỡng sức khỏe và kết nối những tâm hồn cùng chung giá trị sống xanh.
          </Text>

          {socials.length > 0 ? (
            <View className="flex-row flex-wrap gap-2.5">
              {socials.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => openSocial(SOCIAL_LINKS[item.key])}
                  accessibilityLabel={item.label}
                  className="h-9 w-9 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950/40 active:bg-emerald-800/50">
                  <SocialIcon paths={item.paths} />
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 14, color: 'rgba(110,231,183,0.9)' }}>Vì một tương lai xanh hơn 🍃</Text>
        </View>

        {/* 3. Liên kết + Cam kết — 3 cột trên một hàng */}
        <View className="flex-row" style={{ marginTop: 36, gap: 14 }}>
          <LinkColumn title="Khám phá" links={EXPLORE_LINKS} />
          <LinkColumn title="Hỗ trợ" links={SUPPORT_LINKS} />
          <View className="flex-1 gap-3">
            <Text className="text-[13px] font-semibold text-white">Cam kết của chúng tôi</Text>
            <View style={{ gap: 12 }}>
              {COMMITMENTS.map((item) => (
                <View key={item.title} className="flex-row items-start gap-2">
                  <View className="h-6 w-6 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-950/60">
                    <item.icon size={12} color={EMERALD_ICON} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] font-semibold leading-tight text-white">{item.title}</Text>
                    <Text className="mt-0.5 text-[9px] leading-tight text-emerald-100/75">{item.note}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 5. Bản quyền */}
        <View className="items-center gap-2.5 pt-4" style={{ marginTop: 36, borderTopWidth: 1, borderColor: palette.border }}>
          <Text className="text-center text-[11px] text-emerald-100/75">© {new Date().getFullYear()} VeggieConnect. Tất cả quyền được bảo lưu.</Text>
          <View className="flex-row items-center gap-1.5">
            <Sprout size={13} color={EMERALD_ICON} />
            <Text className="text-[11px] text-emerald-300/80">Ăn chay hôm nay • Khỏe mạnh ngày mai</Text>
          </View>
          <Text className="text-[11px] text-emerald-100/75">
            Made with <Text className="text-emerald-400">♡</Text> for a greener world
          </Text>
        </View>
      </View>
    </View>
  );
}
