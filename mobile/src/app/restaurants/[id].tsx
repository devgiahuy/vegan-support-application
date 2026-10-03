import * as React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Star,
  Utensils,
} from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { ErrorState, LoadingState } from '@/components/shared/state-views';
import { useRestaurantDetailQuery } from '@/features/restaurant/queries/restaurant.queries';
import { buildDirectionsUrl } from '@/lib/env';
import { getApiErrorStatus } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Chi tiết quán chay — đồng bộ `frontend/.../restaurant-detail.tsx`: tên/địa chỉ/nguồn/giá, nhãn chế độ ăn
 * (kèm trạng thái đã xác minh hay chưa), loại hình, giờ mở cửa, liên hệ, cảnh báo dữ liệu cũ và ghi nguồn.
 */
export default function RestaurantDetailScreen() {
  const colors = useIconColors();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const restaurantId = id ? safeDecode(String(id)) : '';
  const { data: restaurant, isLoading, isError, error, refetch } = useRestaurantDetailQuery(restaurantId);

  const open = (url: string) => {
    void Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <SiteScreen>
        <View className="px-5 pt-6">
          <LoadingState message="Đang tải chi tiết quán chay..." />
        </View>
      </SiteScreen>
    );
  }

  if (isError || !restaurant || !restaurant.id) {
    return (
      <SiteScreen>
        <View className="px-5 pt-6">
          <ErrorState
            title={getApiErrorStatus(error) === 404 ? 'Không tìm thấy quán chay.' : 'Không tải được chi tiết quán.'}
            onRetry={() => void refetch()}
          />
        </View>
      </SiteScreen>
    );
  }

  const directionsUrl =
    restaurant.lat !== null && restaurant.lng !== null ? buildDirectionsUrl(restaurant.lat, restaurant.lng) : '';

  return (
    <SiteScreen>
      <View className="gap-4 px-5 pt-4">
        {restaurant.thumbnailUrl ? (
          <View className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
            <Image source={{ uri: restaurant.thumbnailUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          </View>
        ) : null}

        <View className="gap-2">
          <View className="flex-row flex-wrap items-center gap-1.5">
            <View className="rounded-full border border-border px-2.5 py-1">
              <Text className="text-xs text-foreground">{restaurant.sourceLabel}</Text>
            </View>
            {restaurant.price ? (
              <View className="rounded-full bg-primary/10 px-2.5 py-1">
                <Text className="text-xs font-semibold text-primary">{restaurant.price}</Text>
              </View>
            ) : null}
            {restaurant.rating !== null ? (
              <View className="flex-row items-center gap-1">
                <Star size={13} color={colors.cta} fill={colors.cta} />
                <Text className="text-xs font-semibold text-foreground">{restaurant.rating.toFixed(1)}</Text>
                {restaurant.reviewCount !== null ? (
                  <Text className="text-xs text-muted-foreground">({restaurant.reviewCount} đánh giá)</Text>
                ) : null}
              </View>
            ) : null}
          </View>

          <Text className="text-2xl font-extrabold tracking-tight text-foreground">{restaurant.name}</Text>

          <View className="flex-row items-start gap-1.5">
            <MapPin size={16} color={colors.primary} />
            <Text className="flex-1 text-sm text-muted-foreground">
              {restaurant.address}
              {restaurant.distanceLabel ? ` · Cách bạn ${restaurant.distanceLabel}` : ''}
            </Text>
          </View>
        </View>

        {directionsUrl || restaurant.mapsUrl ? (
          <View className="flex-row gap-2">
            {directionsUrl ? (
              <Pressable
                onPress={() => open(directionsUrl)}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-primary py-3">
                <Navigation size={15} color={colors.primaryForeground} />
                <Text className="text-sm font-semibold text-primary-foreground">Chỉ đường</Text>
              </Pressable>
            ) : null}
            {restaurant.mapsUrl ? (
              <Pressable
                onPress={() => open(restaurant.mapsUrl as string)}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-input py-3">
                <ExternalLink size={15} color={colors.foreground} />
                <Text className="text-sm font-semibold text-foreground">Xem trên bản đồ</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View className="gap-2 rounded-2xl border border-border bg-card p-4">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Chế độ ăn của quán
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {restaurant.dietTagLabels.length > 0 ? (
              restaurant.dietTagLabels.map((label) => (
                <View key={label} className="rounded-full bg-primary/10 px-2.5 py-1">
                  <Text className="text-xs font-medium text-primary">{label}</Text>
                </View>
              ))
            ) : (
              <Text className="text-sm text-muted-foreground">Chưa có thông tin chế độ ăn.</Text>
            )}
          </View>
          <View
            className={
              restaurant.dietaryReviewed
                ? 'flex-row items-start gap-2 rounded-xl bg-primary/5 p-3'
                : 'flex-row items-start gap-2 rounded-xl bg-amber-500/10 p-3'
            }>
            {restaurant.dietaryReviewed ? (
              <ShieldCheck size={15} color={colors.primary} />
            ) : (
              <AlertTriangle size={15} color="#b45309" />
            )}
            <Text className="flex-1 text-xs leading-relaxed text-muted-foreground">
              {restaurant.dietaryReviewed
                ? 'Thông tin chế độ ăn đã được quản trị viên VeggieConnect xem xét.'
                : 'Thông tin chế độ ăn chưa được VeggieConnect xác minh — hãy hỏi quán về nguyên liệu và cách chế biến trước khi dùng, nhất là khi bạn có dị ứng.'}
            </Text>
          </View>
          {restaurant.matchReasonLabels.length > 0 ? (
            <Text className="text-[11px] text-muted-foreground">
              Căn cứ gợi ý: {restaurant.matchReasonLabels.join(' · ')}
            </Text>
          ) : null}
        </View>

        {restaurant.categories.length > 0 ? (
          <View className="gap-2 rounded-2xl border border-border bg-card p-4">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Loại hình & món
            </Text>
            <View className="gap-2">
              {restaurant.categories.map((category) => (
                <View key={category} className="flex-row items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
                  <Utensils size={14} color={colors.primary} />
                  <Text className="flex-1 text-sm font-medium text-foreground">{category}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-start gap-2">
            <Clock size={16} color={colors.foreground} />
            <Text className="flex-1 text-sm text-foreground">{restaurant.openState ?? 'Chưa rõ trạng thái mở cửa'}</Text>
          </View>
          {restaurant.openingHours.length > 0 ? (
            <View className="gap-1 border-t border-border pt-3">
              {restaurant.openingHours.map((entry) => (
                <View key={entry.dayLabel} className="flex-row justify-between gap-3">
                  <Text className="text-xs text-muted-foreground">{entry.dayLabel}</Text>
                  <Text className="flex-1 text-right text-xs font-medium text-foreground">{entry.hours}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {restaurant.phone ? (
            <Pressable onPress={() => open(`tel:${restaurant.phone}`)} className="flex-row items-center gap-2">
              <Phone size={16} color={colors.foreground} />
              <Text className="text-sm text-foreground underline">{restaurant.phone}</Text>
            </Pressable>
          ) : null}
          {restaurant.website ? (
            <Pressable onPress={() => open(restaurant.website as string)} className="flex-row items-center gap-2">
              <Globe size={16} color={colors.foreground} />
              <Text numberOfLines={1} className="flex-1 text-sm text-primary underline">
                {restaurant.website}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {restaurant.isStale ? (
          <View className="flex-row items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <AlertTriangle size={15} color="#b45309" />
            <Text className="flex-1 text-xs leading-relaxed text-amber-800">
              Thông tin quán được ghi nhận hơn 30 ngày trước. Giờ mở cửa hoặc thực đơn có thể đã thay đổi, vui lòng
              liên hệ quán trước khi đến.
            </Text>
          </View>
        ) : null}

        <Text className="border-t border-border pt-3 text-[11px] text-muted-foreground">
          Nguồn dữ liệu: {restaurant.attribution || restaurant.sourceLabel}.
          {restaurant.fetchedAt ? ` Cập nhật lần cuối: ${restaurant.fetchedAt.toLocaleDateString('vi-VN')}.` : ''}
        </Text>
      </View>
    </SiteScreen>
  );
}
