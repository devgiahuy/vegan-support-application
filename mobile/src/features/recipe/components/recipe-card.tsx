import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { ArrowRight, Clock, Flame } from 'lucide-react-native';
import { ImageBadge } from '@/components/ui/image-badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { FALLBACK_RECIPE_COVER_URL } from '@/lib/env';
import { useIconColors } from '@/lib/theme-colors';
import type { Recipe } from '../types/recipe.model';
import { formatIneligibilityReason } from '../utils/recipe-eligibility';

/**
 * Card công thức cho danh sách (Trang chủ, Khám phá món), đồng bộ bố cục với
 * `frontend/src/features/recipe/components/recipe-card.tsx` (ảnh 4:3, badge thời gian,
 * tiêu đề, calo/đạm, tác giả). Bấm vào mở `/recipes/[id]`.
 */
export function RecipeCard({ recipe, className }: { recipe: Recipe; className?: string }) {
  const colors = useIconColors();
  const [imageFailed, setImageFailed] = React.useState(false);
  const imageUri = !imageFailed && recipe.coverImageUrl ? recipe.coverImageUrl : FALLBACK_RECIPE_COVER_URL;
  const minutes = recipe.totalTimeMinutes;
  const kcal = recipe.nutrition.calories;
  const protein = recipe.nutrition.protein;

  return (
    <Link href={`/recipes/${recipe.id}` as Href} asChild>
      <Pressable
        className={`overflow-hidden rounded-2xl border border-border bg-card ${className ?? ''}`}>
        <View className="relative aspect-[4/3]">
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              onError={() => setImageFailed(true)}
            />
          ) : null}
          {/* Nhãn thời gian: nền/chữ theo theme, đọc được cả chế độ sáng lẫn tối. */}
          <ImageBadge
            label={`${minutes} phút`}
            icon={(color) => <Clock size={12} color={color} />}
            style={{ position: 'absolute', left: 10, top: 10 }}
          />
        </View>

        <View className="flex-1 gap-2 p-3.5">
          <View className="flex-row items-center gap-3">
            {kcal !== null && kcal > 0 ? (
              <View className="flex-row items-center gap-1">
                <Flame size={13} color={colors.mutedForeground} />
                <Text className="text-xs text-muted-foreground">
                  {kcal} kcal{protein !== null && protein > 0 ? ` • ${protein}g Đạm` : ''}
                </Text>
              </View>
            ) : null}
          </View>

          <Text numberOfLines={2} className="text-sm font-semibold leading-snug text-foreground">
            {recipe.title}
          </Text>

          {recipe.eligibility && !recipe.eligibility.eligible ? (
            <View className="gap-1 rounded-lg bg-destructive/5 p-2">
              {recipe.eligibility.reasons.slice(0, 2).map((reason) => (
                <Text key={reason.code} numberOfLines={2} className="text-[11px] leading-snug text-destructive">
                  {formatIneligibilityReason(reason)}
                </Text>
              ))}
              {recipe.eligibility.reasons.length > 2 ? (
                <Text className="text-[11px] text-muted-foreground">
                  +{recipe.eligibility.reasons.length - 2} lý do khác
                </Text>
              ) : null}
            </View>
          ) : null}

          <View className="mt-auto flex-row items-center gap-2 border-t border-border pt-2.5">
            <UserAvatar name={recipe.author.name} uri={recipe.author.avatarUrl} size={28} />
            <Text numberOfLines={1} className="flex-1 text-xs font-medium text-foreground">
              {recipe.author.name}
            </Text>
            <ArrowRight size={14} color={colors.mutedForeground} />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
