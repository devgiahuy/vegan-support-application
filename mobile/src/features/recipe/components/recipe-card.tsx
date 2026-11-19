import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { Clock, Flame } from 'lucide-react-native';
import { ImageBadge } from '@/components/ui/image-badge';
import { FALLBACK_RECIPE_COVER_URL } from '@/lib/env';
import { useIconColors } from '@/lib/theme-colors';
import type { Recipe } from '../types/recipe.model';
import { formatIneligibilityReason } from '../utils/recipe-eligibility';

/**
 * Card công thức tối ưu cho điện thoại:
 * - `grid` (mặc định, dùng trong lưới 2 cột): ảnh 4:3 kèm badge thời gian, tên món tối đa 2 dòng và năng lượng.
 * - `row` (dùng cho danh sách xem trước gọn trên Trang chủ): ảnh thu nhỏ bên trái, tên món và thời gian/calo bên phải.
 */
export function RecipeCard({
  recipe,
  className,
  variant = 'grid',
}: {
  recipe: Recipe;
  className?: string;
  variant?: 'grid' | 'row';
}) {
  const colors = useIconColors();
  const [imageFailed, setImageFailed] = React.useState(false);
  const imageUri = !imageFailed && recipe.coverImageUrl ? recipe.coverImageUrl : FALLBACK_RECIPE_COVER_URL;
  const minutes = recipe.totalTimeMinutes;
  const kcal = recipe.nutrition.calories;

  if (variant === 'row') {
    return (
      <Link href={`/recipes/${recipe.id}` as Href} asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={recipe.title}
          className={`min-h-[88px] flex-row items-center gap-3.5 rounded-2xl border border-border bg-card p-2.5 active:bg-muted/50 ${className ?? ''}`}>
          <View className="overflow-hidden rounded-xl bg-muted" style={{ width: 80, height: 72 }}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                onError={() => setImageFailed(true)}
              />
            ) : null}
          </View>

          <View className="min-w-0 flex-1 gap-1.5">
            <Text numberOfLines={2} className="text-sm font-bold leading-snug text-foreground">
              {recipe.title}
            </Text>
            <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
              <View className="flex-row items-center gap-1">
                <Clock size={12} color={colors.mutedForeground} />
                <Text className="text-xs text-muted-foreground">{minutes} phút</Text>
              </View>
              {kcal !== null && kcal > 0 ? (
                <View className="flex-row items-center gap-1">
                  <Flame size={12} color={colors.mutedForeground} />
                  <Text className="text-xs text-muted-foreground">{kcal} kcal</Text>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
      </Link>
    );
  }

  return (
    <Link href={`/recipes/${recipe.id}` as Href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={recipe.title}
        className={`overflow-hidden rounded-2xl border border-border bg-card active:opacity-90 ${className ?? ''}`}>
        <View className="relative aspect-[4/3] bg-muted">
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              onError={() => setImageFailed(true)}
            />
          ) : null}
          <ImageBadge
            label={`${minutes} phút`}
            icon={(color) => <Clock size={12} color={color} />}
            style={{ position: 'absolute', left: 10, top: 10 }}
          />
        </View>

        <View className="flex-1 gap-1.5 p-3">
          <Text numberOfLines={2} className="text-sm font-bold leading-snug text-foreground">
            {recipe.title}
          </Text>

          {kcal !== null && kcal > 0 ? (
            <View className="flex-row items-center gap-1">
              <Flame size={13} color={colors.mutedForeground} />
              <Text className="text-xs text-muted-foreground">{kcal} kcal</Text>
            </View>
          ) : null}

          {recipe.eligibility && !recipe.eligibility.eligible ? (
            <View className="mt-1 gap-1 rounded-lg bg-destructive/5 p-2">
              {recipe.eligibility.reasons.slice(0, 2).map((reason) => (
                <Text key={reason.code} numberOfLines={2} className="text-xs leading-snug text-destructive">
                  {formatIneligibilityReason(reason)}
                </Text>
              ))}
              {recipe.eligibility.reasons.length > 2 ? (
                <Text className="text-xs text-muted-foreground">
                  +{recipe.eligibility.reasons.length - 2} lý do khác
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}
