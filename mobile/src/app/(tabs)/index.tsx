import { Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import {
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Layers,
  Leaf,
  MapPin,
  Navigation,
  Scale,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RecommendedForYou } from '@/features/recommendation/components/recommended-for-you';
import { RecipeCard } from '@/features/recipe/components/recipe-card';
import { useRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { useIconColors } from '@/lib/theme-colors';

const STATS = [
  { icon: UtensilsCrossed, value: '500+', label: 'Món thuần Việt' },
  { icon: MapPin, value: '50+', label: 'Quán verified' },
  { icon: TrendingUp, value: '100%', label: 'Đo Calo & Đạm' },
];

/** Bốn lối vào tra cứu dinh dưỡng — đồng bộ khối "Tra cứu Dinh dưỡng & Kiến thức Khoa học" của web. */
const KNOWLEDGE_CARDS: {
  tab: 'INGREDIENT' | 'INTERACTION' | 'COOKING' | 'INTAKE';
  icon: LucideIcon;
  title: string;
  description: string;
  action: string;
}[] = [
  {
    tab: 'INGREDIENT',
    icon: Scale,
    title: 'Dinh dưỡng chuẩn 100g',
    description: 'Đạm, béo, xơ và vi chất, minh bạch nguồn kiểm định.',
    action: 'Tra cứu ngay',
  },
  {
    tab: 'INTERACTION',
    icon: Layers,
    title: 'Kiêng kỵ thực phẩm',
    description: 'Quy tắc phối hợp nguyên liệu: cùng món, cùng bữa, cùng ngày.',
    action: 'Xem quy tắc',
  },
  {
    tab: 'COOKING',
    icon: ChefHat,
    title: 'Phương pháp nấu nướng',
    description: 'Hệ số hao hụt khối lượng và bảo tồn vi chất khi luộc, hấp, xào.',
    action: 'Khám phá',
  },
  {
    tab: 'INTAKE',
    icon: ShieldAlert,
    title: 'Nhu cầu khuyến nghị & UL',
    description: 'Chuẩn RDA/AI hằng ngày và giới hạn dung nạp tối đa theo nhóm đối tượng.',
    action: 'Đối chiếu',
  },
];

/**
 * Trang chủ mobile — bố cục & nội dung đồng bộ `frontend/src/app/(site)/page.tsx`
 * (Hero → Gợi ý cho bạn → Món xu hướng → Tra cứu dinh dưỡng → Quán chay). Hero Remotion
 * của web không có ở mobile. Các khối AI chat / thực đơn tuần viết cứng đã bị bỏ giống web.
 */
export default function HomeScreen() {
  const colors = useIconColors();
  const { data: recipesPagination, isLoading, isError } = useRecipesQuery({ limit: 4 });
  const recipes = recipesPagination?.items ?? [];

  return (
    <SiteScreen showFooter>
      {/* Hero */}
      <View className="px-5 pt-4">
        <View className="flex-row items-center gap-1.5 self-start rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5">
          <Leaf size={13} color={colors.primary} />
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            Ứng dụng hỗ trợ ăn chay #1 tại Việt Nam
          </Text>
        </View>

        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-foreground">
          Ăn chay <Text className="text-primary">đủ chất,</Text> dễ dàng mỗi ngày
        </Text>

        <Text className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Khám phá hàng trăm món chay thuần Việt chuẩn vị, tự động tính toán đạm & calo cùng trợ lý
          AI dinh dưỡng thông minh cá nhân hoá theo thể trạng của bạn.
        </Text>

        <View className="mt-5 gap-2.5">
          <Link href={'/recipes' as Href} asChild>
            <PrimaryButton
              label="Tìm công thức ngay"
              icon={<UtensilsCrossed size={16} color={colors.primaryForeground} />}
            />
          </Link>
          <Link href={'/assistant' as Href} asChild>
            <PrimaryButton
              label="Hỏi AI Dinh dưỡng"
              variant="outline"
              icon={<Sparkles size={16} color={colors.cta} />}
            />
          </Link>
        </View>

        <View className="mt-4 flex-row flex-wrap items-center gap-x-3 gap-y-1">
          <View className="flex-row items-center gap-1">
            <CheckCircle2 size={13} color={colors.primary} />
            <Text className="text-xs font-medium text-primary">Miễn phí 100%</Text>
          </View>
          <Text className="text-xs text-muted-foreground">• Cá nhân hóa theo thể trạng</Text>
        </View>

        <View className="mt-6 flex-row gap-2.5 border-t border-border pt-5">
          {STATS.map((s) => (
            <View key={s.label} className="flex-1 gap-1.5 rounded-2xl border border-border bg-card p-3">
              <View className="flex-row items-center gap-1.5">
                <s.icon size={16} color={colors.primary} />
                <Text className="text-lg font-bold text-primary">{s.value}</Text>
              </View>
              <Text className="text-[11px] text-foreground">{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <RecommendedForYou />

      {/* Popular recipes */}
      <View className="mt-8 px-5">
        <View className="flex-row items-center gap-1.5">
          <TrendingUp size={14} color={colors.cta} />
          <Text className="text-xs font-semibold uppercase tracking-wide text-cta">
            Xu hướng tuần này
          </Text>
        </View>
        <Text className="mt-1 text-xl font-bold text-foreground">Món chay được yêu thích nhất</Text>

        <View className="mt-4 flex-row flex-wrap gap-3">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <View key={i} className="h-52 w-[47%] rounded-2xl border border-border bg-muted" />
            ))
          ) : isError ? (
            <View className="w-full items-center rounded-2xl border border-dashed border-border p-6">
              <Text className="text-center text-sm text-muted-foreground">
                Không tải được danh sách công thức. Kiểm tra kết nối mạng và thử lại.
              </Text>
            </View>
          ) : recipes.length === 0 ? (
            <View className="w-full items-center rounded-2xl border border-dashed border-border p-6">
              <Text className="text-center font-semibold text-foreground">Chưa có công thức nào</Text>
              <Text className="mt-1 text-center text-sm text-muted-foreground">
                Hãy là người đầu tiên chia sẻ món chay của bạn với cộng đồng.
              </Text>
            </View>
          ) : (
            recipes.map((r) => <RecipeCard key={r.id} recipe={r} className="w-[47%]" />)
          )}
        </View>
      </View>

      {/* Tra cứu dinh dưỡng & kiến thức khoa học */}
      <View className="mt-8 px-5">
        <View className="flex-row items-center gap-1.5">
          <Layers size={14} color={colors.primary} />
          <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
            Cơ sở dữ liệu chuẩn hóa
          </Text>
        </View>
        <Text className="mt-1 text-xl font-bold text-foreground">Tra cứu dinh dưỡng & kiến thức</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Số liệu 100g có nguồn gốc, quy tắc kiêng kỵ và phương pháp bảo tồn vi chất.
        </Text>

        <View className="mt-4 flex-row flex-wrap gap-3">
          {KNOWLEDGE_CARDS.map((card) => (
            <Link key={card.tab} href={`/food-data?tab=${card.tab}` as Href} asChild>
              <Pressable className="w-[47%] justify-between rounded-2xl border border-border bg-card p-4">
                <View>
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <card.icon size={18} color={colors.primary} />
                  </View>
                  <Text className="mt-3 text-sm font-bold text-foreground">{card.title}</Text>
                  <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">{card.description}</Text>
                </View>
                <View className="mt-3 flex-row items-center gap-1">
                  <Text className="text-xs font-semibold text-primary">{card.action}</Text>
                  <ArrowRight size={13} color={colors.primary} />
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>

      {/* Restaurants */}
      <View className="mt-8 px-5">
        <View className="flex-row items-center gap-1.5">
          <MapPin size={14} color={colors.primary} />
          <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
            Bản đồ ẩm thực
          </Text>
        </View>
        <Text className="mt-1 text-xl font-bold text-foreground">Khám phá quán chay quanh bạn</Text>

        <View className="mt-3.5 rounded-2xl border border-border bg-card p-4">
          <Text className="text-sm text-muted-foreground">
            Cho phép vị trí hoặc nhập địa chỉ để xem quán chay gần bạn và tìm theo món.
          </Text>
          <View className="mt-4">
            <Link href={'/restaurants' as Href} asChild>
              <PrimaryButton
                label="Mở bản đồ quán"
                variant="outline"
                icon={<Navigation size={16} color={colors.foreground} />}
              />
            </Link>
          </View>
        </View>
      </View>
    </SiteScreen>
  );
}
