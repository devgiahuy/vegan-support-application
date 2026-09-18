import { Alert, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Leaf,
  MapPin,
  Navigation,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RecipeCard } from '@/features/recipe/components/recipe-card';
import { useRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { useIconColors } from '@/lib/theme-colors';

const STATS = [
  { icon: UtensilsCrossed, value: '500+', label: 'Món thuần Việt' },
  { icon: MapPin, value: '50+', label: 'Quán verified' },
  { icon: TrendingUp, value: '100%', label: 'Đo Calo & Đạm' },
];

/** Các tính năng chưa dựng màn hình thật — chỉ báo "sắp ra mắt" thay vì điều hướng vỡ route. */
function notifyComingSoon(feature: string) {
  Alert.alert('Sắp ra mắt', `${feature} đang được VeggieConnect hoàn thiện, quay lại sau nhé!`);
}

/**
 * Trang chủ mobile — bố cục & nội dung đồng bộ `frontend/src/app/(site)/page.tsx`
 * (Hero → Món xu hướng → AI chat & Thực đơn tuần → Quán chay). Phần Hero Remotion,
 * "Gợi ý cho bạn" (recommendation) và bản đồ quán ăn thật chưa dựng ở mobile —
 * xem TODO tương ứng bên dưới.
 */
export default function HomeScreen() {
  const colors = useIconColors();
  const { data: recipesPagination, isLoading, isError } = useRecipesQuery({ limit: 4 });
  const recipes = recipesPagination?.items ?? [];

  return (
    <SiteScreen
      fab={
        <Pressable
          onPress={() => notifyComingSoon('Trợ lý AI dinh dưỡng')}
          className="absolute bottom-5 right-5 flex-row items-center gap-2 rounded-full bg-primary px-4 py-3 shadow-lg">
          <Sparkles size={16} color={colors.primaryForeground} />
          <Text className="text-sm font-semibold text-primary-foreground">Hỏi AI nhanh</Text>
        </Pressable>
      }>
      {/* Hero */}
      <View className="px-5 pt-4">
        <View className="flex-row items-center gap-1.5 self-start rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5">
          <Leaf size={13} color={colors.primary} />
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            Ứng dụng hỗ trợ ăn chay #1 tại Việt Nam
          </Text>
        </View>

        <Text className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground">
          Ăn chay <Text className="text-primary">đủ chất,</Text>
        </Text>
        <Text className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">
          dễ dàng mỗi ngày
        </Text>

        <Text className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Khám phá hàng trăm món chay thuần Việt chuẩn vị, tự động tính toán đạm & calo cùng trợ lý
          AI dinh dưỡng thông minh cá nhân hoá theo thể trạng của bạn.
        </Text>

        <View className="mt-5 gap-2.5">
          <Link href="/recipes" asChild>
            <PrimaryButton
              label="Tìm công thức ngay"
              icon={<UtensilsCrossed size={16} color={colors.primaryForeground} />}
            />
          </Link>
          <PrimaryButton
            label="Hỏi AI Dinh dưỡng"
            variant="outline"
            icon={<Sparkles size={16} color={colors.cta} />}
            onPress={() => notifyComingSoon('Trợ lý AI dinh dưỡng')}
          />
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
              <s.icon size={16} color={colors.primary} />
              <Text className="text-lg font-bold text-primary">{s.value}</Text>
              <Text className="text-[11px] text-foreground">{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* TODO(recommendation): khối "Gợi ý cho bạn" (behavioral, cần consent + feature
          recommendation riêng) chưa dựng ở mobile — frontend: RecommendedForYou. */}

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

      {/* AI chat teaser */}
      <View className="mt-8 px-5">
        <View className="rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center gap-2.5">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-cta/15">
              <Sparkles size={16} color={colors.cta} />
            </View>
            <View>
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-cta">
                ChayXanh AI Chat
              </Text>
              <Text className="text-base font-bold text-foreground">Hỏi AI Dinh Dưỡng Thực Vật</Text>
            </View>
          </View>

          <View className="mt-3.5 rounded-xl border border-border bg-muted/40 p-3">
            <Text className="text-xs font-semibold text-foreground">Gợi ý hoàn hảo cho bạn:</Text>
            <Text className="mt-1.5 text-sm font-medium text-foreground">
              Canh bí đỏ hầm đậu hũ non & hạt phỉ
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              Nấu chỉ 18 phút. Cung cấp 17.5g protein thực vật, giàu Vitamin A và kẽm.
            </Text>
          </View>

          <View className="mt-3.5">
            <PrimaryButton
              label="Hỏi bất kỳ nguyên liệu hoặc mục tiêu..."
              variant="outline"
              icon={<ArrowRight size={15} color={colors.foreground} />}
              onPress={() => notifyComingSoon('Trợ lý AI dinh dưỡng')}
            />
          </View>
        </View>
      </View>

      {/* Weekly meal plan teaser */}
      <View className="mt-4 px-5">
        <View className="rounded-2xl border border-border bg-card p-4">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Kế hoạch ăn uống
          </Text>
          <Text className="mt-0.5 text-base font-bold text-foreground">Thực đơn tuần cân bằng</Text>

          <View className="mt-3.5 gap-2.5">
            <View className="flex-row items-center justify-between rounded-xl border border-border p-3">
              <View className="flex-1 pr-2">
                <Text className="text-xs text-muted-foreground">☀️ Bữa trưa thuần khiết</Text>
                <Text className="text-sm font-medium text-foreground">
                  Cơm gạo lứt + Nấm kho tiêu + Canh cải bẹ xanh
                </Text>
              </View>
              <Text className="text-xs font-semibold text-foreground">480 kcal</Text>
            </View>
            <View className="flex-row items-center justify-between rounded-xl border border-border p-3">
              <View className="flex-1 pr-2">
                <Text className="text-xs text-muted-foreground">🌙 Bữa tối thanh nhẹ</Text>
                <Text className="text-sm font-medium text-foreground">
                  Phở nấm rơm rau củ quả ngọt lành
                </Text>
              </View>
              <Text className="text-xs font-semibold text-foreground">320 kcal</Text>
            </View>
          </View>

          <View className="mt-3.5">
            <PrimaryButton
              label="Tạo thực đơn 7 ngày của riêng bạn"
              icon={<CalendarDays size={16} color={colors.primaryForeground} />}
              onPress={() => notifyComingSoon('Thực đơn tuần')}
            />
          </View>
        </View>
      </View>

      {/* Restaurants teaser */}
      <View className="mt-4 px-5">
        <View className="flex-row items-center gap-1.5">
          <MapPin size={14} color={colors.primary} />
          <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
            Bản đồ ẩm thực
          </Text>
        </View>
        <Text className="mt-1 text-xl font-bold text-foreground">Khám phá quán chay quanh bạn</Text>

        <View className="mt-3.5 items-center rounded-2xl border border-dashed border-border p-6">
          <Text className="text-center font-semibold text-foreground">
            Đang hoàn thiện bản đồ quán chay
          </Text>
          <Text className="mt-1 text-center text-sm text-muted-foreground">
            Danh sách quán ăn sẽ hiển thị ngay khi API địa điểm sẵn sàng.
          </Text>
          <View className="mt-4 w-full">
            <PrimaryButton
              label="Mở bản đồ quán ăn"
              variant="outline"
              icon={<Navigation size={16} color={colors.foreground} />}
              onPress={() => notifyComingSoon('Bản đồ quán chay')}
            />
          </View>
        </View>
      </View>
    </SiteScreen>
  );
}
