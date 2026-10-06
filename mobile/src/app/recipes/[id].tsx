import * as React from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarPlus,
  Clock,
  Dumbbell,
  Flame,
  Hourglass,
  History,
  Leaf,
  Minus,
  Pencil,
  Plus,
  Share2,
  ShieldCheck,
  Trash2,
  Users,
  Utensils,
} from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RecipeCard } from '@/features/recipe/components/recipe-card';
import { useRecipeDetailQuery, useRelatedRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { RecipeNutritionCard } from '@/features/recipe-nutrition/components/recipe-nutrition-card';
import { ReviewHistorySheet } from '@/features/review/components/review-history-sheet';
import { useDeletePostMutation } from '@/features/post/queries/post.queries';
import { CommunityPanel } from '@/features/community/components/community-panel';
import { AddToMealPlanSheet } from '@/features/meal-plan/components/add-to-meal-plan-sheet';
import { ReportButton } from '@/features/safety/components/report-button';
import { PostStatus, UserRole } from '@/common/enums';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import { useTrackBehaviorEvent } from '@/hooks/use-track-behavior-event';
import { useAuthStore } from '@/store/useAuthStore';

/** Chỉ số thiếu dữ liệu hiển thị "Chưa có", không bịa số hay đổi thành 0. */
function formatNutrient(value: number | null, unit: string): string {
  return value === null ? 'Chưa có' : `${value}${unit}`;
}

/**
 * Chi tiết công thức — đồng bộ `frontend/src/app/(site)/recipes/[id]/page.tsx` +
 * `recipe-detail-view.tsx`: ảnh bìa, chỉ số dinh dưỡng, nguyên liệu tick-chọn,
 * hướng dẫn nấu, tương thích/dị ứng, món liên quan, khối cộng đồng (upvote/lưu/
 * đánh giá khẩu vị-độ khó/bình luận — `CommunityPanel`, gọi API thật).
 */
export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useIconColors();
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const currentRole = useAuthStore((state) => state.user?.role);
  const { data: recipe, isLoading, isError, refetch } = useRecipeDetailQuery(id ?? '');
  const { data: relatedData } = useRelatedRecipesQuery(id ?? '');
  const relatedRecipes = (relatedData ?? []).filter((r) => r.id !== id).slice(0, 4);
  const deleteMutation = useDeletePostMutation();
  const trackEvent = useTrackBehaviorEvent();

  // Ghi VIEW_RECIPE ngầm một lần khi chi tiết thật tải xong (fire-and-forget, tự kiểm tra consent).
  const trackedIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (recipe && trackedIdRef.current !== recipe.id) {
      trackedIdRef.current = recipe.id;
      trackEvent({ type: 'VIEW_RECIPE', entityId: recipe.id });
    }
  }, [recipe, trackEvent]);

  const [servings, setServings] = React.useState<number | null>(null);
  const [addToPlanOpen, setAddToPlanOpen] = React.useState(false);
  const [historyPostId, setHistoryPostId] = React.useState<string | null>(null);
  const [checked, setChecked] = React.useState<string[]>([]);

  const isOwner = !!currentUserId && recipe?.author.id === currentUserId;
  const canManageNutrition = isOwner || currentRole === UserRole.ADMIN;

  const toggleIngredient = (name: string) => {
    setChecked((prev) => (prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]));
  };

  const handleShare = () => {
    if (!recipe) return;
    void Share.share({ message: `${recipe.title} — VeggieConnect`, title: recipe.title });
  };

  const confirmDelete = () => {
    if (!recipe) return;
    Alert.alert('Xoá công thức', 'Bạn có chắc muốn xoá công thức này? Hành động này không thể hoàn tác.', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({ id: recipe.id, expectedVersion: recipe.version });
            Alert.alert('Đã xoá', 'Công thức đã được xoá.');
            router.replace('/recipes' as Href);
          } catch (error) {
            Alert.alert('Không xoá được', getApiErrorMessage(error));
          }
        },
      },
    ]);
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
          {isOwner ? (
            <View className="flex-row gap-1.5">
              <Pressable
                onPress={() => setHistoryPostId(recipe.id)}
                accessibilityLabel="Lịch sử duyệt"
                className="h-9 w-9 items-center justify-center rounded-full bg-muted">
                <History size={15} color={colors.foreground} />
              </Pressable>
              <Link href={`/recipes/${recipe.id}/edit` as Href} asChild>
                <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Pencil size={15} color={colors.foreground} />
                </Pressable>
              </Link>
              <Pressable
                onPress={confirmDelete}
                disabled={deleteMutation.isPending}
                className="h-9 w-9 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 size={15} color={colors.destructive} />
              </Pressable>
            </View>
          ) : null}
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Pressable onPress={handleShare} className="flex-row items-center gap-1.5 rounded-full border border-input px-3 py-1.5">
            <Share2 size={14} color={colors.foreground} />
            <Text className="text-xs font-medium text-foreground">Chia sẻ</Text>
          </Pressable>
          <Pressable
            onPress={() => setAddToPlanOpen(true)}
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
            <Text className="text-base font-bold text-foreground">{formatNutrient(recipe.nutrition.calories, ' kcal')}</Text>
          </View>
          <View className="min-w-[47%] flex-1 items-center gap-1 rounded-2xl border border-border bg-muted/30 p-3">
            <Dumbbell size={16} color={colors.primary} />
            <Text className="text-xs text-muted-foreground">Chất đạm</Text>
            <Text className="text-base font-bold text-foreground">{formatNutrient(recipe.nutrition.protein, 'g')}</Text>
          </View>
          <View className="min-w-[47%] flex-1 items-center gap-1 rounded-2xl border border-border bg-muted/30 p-3">
            <Utensils size={16} color={colors.cta} />
            <Text className="text-xs text-muted-foreground">Carbohydrate</Text>
            <Text className="text-base font-bold text-foreground">{formatNutrient(recipe.nutrition.carbs, 'g')}</Text>
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
          {recipe.steps.length > 0 ? (
            <View className="gap-2.5">
              {recipe.steps.map((step, index) => (
                <View key={`${step.position}-${index}`} className="flex-row gap-3 rounded-2xl border border-border p-3.5">
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
                    <Text className="text-xs font-bold text-primary-foreground">{index + 1}</Text>
                  </View>
                  <View className="flex-1 gap-1.5">
                    <Text className="text-sm leading-relaxed text-foreground">{step.instruction}</Text>
                    {step.durationMinutes !== null || step.temperatureCelsius !== null || step.cookingMethodName ? (
                      <View className="flex-row flex-wrap gap-1.5">
                        {step.cookingMethodName ? (
                          <View className="rounded-full bg-muted px-2 py-0.5">
                            <Text className="text-[11px] text-muted-foreground">{step.cookingMethodName}</Text>
                          </View>
                        ) : null}
                        {step.durationMinutes !== null ? (
                          <View className="flex-row items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                            <Clock size={10} color={colors.mutedForeground} />
                            <Text className="text-[11px] text-muted-foreground">{step.durationMinutes} phút</Text>
                          </View>
                        ) : null}
                        {step.temperatureCelsius !== null ? (
                          <View className="rounded-full bg-muted px-2 py-0.5">
                            <Text className="text-[11px] text-muted-foreground">{step.temperatureCelsius}°C</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="rounded-2xl border border-border p-4">
              <Text className="text-sm leading-relaxed text-foreground">
                {recipe.body || 'Đang cập nhật hướng dẫn từng bước cho công thức này...'}
              </Text>
            </View>
          )}
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

        {/* Dinh dưỡng theo cách nấu (backend tính, có nguồn gốc số liệu) */}
        <RecipeNutritionCard postId={recipe.id} canManage={canManageNutrition} />

        {!isOwner ? <ReportButton targetType="POST" targetId={recipe.id} /> : null}

        {/* Cộng đồng: upvote, lưu món, đánh giá khẩu vị/độ khó, bình luận */}
        <CommunityPanel
          postId={recipe.id}
          showRating
          commentPlaceholder="Chia sẻ cảm nhận hoặc mẹo nấu món này..."
        />

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

      <ReviewHistorySheet postId={historyPostId} title={recipe.title} onClose={() => setHistoryPostId(null)} />
      <AddToMealPlanSheet
        visible={addToPlanOpen}
        recipeId={recipe.id}
        recipeTitle={recipe.title}
        onClose={() => setAddToPlanOpen(false)}
      />
    </SiteScreen>
  );
}
