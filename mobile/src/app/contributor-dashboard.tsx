import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import {
  BookOpen,
  CircleAlert,
  CircleCheck,
  ClipboardCheck,
  FileCheck,
  HeartHandshake,
  Plus,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UtensilsCrossed,
  Video,
} from 'lucide-react-native';

import { UserRole } from '@/common/enums';
import { SiteScreen } from '@/components/layout/site-screen';
import { LoginRequired } from '@/components/shared/login-required';
import { ErrorState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ContentReviewQueue } from '@/features/review/components/content-review-queue';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

type ContributorTab = 'queue' | 'contributions' | 'guidelines';

const TABS: { id: ContributorTab; label: string; icon: typeof ClipboardCheck }[] = [
  { id: 'queue', label: 'Hàng chờ kiểm duyệt', icon: ClipboardCheck },
  { id: 'contributions', label: 'Lối tắt đóng góp', icon: UtensilsCrossed },
  { id: 'guidelines', label: 'Quy chuẩn kiểm duyệt', icon: FileCheck },
];

function Shortcut({ title, body, label, href, icon: Icon, primary }: { title: string; body: string; label: string; href: Href; icon: typeof Plus; primary?: boolean }) {
  const colors = useIconColors();
  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="size-11 items-center justify-center rounded-2xl bg-primary/10">
        <Icon size={22} color={colors.primary} />
      </View>
      <Text className="text-lg font-bold text-foreground">{title}</Text>
      <Text className="text-sm leading-5 text-muted-foreground">{body}</Text>
      <Link href={href} asChild>
        <PrimaryButton label={label} variant={primary ? 'primary' : 'outline'} icon={<Plus size={16} color={primary ? colors.primaryForeground : colors.foreground} />} />
      </Link>
    </View>
  );
}

/**
 * Bảng điều khiển Contributor — đồng bộ `frontend/.../contributor/dashboard/page.tsx`: hàng chờ kiểm duyệt,
 * lối tắt đóng góp và quy chuẩn kiểm duyệt. Chỉ Contributor/Admin xem được; app di động không có màn quản trị Admin.
 * Quyền duyệt từng bài do backend quyết định (`canDecide`), không suy ra từ giao diện.
 */
