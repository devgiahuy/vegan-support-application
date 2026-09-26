import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { ArrowRight, Clock, Flame } from 'lucide-react-native';
import { useIconColors } from '@/lib/theme-colors';
import type { Recipe } from '../types/recipe.model';

/**
 * Card công thức cho danh sách (Trang chủ, Khám phá món), đồng bộ bố cục với
 * `frontend/src/features/recipe/components/recipe-card.tsx` (ảnh 4:3, badge thời gian,
 * tiêu đề, calo/đạm, tác giả). Bấm vào mở `/recipes/[id]`.
 */
export function RecipeCard({ recipe, className }: { recipe: Recipe; className?: string }) {
  const colors = useIconColors();
  const minutes = recipe.totalTimeMinutes;
  const kcal = recipe.nutrition.calories;
  const protein = recipe.nutrition.protein;

  return (
    <Link href={`/recipes/${recipe.id}` as Href} asChild>
      <Pressable
        className={`overflow-hidden rounded-2xl border border-border bg-card ${className ?? ''}`}>
        <View className="relative aspect-[4/3]">
          <Image
            source={{ uri: recipe.coverImageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          {/* Màu cố định (không theo theme) — nền là ảnh món ăn, độ sáng thay đổi tuỳ ảnh,
              nên không thể dựa vào token sáng/tối để đảm bảo tương phản. */}
          <View className="absolute left-2.5 top-2.5 flex-row items-center gap-1 rounded-full bg-black/70 px-2.5 py-1">
            <Clock size={12} color="#ffffff" />
            <Text className="text-xs font-medium text-white">{minutes} phút</Text>
          </View>
        </View>

        <View className="gap-2 p-3.5">
          <View className="flex-row items-center gap-3">
            {kcal > 0 ? (
              <View className="flex-row items-center gap-1">
                <Flame size={13} color={colors.mutedForeground} />
                <Text className="text-xs text-muted-foreground">
                  {kcal} kcal{protein > 0 ? ` • ${protein}g Đạm` : ''}
                </Text>
              </View>
            ) : null}
          </View>

          <Text numberOfLines={2} className="text-sm font-semibold leading-snug text-foreground">
            {recipe.title}
          </Text>

          <View className="mt-1 flex-row items-center justify-between border-t border-border pt-2.5">
            <Text numberOfLines={1} className="flex-1 text-xs font-medium text-muted-foreground">
              {recipe.author.name}
            </Text>
            <ArrowRight size={14} color={colors.mutedForeground} />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
