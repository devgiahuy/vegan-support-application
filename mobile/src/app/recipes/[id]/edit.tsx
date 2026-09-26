import * as React from 'react';
import { Alert, Text, View } from 'react-native';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RecipeForm } from '@/features/recipe/components/recipe-form';
import { useRecipeDetailQuery, useUpdateRecipeMutation } from '@/features/recipe/queries/recipe.queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/store/useAuthStore';

/** Sửa công thức của chính mình — `PATCH /posts/:id` rồi gửi lại duyệt. Author-only. */
export default function EditRecipeScreen() {
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading, isError } = useRecipeDetailQuery(id ?? '');
  const updateMutation = useUpdateRecipeMutation();

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
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <Text className="text-2xl font-extrabold tracking-tight text-foreground">Chỉnh sửa công thức</Text>

        <RecipeForm
          initial={{
            title: recipe.title,
            excerpt: recipe.description,
            body: recipe.body,
            tags: recipe.tags,
            categoryId: recipe.category.id || null,
            servings: recipe.servings,
            prepTimeMinutes: recipe.prepTimeMinutes,
            cookTimeMinutes: recipe.cookTimeMinutes,
            difficulty: recipe.difficulty,
            calories: recipe.nutrition.calories || undefined,
            protein: recipe.nutrition.protein || undefined,
            ingredients: recipe.ingredients.map((ing) => ({
              displayName: ing.name,
              amount: ing.amount,
              unit: ing.unit,
            })),
          }}
          submitLabel="Lưu thay đổi"
          isSubmitting={updateMutation.isPending}
          onSubmit={async (values) => {
            try {
              await updateMutation.mutateAsync({ id: recipe.id, input: { ...values, expectedVersion: recipe.version } });
              Alert.alert('Đã lưu', 'Công thức đã được cập nhật và gửi lại để duyệt.');
              router.replace(`/recipes/${recipe.id}` as Href);
            } catch (error) {
              Alert.alert('Không lưu được', getApiErrorMessage(error, 'Vui lòng kiểm tra dữ liệu và thử lại.'));
            }
          }}
        />
      </View>
    </SiteScreen>
  );
}
