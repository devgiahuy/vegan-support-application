import * as React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RecipeForm } from '@/features/recipe/components/recipe-form';
import { useRecipeDetailQuery, useUpdateRecipeMutation } from '@/features/recipe/queries/recipe.queries';
import { getSubmitFeedback, getSubmitOutcome } from '@/features/post/utils/submit-outcome';
import { FALLBACK_RECIPE_COVER_URL } from '@/lib/env';
import { useAuthStore } from '@/store/useAuthStore';

/** Sửa công thức của chính mình — `PATCH /posts/:id` rồi `POST /posts/:id/submit` (tự xuất bản hoặc chờ duyệt tùy `revision.status`). Author-only. */
export default function EditRecipeScreen() {
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading, isError } = useRecipeDetailQuery(id ?? '');
  const updateMutation = useUpdateRecipeMutation();
  const scrollRef = React.useRef<ScrollView>(null);

  const isOwner = !!currentUserId && recipe?.author.id === currentUserId;

  if (isLoading) {
    return (
      <SiteScreen>
        <View className="items-center justify-center px-5 py-20">
          <Text className="text-sm text-muted-foreground">Đang tải công thức...</Text>
        </View>
      </SiteScreen>
    );
  }

  if (isError || !recipe) {
    return (
      <SiteScreen>
        <View className="items-center px-5 py-16">
          <Text className="mt-4 text-xl font-bold text-foreground">Không tìm thấy công thức</Text>
          <View className="mt-6">
            <Link href={'/recipes' as Href} asChild>
              <PrimaryButton label="Về danh sách công thức" />
            </Link>
          </View>
        </View>
      </SiteScreen>
    );
  }

  if (!isOwner) {
    return (
      <SiteScreen>
        <View className="items-center px-5 py-16">
          <Text className="mt-4 text-xl font-bold text-foreground">Bạn không có quyền sửa công thức này</Text>
          <Text className="mt-2 text-center text-sm text-muted-foreground">
            Chỉ tác giả mới có thể chỉnh sửa công thức của mình.
          </Text>
          <View className="mt-6">
            <Link href={`/recipes/${recipe.id}` as Href} asChild>
              <PrimaryButton label="Về trang công thức" />
            </Link>
          </View>
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen scrollRef={scrollRef}>
      <View className="gap-5 px-5 pt-4">
        <Text className="text-2xl font-extrabold tracking-tight text-foreground">Chỉnh sửa công thức</Text>

        <RecipeForm
          postId={recipe.id}
          initial={{
            title: recipe.title,
            excerpt: recipe.description,
            coverImageUrl: recipe.coverImageUrl && recipe.coverImageUrl !== FALLBACK_RECIPE_COVER_URL ? recipe.coverImageUrl : null,
            tags: recipe.tags,
            categoryId: recipe.category.id || null,
            servings: recipe.servings,
            prepTimeMinutes: recipe.prepTimeMinutes,
            cookTimeMinutes: recipe.cookTimeMinutes,
            difficulty: recipe.difficulty,
            ingredients: recipe.ingredients.map((ing) => ({
              displayName: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              ingredientId: ing.ingredientId,
              optional: ing.optional,
              position: ing.position,
            })),
            steps:
              recipe.steps.length > 0
                ? recipe.steps.map((step) => ({
                    instruction: step.instruction,
                    durationMinutes: step.durationMinutes,
                    cookingMethodId: step.cookingMethodId,
                    temperatureCelsius: step.temperatureCelsius,
                    affectedIngredientPositions: step.affectedIngredientPositions,
                  }))
                : recipe.body
                  ? [{ instruction: recipe.body }]
                  : [],
          }}
          submitLabel="Lưu thay đổi"
          isSubmitting={updateMutation.isPending}
          onStepChange={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          onSubmit={async (values) => {
            const updated = await updateMutation.mutateAsync({
              id: recipe.id,
              input: { ...values, expectedVersion: recipe.version },
            });
            const feedback = getSubmitFeedback(getSubmitOutcome(updated.revisionStatus), 'công thức', true);
            Alert.alert(feedback.title, feedback.message);
            router.replace(`/recipes/${recipe.id}` as Href);
          }}
        />
      </View>
    </SiteScreen>
  );
}
