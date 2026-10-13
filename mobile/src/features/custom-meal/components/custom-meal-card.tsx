import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { Eye, Flame, ImageIcon, Pencil, Trash2, Users, Utensils } from 'lucide-react-native';

import { ImageBadge } from '@/components/ui/image-badge';
import { useIconColors } from '@/lib/theme-colors';
import type { CustomMeal } from '../types/custom-meal.model';

const MAX_TAGS = 3;

/**
 * Thẻ "Món ăn của tôi" — bố cục theo web: ảnh bìa 16:9 (nhãn số phần/ảnh bên trái, "Món cá nhân" bên phải), tên, mô tả,
 * calo + số nguyên liệu, tối đa 3 thẻ phân loại, chân thẻ có Xem / Sửa / Xóa.
 */
export function CustomMealCard({ meal, onDelete }: { meal: CustomMeal; onDelete?: (meal: CustomMeal) => void }) {
  const colors = useIconColors();
  const detailHref = `/custom-meals/${meal.id}` as Href;
  const extraTags = meal.tags.length - MAX_TAGS;

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <Link href={detailHref} asChild>
        <Pressable accessibilityRole="button" accessibilityLabel={`Xem món ${meal.name}`}>
          <View className="aspect-video w-full bg-muted">
            {meal.coverPhotoUrl ? (
              <Image source={{ uri: meal.coverPhotoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <View className="h-full items-center justify-center">
                <Utensils size={40} color={colors.mutedForeground} />
              </View>
            )}
            <View className="absolute left-2.5 top-2.5 flex-row gap-1.5">
              <ImageBadge label={`${meal.servings} phần`} icon={(color) => <Users size={12} color={color} />} />
              {meal.photoCount > 1 ? (
                <ImageBadge label={String(meal.photoCount)} icon={(color) => <ImageIcon size={12} color={color} />} />
              ) : null}
            </View>
            <View className="absolute right-2.5 top-2.5 rounded-full bg-primary px-2.5 py-1">
              <Text className="text-[11px] font-semibold text-primary-foreground">Món cá nhân</Text>
            </View>
          </View>
        </Pressable>
      </Link>

      <View className="gap-2.5 p-4">
        <Link href={detailHref} asChild>
          <Pressable>
            <Text numberOfLines={1} className="text-base font-semibold text-foreground">
              {meal.name}
            </Text>
          </Pressable>
        </Link>

        {meal.notes ? (
          <Text numberOfLines={2} className="text-xs leading-relaxed text-muted-foreground">
            {meal.notes}
          </Text>
        ) : null}

        <View className="flex-row items-center justify-between border-t border-border pt-2.5">
          <View className="flex-row items-center gap-1">
            <Flame size={14} color="#ea580c" />
            <Text className="text-xs font-medium text-orange-600">
              {meal.calories !== null ? `${meal.calories} kcal` : 'Chưa có calo'}
            </Text>
          </View>
          <Text className="text-[11px] text-muted-foreground">{meal.ingredientCount} nguyên liệu</Text>
        </View>

        {meal.tags.length > 0 ? (
          <View className="flex-row flex-wrap items-center gap-1.5">
            {meal.tags.slice(0, MAX_TAGS).map((tag) => (
              <View key={tag} className="rounded bg-muted px-1.5 py-0.5">
                <Text className="text-[10px] text-muted-foreground">#{tag}</Text>
              </View>
            ))}
            {extraTags > 0 ? <Text className="text-[10px] text-muted-foreground">+{extraTags}</Text> : null}
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center gap-1 border-t border-border bg-muted px-3 py-2">
        <Link href={detailHref} asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Xem ${meal.name}`}
            className="h-10 flex-1 flex-row items-center justify-center gap-1.5">
            <Eye size={15} color={colors.foreground} />
            <Text className="text-xs font-semibold text-foreground">Xem</Text>
          </Pressable>
        </Link>
        <Link href={`/custom-meals/${meal.id}/edit` as Href} asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Chỉnh sửa ${meal.name}`}
            className="h-10 w-10 items-center justify-center">
            <Pencil size={16} color={colors.mutedForeground} />
          </Pressable>
        </Link>
        {onDelete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Xóa món ăn ${meal.name}`}
            onPress={() => onDelete(meal)}
            className="h-10 w-10 items-center justify-center">
            <Trash2 size={16} color={colors.destructive} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
