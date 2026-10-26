import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { ArrowRight, Clock, Flame, Sparkles, Star } from 'lucide-react-native';

import { ImageBadge } from '@/components/ui/image-badge';
import { FALLBACK_RECIPE_COVER_URL } from '@/lib/env';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';
import { useHomeRecommendationsQuery } from '../queries/recommendation.queries';
import type { Recommendation, RecommendationMeta } from '../types/recommendation.model';

/** Dòng ngữ cảnh chấm điểm: gợi ý riêng kèm ràng buộc đã lọc, hoặc gợi ý phổ biến khi chưa cá nhân hóa (đồng bộ web). */
function constraintsNote(meta: RecommendationMeta | undefined): string {
  if (!meta) return '';
  const version = meta.scoringVersion ? ` · ${meta.scoringVersion}` : '';
  if (!meta.personalized) return `Gợi ý phổ biến cho mọi người${version}`;
  return `Gợi ý dành riêng cho bạn${version}${meta.constraintsSummary ? ` · ${meta.constraintsSummary}` : ''}`;
}

/**
 * Một món gợi ý, cùng kích thước và bố cục với `RecipeCard` (lưới 2 cột): ảnh 4:3 kèm thời gian, calo/đánh giá,
 * tên món, tối đa 2 chip lý do.
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
        className="w-[47%] overflow-hidden rounded-2xl border border-border bg-card">
        <View className="relative aspect-[4/3] bg-muted">
          {source ? (
            <Image
              source={{ uri: source }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              onError={() => setImageFailed(true)}
            />
          ) : null}
          {item.cookTimeMinutes > 0 ? (
            <ImageBadge
              label={`${item.cookTimeMinutes} phút`}
              icon={(color) => <Clock size={12} color={color} />}
              style={{ position: 'absolute', left: 10, top: 10 }}
            />
          ) : null}
        </View>

        <View className="gap-2 p-3.5">
          {item.calories !== null || item.ratingCount > 0 ? (
            <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
              {item.calories !== null ? (
                <View className="flex-row items-center gap-1">
                  <Flame size={13} color={colors.mutedForeground} />
                  <Text className="text-xs text-muted-foreground">{item.calories} kcal</Text>
                </View>
              ) : null}
              {item.ratingCount > 0 ? (
                <View className="flex-row items-center gap-1">
                  <Star size={12} color="#fbbf24" fill="#fbbf24" />
                  <Text className="text-xs text-muted-foreground">
                    {item.ratingAverage.toFixed(1)} ({item.ratingCount})
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <Text numberOfLines={2} className="text-sm font-semibold leading-snug text-foreground">
            {item.title}
          </Text>

          {item.reasonLabels.length > 0 ? (
            <View className="flex-row flex-wrap gap-1">
              {item.reasonLabels.slice(0, 2).map((label) => (
                <View key={label} className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5">
                  <Text className="text-[10px] font-medium text-primary">{label}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View className="mt-1 flex-row items-center justify-between border-t border-border pt-2.5">
            <Text numberOfLines={1} className="flex-1 text-xs font-medium text-muted-foreground">
              Xem công thức
            </Text>
            <ArrowRight size={14} color={colors.mutedForeground} />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

/**
 * Khối gợi ý ở trang chủ — đồng bộ `RecommendedForYou` của web: chỉ dành cho thành viên đã đăng nhập (khách và lỗi tải
 * thì ẩn hẳn), có skeleton khi tải và thông báo khi không còn món hợp lệ. Bật/tắt cá nhân hóa nằm ở Hồ sơ.
 */
export function RecommendedForYou() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data, isLoading, isError } = useHomeRecommendationsQuery({ limit: 4 });

  if (!isAuthenticated) return null;
  if (!isLoading && (isError || !data)) return null;

  const items = data?.items ?? [];

  return (
    <View className="mt-8 px-5">
      <View className="flex-row items-center gap-1.5">
        <Sparkles size={14} color={colors.primary} />
        <Text className="text-xs font-semibold uppercase tracking-wide text-primary">Dành riêng cho bạn</Text>
      </View>
      <Text className="mt-1 text-xl font-bold text-foreground">Món chay hợp khẩu vị</Text>
      {data ? <Text className="mt-1 text-xs text-muted-foreground">{constraintsNote(data.meta)}</Text> : null}

      <View className="mt-4 flex-row flex-wrap gap-3">
        {isLoading ? (
          [1, 2].map((index) => (
            <View key={index} className="h-52 w-[47%] rounded-2xl border border-border bg-muted" />
          ))
        ) : items.length === 0 ? (
          <View className="w-full rounded-2xl border border-dashed border-border p-5">
            <Text className="font-semibold text-foreground">Chưa có gợi ý phù hợp</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Không còn món nào hợp với luật ăn hiện tại của bạn. Hãy nới lỏng bộ lọc hoặc khám phá thêm các món chay khác.
            </Text>
          </View>
        ) : (
          items.slice(0, 4).map((item) => <RecommendationCard key={item.id} item={item} />)
        )}
      </View>
    </View>
  );
}
