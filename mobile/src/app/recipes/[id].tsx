import * as React from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href, useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  CalendarPlus,
  Clock,
  Dumbbell,
  Flame,
  Hourglass,
  Leaf,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  Users,
  Utensils,
} from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RecipeCard } from '@/features/recipe/components/recipe-card';
import { useRecipeDetailQuery, useRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { PostStatus } from '@/common/enums';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';

function notifyComingSoon(feature: string) {
  Alert.alert('Sắp ra mắt', `${feature} đang được VeggieConnect hoàn thiện, quay lại sau nhé!`);
}

/**
 * Chi tiết công thức — đồng bộ `frontend/src/app/(site)/recipes/[id]/page.tsx` +
 * `recipe-detail-view.tsx`: ảnh bìa, chỉ số dinh dưỡng, nguyên liệu tick-chọn,
 * hướng dẫn nấu, tương thích/dị ứng, món liên quan. Khối cộng đồng (vote/bình
 * luận/đánh giá) chưa dựng ở mobile — cần nguyên `features/community` (task riêng).
 */
export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useIconColors();
  const { data: recipe, isLoading, isError, refetch } = useRecipeDetailQuery(id ?? '');
  const { data: recipesPagination } = useRecipesQuery({ limit: 6 });
  const relatedRecipes = (recipesPagination?.items ?? []).filter((r) => r.id !== id).slice(0, 3);

  const [servings, setServings] = React.useState<number | null>(null);
  const [isSaved, setIsSaved] = React.useState(false);
  const [checked, setChecked] = React.useState<string[]>([]);

  const toggleIngredient = (name: string) => {
    setChecked((prev) => (prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]));
  };

  const handleShare = () => {
    if (!recipe) return;
    void Share.share({ message: `${recipe.title} — VeggieConnect`, title: recipe.title });
  };

  if (isLoading) {
    return (
      <SiteScreen>
        <View className="items-center justify-center px-5 py-20">
          <Text className="text-sm text-muted-foreground">Đang tải chi tiết công thức món chay...</Text>
        </View>
      </SiteScreen>
    );
  }

  if (isError || !recipe) {
    return (
      <SiteScreen>
        <View className="items-center px-5 py-16">
          <Text className="text-5xl">🍲</Text>
          <Text className="mt-4 text-xl font-bold text-foreground">Không tìm thấy công thức</Text>
          <Text className="mt-2 text-center text-sm text-muted-foreground">
            Công thức bạn đang tìm kiếm có thể đã bị xóa hoặc không tồn tại.
          </Text>
          <View className="mt-6 flex-row gap-3">
            <Link href={'/recipes' as Href} asChild>
              <PrimaryButton
                label="Quay lại danh sách"
                variant="outline"
                icon={<ArrowLeft size={16} color={colors.foreground} />}
              />
            </Link>
            <PrimaryButton label="Thử lại" onPress={() => void refetch()} />
          </View>
        </View>
      </SiteScreen>
    );
  }

  const incompatibilities = recipe.dietCompatibilities.filter((c) => !c.compatible);
  const servingCount = (servings ?? recipe.servings) || 2;
  const hasCompatibilityInfo =
    recipe.allergenCodes.length > 0 || recipe.traditionWarnings.length > 0 || incompatibilities.length > 0;

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        {recipe.status === PostStatus.PENDING_REVIEW ? (
          <View className="flex-row items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <Hourglass size={18} color="#d97706" />
            <View className="flex-1">
              <Text className="font-semibold text-foreground">Công thức đang chờ kiểm duyệt</Text>
              <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Công thức đang được Ban biên tập kiểm định tiêu chuẩn thuần chay 100%.
              </Text>
            </View>
          </View>
        ) : null}

        {recipe.status === PostStatus.REJECTED ? (
          <View className="flex-row items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
            <AlertTriangle size={18} color={colors.destructive} />
            <View className="flex-1">
              <Text className="font-semibold text-destructive">Công thức không được phê duyệt</Text>
              <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Bài viết không đáp ứng tiêu chuẩn thuần chay hoặc an toàn thực phẩm.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Header info */}
        <View className="flex-row flex-wrap gap-1.5">
          <View className="rounded-full border border-border px-2.5 py-1">
            <Text className="text-xs text-foreground">{recipe.category.name}</Text>
          </View>
          <View className="rounded-full border border-border px-2.5 py-1">
            <Text className="text-xs text-foreground">{recipe.difficultyLabel}</Text>
          </View>
          {recipe.mealPlannerEligible ? (
            <View className="flex-row items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1">
              <Leaf size={12} color={colors.primary} />
              <Text className="text-xs font-medium text-primary">Đủ điều kiện thực đơn</Text>
            </View>
          ) : null}
        </View>

        <Text className="text-2xl font-extrabold tracking-tight text-foreground">{recipe.title}</Text>
        {recipe.description ? (
          <Text className="-mt-3 text-sm leading-relaxed text-muted-foreground">{recipe.description}</Text>
        ) : null}

        {/* Author + actions */}
        <View className="flex-row items-center justify-between gap-3 border-y border-border py-4">
          <View className="flex-row items-center gap-2.5">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Text className="text-sm font-bold text-primary">{recipe.author.name.charAt(0)}</Text>
            </View>
            <Text className="text-sm font-semibold text-foreground">{recipe.author.name}</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => setIsSaved((v) => !v)}
            className={cn(
              'flex-row items-center gap-1.5 rounded-full border px-3 py-1.5',
              isSaved ? 'border-destructive/40 bg-destructive/10' : 'border-input'
            )}>
            <Bookmark size={14} color={isSaved ? colors.destructive : colors.foreground} />
            <Text className={cn('text-xs font-medium', isSaved ? 'text-destructive' : 'text-foreground')}>
              {isSaved ? 'Đã lưu' : 'Lưu món'}
            </Text>
          </Pressable>
          <Pressable onPress={handleShare} className="flex-row items-center gap-1.5 rounded-full border border-input px-3 py-1.5">
            <Share2 size={14} color={colors.foreground} />
            <Text className="text-xs font-medium text-foreground">Chia sẻ</Text>
          </Pressable>
          <Pressable
            onPress={() => notifyComingSoon('Thực đơn tuần')}
            className="flex-row items-center gap-1.5 rounded-full bg-primary px-3 py-1.5">
            <CalendarPlus size={14} color={colors.primaryForeground} />
            <Text className="text-xs font-semibold text-primary-foreground">Thêm vào thực đơn</Text>
          </Pressable>
        </View>

        {/* Cover */}
        <View className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
          <Image source={{ uri: recipe.coverImageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        </View>

        {/* Metrics ribbon */}
        <View className="flex-row flex-wrap gap-3">
          <View className="min-w-[47%] flex-1 items-center gap-1 rounded-2xl border border-border bg-muted/30 p-3">
            <Flame size={16} color="#ea580c" />
            <Text className="text-xs text-muted-foreground">Lượng Calo</Text>
            <Text className="text-base font-bold text-foreground">{recipe.nutrition.calories} kcal</Text>
          </View>
          <View className="min-w-[47%] flex-1 items-center gap-1 rounded-2xl border border-border bg-muted/30 p-3">
            <Dumbbell size={16} color={colors.primary} />
            <Text className="text-xs text-muted-foreground">Chất đạm</Text>
            <Text className="text-base font-bold text-foreground">{recipe.nutrition.protein}g</Text>
          </View>
          <View className="min-w-[47%] flex-1 items-center gap-1 rounded-2xl border border-border bg-muted/30 p-3">
            <Utensils size={16} color={colors.cta} />
            <Text className="text-xs text-muted-foreground">Carbohydrate</Text>
            <Text className="text-base font-bold text-foreground">{recipe.nutrition.carbs || 35}g</Text>
          </View>
          <View className="min-w-[47%] flex-1 items-center gap-1 rounded-2xl border border-border bg-muted/30 p-3">
            <Clock size={16} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">Thời gian</Text>
            <Text className="text-base font-bold text-foreground">{recipe.totalTimeMinutes} phút</Text>
          </View>
        </View>

        {/* Ingredients */}
        <View className="overflow-hidden rounded-2xl border border-border">
          <View className="flex-row items-center justify-between border-b border-border bg-muted/40 p-4">
            <View className="flex-1 pr-2">
              <Text className="flex-row items-center text-base font-bold text-foreground">
                Nguyên liệu cần chuẩn bị
              </Text>
              <Text className="mt-0.5 text-xs text-muted-foreground">Nhấn để đánh dấu đã có sẵn</Text>
            </View>
            <View className="flex-row items-center gap-1.5 rounded-lg border border-border bg-background p-1">
              <Users size={13} color={colors.mutedForeground} />
              <Pressable
                onPress={() => setServings(Math.max(1, servingCount - 1))}
                className="h-6 w-6 items-center justify-center">
                <Minus size={12} color={colors.foreground} />
              </Pressable>
              <Text className="w-4 text-center text-xs font-bold text-foreground">{servingCount}</Text>
              <Pressable
                onPress={() => setServings(servingCount + 1)}
                className="h-6 w-6 items-center justify-center">
                <Plus size={12} color={colors.foreground} />
              </Pressable>
            </View>
          </View>

          <View className="gap-2 p-4">
            {recipe.ingredients.length > 0 ? (
              recipe.ingredients.map((ing, idx) => {
                const isChecked = checked.includes(ing.name);
                return (
                  <Pressable
                    key={idx}
                    onPress={() => toggleIngredient(ing.name)}
                    className={cn(
                      'flex-row items-center justify-between rounded-xl border p-3',
                      isChecked ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
                    )}>
                    <Text
                      className={cn(
                        'flex-1 text-sm font-medium text-foreground',
                        isChecked ? 'text-muted-foreground line-through' : ''
                      )}>
                      {ing.name}
                    </Text>
                    <View className="rounded-full bg-primary/10 px-2 py-0.5">
                      <Text className="text-xs font-semibold text-primary">
                        {ing.amount} {ing.unit}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <Text className="py-2 text-center text-sm text-muted-foreground">
                Đang cập nhật danh sách nguyên liệu chi tiết...
              </Text>
            )}
          </View>
        </View>

        {/* Steps */}
        <View className="gap-3">
          <Text className="text-lg font-bold text-foreground">Các bước thực hiện</Text>
          <View className="rounded-2xl border border-border p-4">
            <Text className="text-sm leading-relaxed text-foreground">
              {recipe.body || 'Đang cập nhật hướng dẫn từng bước cho công thức này...'}
            </Text>
          </View>
        </View>

        {/* Compatibility */}
        {hasCompatibilityInfo ? (
          <View className="gap-3 rounded-2xl border border-border p-4">
            <View className="flex-row items-center gap-1.5">
              <ShieldCheck size={15} color={colors.primary} />
              <Text className="text-sm font-bold text-foreground">Tương thích & dị ứng</Text>
            </View>
            {recipe.allergenCodes.length > 0 ? (
              <View>
                <Text className="text-xs font-semibold text-muted-foreground">Có thể chứa dị ứng:</Text>
                <View className="mt-1.5 flex-row flex-wrap gap-1.5">
                  {recipe.allergenCodes.map((code) => (
                    <View key={code} className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1">
                      <Text className="text-xs text-amber-700">{code}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            {recipe.traditionWarnings.map((w) => (
              <Text key={`${w.tradition}-${w.warningCode}`} className="text-xs leading-relaxed text-muted-foreground">
                <Text className="font-semibold text-foreground">{w.tradition}: </Text>
                {w.label || w.warningCode}
              </Text>
            ))}
            {incompatibilities.map((c) => (
              <Text key={c.dietPattern} className="text-xs leading-relaxed text-muted-foreground">
                <Text className="font-semibold text-foreground">{c.dietPattern}: </Text>
                chưa tương thích ({c.reasonCodes.join(', ') || 'đang cập nhật nguyên nhân'}).
              </Text>
            ))}
          </View>
        ) : null}

        {/* Nutrition breakdown */}
        <View className="overflow-hidden rounded-2xl border border-border">
          <View className="border-b border-border bg-primary/5 p-4">
            <Text className="text-sm font-bold text-foreground">Phân tích dinh dưỡng (1 khẩu phần)</Text>
          </View>
          <View className="gap-2.5 p-4">
            {[
              ['Tổng năng lượng', `${recipe.nutrition.calories} kcal`],
              ['Chất đạm thực vật', `${recipe.nutrition.protein}g`],
              ['Carbohydrate', `${recipe.nutrition.carbs || 35}g`],
              ['Chất béo thực vật', `${recipe.nutrition.fat || 8}g`],
              ['Chất xơ tự nhiên', `${recipe.nutrition.fiber || 6}g`],
            ].map(([label, value]) => (
              <View key={label} className="flex-row items-center justify-between border-b border-border/60 pb-2">
                <Text className="text-sm text-muted-foreground">{label}</Text>
                <Text className="text-sm font-semibold text-foreground">{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Related */}
        {relatedRecipes.length > 0 ? (
          <View className="gap-3">
            <Text className="text-base font-bold text-foreground">Món chay cùng chuyên mục</Text>
            <View className="flex-row flex-wrap gap-3">
              {relatedRecipes.map((item) => (
                <RecipeCard key={item.id} recipe={item} className="w-[47%]" />
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </SiteScreen>
  );
}
