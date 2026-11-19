import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { ChevronRight, CircleHelp, Clock, Flame, Sparkles } from 'lucide-react-native';

import { FALLBACK_RECIPE_COVER_URL } from '@/lib/env';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';
import { useHomeRecommendationsQuery } from '../queries/recommendation.queries';
import { WhyRecommendedSheet } from './why-recommended-sheet';
import type { Recommendation, RecommendationMeta } from '../types/recommendation.model';

/** Dòng ngữ cảnh chấm điểm: gợi ý riêng kèm ràng buộc đã lọc, hoặc gợi ý phổ biến khi chưa cá nhân hóa (đồng bộ web). */
function constraintsNote(meta: RecommendationMeta | undefined): string {
  if (!meta) return '';
  if (!meta.personalized) return 'Gợi ý phổ biến cho mọi người';
  return `Phù hợp hồ sơ ăn uống${meta.constraintsSummary ? ` · ${meta.constraintsSummary}` : ''}`;
}

/**
 * Thẻ gợi ý dạng hàng ngang gọn nhẹ cho Trang chủ: ảnh món, tên món (tối đa 2 dòng),
 * thời gian nấu, năng lượng và tối đa 1 nhãn lý do.
 */
function RecommendationCard({ item }: { item: Recommendation }) {
  const colors = useIconColors();
  const [imageFailed, setImageFailed] = React.useState(false);
  const source = !imageFailed && item.coverImageUrl ? item.coverImageUrl : FALLBACK_RECIPE_COVER_URL;

  return (
    <Link href={`/recipes/${item.id}` as Href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xem công thức ${item.title}`}
        className="min-h-[88px] flex-row items-center gap-3.5 rounded-2xl border border-border bg-card p-2.5 active:bg-muted/50">
        <View className="overflow-hidden rounded-xl bg-muted" style={{ width: 80, height: 72 }}>
          {source ? (
            <Image
              source={{ uri: source }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              onError={() => setImageFailed(true)}
            />
          ) : null}
        </View>

        <View className="min-w-0 flex-1 gap-1.5">
          <Text numberOfLines={2} className="text-sm font-bold leading-snug text-foreground">
            {item.title}
          </Text>

          <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
            {item.cookTimeMinutes > 0 ? (
              <View className="flex-row items-center gap-1">
                <Clock size={12} color={colors.mutedForeground} />
                <Text className="text-xs text-muted-foreground">{item.cookTimeMinutes} phút</Text>
              </View>
            ) : null}
            {item.calories !== null ? (
              <View className="flex-row items-center gap-1">
                <Flame size={12} color={colors.mutedForeground} />
                <Text className="text-xs text-muted-foreground">{item.calories} kcal</Text>
              </View>
            ) : null}
          </View>

          {item.reasonLabels.length > 0 ? (
            <View className="self-start rounded-full bg-primary/10 px-2.5 py-0.5">
              <Text numberOfLines={1} className="text-xs font-medium text-primary">
                {item.reasonLabels[0]}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

/**
 * Khối gợi ý ở trang chủ — hiển thị tối đa 3 món gọn cho thành viên đã đăng nhập,
 * có lối dẫn "Xem tất cả" sang Khám phá và giải thích cách chọn gợi ý.
 */
export function RecommendedForYou() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data, isLoading, isError } = useHomeRecommendationsQuery({ limit: 3 });
  const [whyOpen, setWhyOpen] = React.useState(false);

  if (!isAuthenticated) return null;
  if (!isLoading && (isError || !data)) return null;

  const items = data?.items ?? [];

  return (
    <View className="mt-7 px-5">
      <View className="flex-row items-end justify-between gap-2">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-1.5">
            <Sparkles size={14} color={colors.primary} />
            <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
              Gợi ý cho bạn
            </Text>
          </View>
          <Text className="mt-0.5 text-lg font-bold text-foreground">Món chay hợp khẩu vị</Text>
        </View>

        <Link href={'/recipes' as Href} asChild>
          <Pressable
            accessibilityRole="link"
            hitSlop={6}
            className="min-h-11 flex-row items-center gap-0.5 px-1">
            <Text className="text-xs font-semibold text-primary">Xem tất cả</Text>
            <ChevronRight size={14} color={colors.primary} />
          </Pressable>
        </Link>
      </View>

      {data ? (
        <View className="mt-1 flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <Text className="text-xs text-muted-foreground">{constraintsNote(data.meta)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Vì sao tôi thấy gợi ý này?"
            onPress={() => setWhyOpen(true)}
            hitSlop={8}
            className="min-h-8 flex-row items-center gap-1">
            <CircleHelp size={13} color={colors.primary} />
            <Text className="text-xs font-semibold text-primary">Vì sao?</Text>
          </Pressable>
        </View>
      ) : null}

      <View className="mt-3 gap-2.5">
        {isLoading ? (
          [1, 2].map((index) => (
            <View key={index} className="h-[88px] w-full rounded-2xl border border-border bg-muted" />
          ))
        ) : items.length === 0 ? (
          <View className="w-full rounded-2xl border border-dashed border-border p-4">
            <Text className="text-sm font-semibold text-foreground">Chưa có gợi ý phù hợp</Text>
            <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Không còn món nào hợp với thiết lập ăn hiện tại. Hãy khám phá thêm hoặc kiểm tra bộ lọc ăn uống.
            </Text>
          </View>
        ) : (
          items.slice(0, 3).map((item) => <RecommendationCard key={item.id} item={item} />)
        )}
      </View>
      {whyOpen ? <WhyRecommendedSheet meta={data?.meta} onClose={() => setWhyOpen(false)} /> : null}
    </View>
  );
}
