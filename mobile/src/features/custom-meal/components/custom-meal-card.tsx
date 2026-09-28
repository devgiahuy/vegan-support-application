import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { Flame, Utensils } from 'lucide-react-native';
import { useIconColors } from '@/lib/theme-colors';
import type { CustomMeal } from '../types/custom-meal.model';

export function CustomMealCard({ meal }: { meal: CustomMeal }) {
  const colors = useIconColors();
  return (
    <Link href={`/custom-meals/${meal.id}` as Href} asChild>
      <Pressable className="overflow-hidden rounded-2xl border border-border bg-card">
        <View className="h-32 bg-muted">
          {meal.coverPhotoUrl ? (
            <Image source={{ uri: meal.coverPhotoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <View className="h-full items-center justify-center">
              <Utensils size={24} color={colors.mutedForeground} />
            </View>
          )}
        </View>
        <View className="gap-2 p-4">
          <Text numberOfLines={2} className="text-base font-bold text-foreground">{meal.name}</Text>
          {meal.notes ? <Text numberOfLines={2} className="text-sm text-muted-foreground">{meal.notes}</Text> : null}
          <View className="flex-row flex-wrap gap-2">
            <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
              <Utensils size={12} color={colors.primary} />
              <Text className="text-xs font-semibold text-primary">{meal.servings} phan</Text>
            </View>
            {meal.calories !== null ? (
              <View className="flex-row items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                <Flame size={12} color={colors.mutedForeground} />
                <Text className="text-xs text-muted-foreground">{meal.calories} kcal</Text>
              </View>
            ) : null}
          </View>
          {meal.tags.length ? (
            <Text numberOfLines={1} className="text-xs text-muted-foreground">#{meal.tags.join(' #')}</Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