export default function ContributorDashboardScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = React.useState<ContributorTab>('queue');

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <LoginRequired title="Đăng nhập để vào không gian Contributor" />
      </SiteScreen>
    );
  }
  if (user?.role !== UserRole.CONTRIBUTOR && user?.role !== UserRole.ADMIN) {
    return (
      <SiteScreen>
        <View className="gap-4 px-5 pt-6">
          <ErrorState title="Bạn không có quyền vào trang này." description="Không gian kiểm duyệt chỉ dành cho Người đóng góp đã được duyệt và Quản trị viên." />
          <Link href={'/' as Href} asChild>
            <PrimaryButton label="Về trang chủ" variant="outline" />
          </Link>
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pb-6 pt-4">
        <View className="gap-3 rounded-3xl border border-primary/20 bg-primary/5 p-5">
          <View className="flex-row flex-wrap items-center gap-2">
            <View className="flex-row items-center gap-1.5 rounded-full bg-primary px-3 py-1">
              <ShieldCheck size={13} color={colors.primaryForeground} />
              <Text className="text-xs font-medium text-primary-foreground">
                {user.role === UserRole.ADMIN ? 'Quản trị viên / Moderator' : 'Người đóng góp được xác thực'}
              </Text>
            </View>
            <View className="rounded-full border border-primary/30 px-3 py-1">
              <Text className="text-xs text-primary">Quyền kiểm duyệt nội dung</Text>
            </View>
          </View>
          <Text className="text-2xl font-extrabold tracking-tight text-foreground">Chào mừng, {user.displayName || 'Người đóng góp'}!</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Không gian làm việc dành riêng cho Người đóng góp: thẩm định chất lượng bài đăng thuần thực vật từ cộng đồng, duy trì tiêu chuẩn an toàn dinh dưỡng và sáng tạo nội dung mới.
          </Text>
          <View className="flex-row gap-2">
            <Link href={'/recipes/new' as Href} asChild>
              <PrimaryButton label="Đăng công thức" className="flex-1" icon={<Plus size={16} color={colors.primaryForeground} />} />
            </Link>
            <Link href={'/articles/new' as Href} asChild>
              <PrimaryButton label="Viết cẩm nang" variant="outline" className="flex-1" icon={<BookOpen size={16} color={colors.foreground} />} />
            </Link>
          </View>
        </View>

        <View className="gap-3">
          {[
            { icon: ClipboardCheck, label: 'Hàng chờ duyệt', value: 'Hệ thống đồng bộ', note: 'Xử lý theo SLA < 24 giờ' },
            { icon: Sparkles, label: 'Tiêu chuẩn kiểm duyệt', value: '100% Thuần chay', note: 'Không sữa động vật, trứng, mật ong' },
            { icon: HeartHandshake, label: 'Trách nhiệm', value: 'Minh bạch & Tích cực', note: 'Lý do phản hồi ≥ 10 ký tự' },
          ].map(({ icon: Icon, label, value, note }) => (
            <View key={label} className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <View className="size-11 items-center justify-center rounded-2xl bg-primary/10">
                <Icon size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</Text>
                <Text className="text-base font-bold text-foreground">{value}</Text>
                <Text className="text-xs text-muted-foreground">{note}</Text>
              </View>
            </View>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5 rounded-full bg-muted/70 p-1.5">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setTab(id)}
                className={cn('flex-row items-center gap-2 rounded-full px-4 py-2.5', active ? 'border border-border/40 bg-background' : '')}>
                <Icon size={15} color={active ? colors.primary : colors.mutedForeground} />
                <Text className={cn('text-sm', active ? 'font-semibold text-primary' : 'text-muted-foreground')}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {tab === 'queue' ? (
          <View className="gap-3">
            <View className="gap-1 border-b border-border pb-3">
              <View className="flex-row items-center gap-2">
                <ClipboardCheck size={18} color={colors.primary} />
                <Text className="flex-1 text-lg font-bold text-foreground">Hàng chờ duyệt bài viết & công thức</Text>
              </View>
              <Text className="text-sm leading-5 text-muted-foreground">
                Xem xét nguyên liệu, hướng dẫn và hình ảnh. Phê duyệt bài hợp lệ hoặc từ chối kèm góp ý xây dựng. Bạn chỉ duyệt được nội dung của Member chưa bị cảnh báo/báo cáo; không thể tự duyệt bài của mình.
              </Text>
            </View>
            <ContentReviewQueue />
          </View>
        ) : null}

        {tab === 'contributions' ? (
          <View className="gap-4">
            <Shortcut icon={UtensilsCrossed} title="Công thức món chay" body="Chia sẻ bí quyết nấu các món ăn thuần chay giàu đạm thực vật, kèm định lượng và các bước chế biến chi tiết." label="Đăng công thức mới" href={'/recipes/new' as Href} primary />
            <Shortcut icon={BookOpen} title="Cẩm nang dinh dưỡng" body="Viết bài phân tích chuyên sâu về dinh dưỡng thuần thực vật (Vitamin B12, Sắt, Kẽm, Omega-3) và lối sống lành mạnh." label="Viết cẩm nang mới" href={'/articles/new' as Href} />
            <Shortcut icon={Video} title="Video ẩm thực" body="Đăng tải video ngắn hoặc clip hướng dẫn nấu ăn từ YouTube / Cloudinary để người dùng dễ theo dõi trực quan." label="Đăng video mới" href={'/videos/new' as Href} />
          </View>
        ) : null}

        {tab === 'guidelines' ? (
          <View className="gap-4">
            <View className="gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <View className="flex-row items-center gap-2">
                <CircleCheck size={18} color="#059669" />
                <Text className="flex-1 font-semibold text-emerald-800 dark:text-emerald-300">Tiêu chí Phê duyệt (Approve)</Text>
              </View>
              {[
                '100% nguyên liệu có nguồn gốc thực vật, nấm hoặc khoáng chất.',
                'Định lượng nguyên liệu và các bước thực hiện rõ ràng, an toàn.',
                'Hình ảnh tự chụp hoặc có bản quyền, chất lượng hình ảnh sắc nét.',
                'Cảnh báo rõ ràng các chất có khả năng gây dị ứng (đậu phộng, gluten, đậu nành).',
              ].map((line) => (
                <Text key={line} className="text-sm leading-5 text-muted-foreground">• {line}</Text>
              ))}
            </View>
            <View className="gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
              <View className="flex-row items-center gap-2">
                <TriangleAlert size={18} color={colors.destructive} />
                <Text className="flex-1 font-semibold text-destructive">Tiêu chí Từ chối (Reject)</Text>
              </View>
              {[
                'Có chứa thành phần nguồn gốc động vật (mật ong, gelatin, mỡ động vật...).',
                'Nội dung sao chép không nguồn, spam link tiếp thị liên kết hoặc quảng cáo rác.',
                'Hướng dẫn chế biến thiếu an toàn vệ sinh hoặc nguy hiểm.',
              ].map((line) => (
                <Text key={line} className="text-sm leading-5 text-muted-foreground">• {line}</Text>
              ))}
              <View className="flex-row items-start gap-2">
                <CircleAlert size={14} color={colors.destructive} />
                <Text className="flex-1 text-sm leading-5 text-muted-foreground">
                  <Text className="font-bold">Bắt buộc:</Text> khi duyệt hoặc từ chối phải cung cấp lý do cụ thể tối thiểu 10 ký tự.
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </SiteScreen>
  );
}
