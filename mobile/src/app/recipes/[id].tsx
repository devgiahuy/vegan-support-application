import * as React from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle,
  BadgeCheck,
  CalendarPlus,
  Clock,
  Hourglass,
  History,
  Info,
  Leaf,
  Minus,
  Pencil,
  Plus,
  Share2,
  Star,
  Trash2,
  Users,
  Utensils,
} from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { RecipeAllergenHighlight } from '@/features/recipe/components/recipe-allergen-highlight';
import { RecipeCard } from '@/features/recipe/components/recipe-card';
import { useRecipeDetailQuery, useRelatedRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { RecipeNutritionCard } from '@/features/recipe-nutrition/components/recipe-nutrition-card';
import { IngredientNutritionModal } from '@/features/food-data/components/nutrition-facts-panel';
import { ReviewHistorySheet } from '@/features/review/components/review-history-sheet';
import { useDeletePostMutation } from '@/features/post/queries/post.queries';
import { CommunityPanel } from '@/features/community/components/community-panel';
import { useCommunitySummaryQuery } from '@/features/community/queries/community.queries';
import { AddToMealPlanSheet } from '@/features/meal-plan/components/add-to-meal-plan-sheet';
import { ReportButton } from '@/features/safety/components/report-button';
import { PostStatus, UserRole } from '@/common/enums';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import { useTrackBehaviorEvent } from '@/hooks/use-track-behavior-event';
import { useAuthStore } from '@/store/useAuthStore';

/** Nhân lượng nguyên liệu theo số khẩu phần đang chọn; làm tròn 2 chữ số, bỏ số 0 thừa. */
function formatScaledAmount(amount: number, ratio: number): string {
  const scaled = Math.round(amount * ratio * 100) / 100;
  return String(scaled);
}

/**
 * Chi tiết công thức tối ưu cho điện thoại:
 * Ảnh bìa & tên món -> Cảnh báo dị ứng cá nhân (nếu có) -> Tác vụ chính ("Thêm vào thực đơn" & "Chia sẻ")
 * -> Tóm tắt calo/đạm/thời gian -> Nguyên liệu tick chọn & chỉnh khẩu phần (vùng chạm >= 40dp)
 * -> Các bước nấu -> Dinh dưỡng theo cách nấu -> Cộng đồng & món liên quan.
 */
export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useIconColors();
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const currentRole = useAuthStore((state) => state.user?.role);
  const { data: recipe, isLoading, isError, refetch } = useRecipeDetailQuery(id ?? '');
  const { data: relatedData } = useRelatedRecipesQuery(id ?? '');
  const { data: communitySummary } = useCommunitySummaryQuery(id ?? '');
  const relatedRecipes = (relatedData ?? []).filter((r) => r.id !== id).slice(0, 4);
  const deleteMutation = useDeletePostMutation();
  const trackEvent = useTrackBehaviorEvent();

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
  const [viewingIngredient, setViewingIngredient] = React.useState<{ id: string; name: string } | null>(null);

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
    Alert.alert('Xóa công thức', 'Bạn có chắc muốn xóa công thức này? Hành động này không thể hoàn tác.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({ id: recipe.id, expectedVersion: recipe.version });
            Alert.alert('Đã xóa', 'Công thức đã được xóa.');
            router.replace('/recipes' as Href);
          } catch (error) {
            Alert.alert('Không xóa được', getApiErrorMessage(error));
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SiteScreen title="Chi tiết công thức">
        <View className="px-5 pt-6">
          <LoadingState message="Đang tải chi tiết công thức món chay..." />
        </View>
      </SiteScreen>
    );
  }

  if (isError || !recipe) {
    return (
      <SiteScreen title="Chi tiết công thức">
        <View className="px-5 pt-6">
          {isError ? (
            <ErrorState
              title="Không tải được công thức."
              description="Vui lòng kiểm tra kết nối mạng và thử lại."
              onRetry={() => void refetch()}
            />
          ) : (
            <EmptyState
              title="Không tìm thấy công thức"
              description="Công thức bạn đang tìm kiếm có thể đã bị xóa hoặc không tồn tại."
              action={
                <Link href={'/recipes' as Href} asChild>
                  <PrimaryButton label="Khám phá món khác" variant="outline" />
                </Link>
              }
            />
          )}
        </View>
      </SiteScreen>
    );
  }

  const baseServings = recipe.servings || 2;
  const servingCount = (servings ?? recipe.servings) || 2;
  const servingRatio = servingCount / baseServings;
  const ratingCount = communitySummary?.rating?.count ?? 0;
  const tasteAverage = communitySummary?.rating?.tasteAverage ?? null;
  const hasRating = ratingCount > 0 && tasteAverage !== null;

  return (
    <SiteScreen title={recipe.title} onRefresh={() => refetch()}>
      <View className="gap-4 px-5 pt-4">
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

        {/* Ảnh bìa ưu tiên hiển thị ngay đầu trang để người dùng nhận diện món ăn */}
        <View className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
          <Image source={{ uri: recipe.coverImageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          <View pointerEvents="none" className="absolute bottom-3 left-3 right-3 flex-row items-center justify-between gap-2">
            <View className="flex-shrink flex-row items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5">
              <Clock size={14} color="#34d399" />
              <Text numberOfLines={1} className="text-xs font-medium text-white">
                {recipe.totalTimeMinutes} phút chuẩn bị & nấu
              </Text>
            </View>
            {hasRating ? (
              <View className="flex-row items-center gap-1 rounded-full bg-black/50 px-3 py-1.5">
                <Star size={14} color="#fbbf24" fill="#fbbf24" />
                <Text className="text-xs font-medium text-white">
                  {tasteAverage?.toFixed(1)} ({ratingCount} đánh giá)
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Nhãn phân loại & Tiêu đề */}
        <View className="gap-2">
          <View className="flex-row flex-wrap gap-1.5">
            <View className="rounded-full border border-border bg-card px-2.5 py-1">
              <Text className="text-xs text-foreground">{recipe.category.name}</Text>
            </View>
            <View className="rounded-full border border-border bg-card px-2.5 py-1">
              <Text className="text-xs text-foreground">{recipe.difficultyLabel}</Text>
            </View>
            {recipe.mealPlannerEligible ? (
              <View className="flex-row items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1">
                <Leaf size={12} color={colors.primary} />
                <Text className="text-xs font-medium text-primary">Đủ điều kiện thực đơn</Text>
              </View>
            ) : null}
            {hasRating ? (
              <View className="flex-row items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1">
                <Star size={12} color="#fbbf24" fill="#fbbf24" />
                <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  {tasteAverage?.toFixed(1)} ({ratingCount} đánh giá)
                </Text>
              </View>
            ) : null}
          </View>

          <Text className="text-2xl font-extrabold tracking-tight text-foreground">{recipe.title}</Text>
          {recipe.description ? (
            <Text className="text-sm leading-relaxed text-muted-foreground">{recipe.description}</Text>
          ) : null}
        </View>

        {/* Cảnh báo dị ứng cá nhân & thông tin dị ứng chung */}
        <RecipeAllergenHighlight warnings={recipe.allergyWarnings} allergenCodes={recipe.allergenCodes} />

        {/* Tác vụ chính trên điện thoại */}
        <View className="flex-row gap-2">
          <PrimaryButton
            label="Thêm vào thực đơn"
            className="flex-1"
            iconPosition="left"
            icon={<CalendarPlus size={16} color={colors.primaryForeground} />}
            onPress={() => setAddToPlanOpen(true)}
          />
          <PrimaryButton
            label="Chia sẻ"
            variant="outline"
            iconPosition="left"
            icon={<Share2 size={16} color={colors.foreground} />}
            onPress={handleShare}
          />
        </View>

        {/* Tác giả + nút quản lý của chủ bài (vùng bấm 44dp) */}
        <View className="flex-row items-center justify-between gap-3 border-y border-border py-3">
          <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
            <UserAvatar name={recipe.author.name} uri={recipe.author.avatarUrl} size={42} className="border border-primary/20" />
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text numberOfLines={1} className="flex-shrink text-sm font-semibold text-foreground">{recipe.author.name}</Text>
                {(recipe.author.verified ?? true) ? <BadgeCheck size={16} color={colors.primary} /> : null}
              </View>
              <Text className="text-xs text-muted-foreground">Tác giả công thức</Text>
            </View>
          </View>
          {isOwner ? (
            <View className="flex-row gap-1.5">
              <Pressable
                onPress={() => setHistoryPostId(recipe.id)}
                accessibilityRole="button"
                accessibilityLabel="Lịch sử duyệt"
                className="h-11 w-11 items-center justify-center rounded-full bg-muted active:opacity-80">
                <History size={17} color={colors.foreground} />
              </Pressable>
              <Link href={`/recipes/${recipe.id}/edit` as Href} asChild>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Chỉnh sửa công thức"
                  className="h-11 w-11 items-center justify-center rounded-full bg-muted active:opacity-80">
                  <Pencil size={17} color={colors.foreground} />
                </Pressable>
              </Link>
              <Pressable
                onPress={confirmDelete}
                disabled={deleteMutation.isPending}
                accessibilityRole="button"
                accessibilityLabel="Xóa công thức"
                className="h-11 w-11 items-center justify-center rounded-full bg-destructive/10 active:opacity-80">
                <Trash2 size={17} color={colors.destructive} />
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Nguyên liệu + bộ đếm khẩu phần dễ chạm */}
        <View className="overflow-hidden rounded-2xl border border-border">
          <View className="flex-row items-center justify-between gap-2 border-b border-border bg-muted/40 p-3.5">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Utensils size={18} color={colors.primary} />
                <Text className="flex-shrink text-base font-bold text-foreground">Nguyên liệu cần chuẩn bị</Text>
              </View>
              <Text className="mt-0.5 text-xs text-muted-foreground">
                {servingCount === baseServings
                  ? `Định lượng chuẩn cho ${baseServings} khẩu phần`
                  : `Đã quy đổi cho ${servingCount} khẩu phần (công thức gốc ${baseServings})`}
              </Text>
            </View>
            <View className="flex-row items-center gap-1 rounded-xl border border-border bg-background p-1">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Giảm khẩu phần"
                hitSlop={6}
                onPress={() => setServings(Math.max(1, servingCount - 1))}
                className="h-10 w-10 items-center justify-center rounded-lg active:bg-muted">
                <Minus size={16} color={colors.foreground} />
              </Pressable>
              <View className="min-w-10 flex-row items-center justify-center gap-1 px-1">
                <Users size={13} color={colors.mutedForeground} />
                <Text className="text-sm font-bold text-foreground">{servingCount}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tăng khẩu phần"
                hitSlop={6}
                onPress={() => setServings(servingCount + 1)}
                className="h-10 w-10 items-center justify-center rounded-lg active:bg-muted">
                <Plus size={16} color={colors.foreground} />
              </Pressable>
            </View>
          </View>

          <View className="gap-2 p-3.5">
            {recipe.ingredients.length > 0 ? (
              recipe.ingredients.map((ing, idx) => {
                const isChecked = checked.includes(ing.name);
                return (
                  <Pressable
                    key={idx}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isChecked }}
                    onPress={() => toggleIngredient(ing.name)}
                    className={cn(
                      'min-h-12 flex-row items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5',
                      isChecked ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
                    )}>
                    <Text
                      className={cn(
                        'flex-1 text-sm font-medium text-foreground',
                        isChecked ? 'text-muted-foreground line-through' : ''
                      )}>
                      {ing.name}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <View className="rounded-full bg-primary/10 px-2.5 py-1">
                        <Text className="text-xs font-semibold text-primary">
                          {formatScaledAmount(ing.amount, servingRatio)} {ing.unit}
                        </Text>
                      </View>
                      {ing.ingredientId ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Xem dinh dưỡng ${ing.name}`}
                          hitSlop={6}
                          onPress={() => setViewingIngredient({ id: ing.ingredientId as string, name: ing.name })}
                          className="h-9 w-9 items-center justify-center rounded-full active:bg-muted">
                          <Info size={16} color={colors.mutedForeground} />
                        </Pressable>
                      ) : null}
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

        <IngredientNutritionModal ingredient={viewingIngredient} onClose={() => setViewingIngredient(null)} />

        {/* Dinh dưỡng theo cách nấu */}
        <RecipeNutritionCard postId={recipe.id} canManage={canManageNutrition} />

        {/* Các bước thực hiện */}
        <View className="gap-3">
          <Text className="text-lg font-bold text-foreground">Các bước thực hiện</Text>
          {recipe.steps.length > 0 ? (
            <View className="gap-2.5">
              {recipe.steps.map((step, index) => (
                <View key={`${step.position}-${index}`} className="gap-2 rounded-2xl border border-border bg-card p-3.5">
                  <View className="flex-row items-center justify-between gap-2">
                    <View className="flex-row items-center gap-2.5">
                      <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
                        <Text className="text-xs font-bold text-primary-foreground">{index + 1}</Text>
                      </View>
                      <Text className="text-base font-bold text-foreground">Bước {index + 1}</Text>
                    </View>
                    {step.durationMinutes ? (
                      <View className="flex-row items-center gap-1">
                        <Clock size={13} color={colors.mutedForeground} />
                        <Text className="text-xs font-medium text-muted-foreground">~{step.durationMinutes} phút</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="text-sm leading-relaxed text-muted-foreground">{step.instruction}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="rounded-2xl border border-border bg-card p-4">
              <Text className="text-sm leading-relaxed text-foreground">
                {recipe.body || 'Đang cập nhật hướng dẫn từng bước cho công thức này...'}
              </Text>
            </View>
          )}
        </View>

        {/* Nhóm thực phẩm đã ghi nhận — chỉ hiện khi có dữ liệu thật */}
        {recipe.dietaryGroupLabels.length > 0 ? (
          <View className="gap-3">
            <Text className="text-base font-semibold text-foreground">Nhóm thực phẩm đã ghi nhận</Text>
            <View className="flex-row flex-wrap gap-2">
              {recipe.dietaryGroupLabels.map((label) => (
                <View key={label} className="rounded-full border border-border px-2.5 py-1">
                  <Text className="text-xs text-foreground">{label}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {!isOwner ? <ReportButton targetType="POST" targetId={recipe.id} /> : null}

        <CommunityPanel
          postId={recipe.id}
          showRating
          commentPlaceholder="Chia sẻ cảm nhận hoặc mẹo nấu món này..."
        />

        {/* Món liên quan */}
        {relatedRecipes.length > 0 ? (
          <View className="gap-3">
            <Text className="text-base font-bold text-foreground">Món chay cùng chuyên mục</Text>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {relatedRecipes.map((item) => (
                <RecipeCard key={item.id} recipe={item} className="w-[48.5%]" />
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
