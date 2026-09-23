'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  ChevronRight,
  Pencil,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/components/shared/auth-guard';
import { RecipeEditorForm } from '@/features/recipe/components/recipe-editor-form';
import {
  useRecipeDetailQuery,
  useUpdateRecipeMutation,
} from '@/features/recipe/queries/recipe.queries';
import { ReviewStatusBanner } from '@/features/review/components/review-status-banner';
import { ReviewHistoryDialog } from '@/features/review/components/review-history-dialog';
import { useAuthStore } from '@/store/useAuthStore';
import type { RecipeFormValues } from '@/features/recipe/schemas/recipe-form.schema';
import type { Recipe } from '@/features/recipe/types/recipe.model';
import { RecipeDifficulty } from '@/common/enums';

export default function EditRecipePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const [historyDialogOpen, setHistoryDialogOpen] = React.useState(false);
  const currentUser = useAuthStore((s) => s.user);

  const {
    data: recipe,
    isLoading: isQueryLoading,
    isError: isQueryError,
    refetch: refetchRecipe,
  } = useRecipeDetailQuery(id);

  const updateMutation = useUpdateRecipeMutation();

  const isAuthor = Boolean(
    !currentUser || !recipe?.author?.id || currentUser.id === recipe.author.id
  );

  const initialFormValues = React.useMemo<Partial<RecipeFormValues> | undefined>(() => {
    if (!recipe) return undefined;

    const categoryId =
      typeof recipe.category === 'string'
        ? recipe.category
        : recipe.category?.id || '';

    const diff = Object.values(RecipeDifficulty).includes(
      recipe.difficulty as RecipeDifficulty
    )
      ? (recipe.difficulty as RecipeDifficulty)
      : RecipeDifficulty.MEDIUM;

    return {
      title: recipe.title,
      categoryId,
      coverImageUrl: recipe.coverImageUrl || '',
      coverMedia:
        recipe.coverMedia?.publicId && recipe.coverMedia?.mimeType && typeof recipe.coverMedia?.bytes === 'number'
          ? {
              publicId: recipe.coverMedia.publicId,
              mimeType: recipe.coverMedia.mimeType,
              bytes: recipe.coverMedia.bytes,
            }
          : null,
      difficulty: diff,
      servings: recipe.servings || 2,
      prepTimeMinutes: recipe.prepTimeMinutes ?? 15,
      cookTimeMinutes: recipe.cookTimeMinutes ?? 20,
      description: recipe.body || '',
      ingredients: (recipe.ingredients || []).map((ing) => ({
        ingredientId: ing.ingredientId ?? null,
        name: ing.name,
        amount: typeof ing.amount === 'number' ? ing.amount : Number(ing.amount) || 1,
        unit: ing.unit || 'phần',
        notes: ing.notes || '',
      })),
      steps: (recipe.steps || []).map((st) => {
        const text =
          ('instruction' in st && st.instruction ? st.instruction : '') ||
          ('desc' in st && st.desc ? st.desc : '') ||
          '';
        return {
          stepNumber: st.stepNumber,
          instruction: text,
          imageUrl: st.imageUrl || null,
        };
      }),
      nutrition: recipe.nutrition
        ? {
            calories: recipe.nutrition.calories,
            protein: recipe.nutrition.protein,
            carbs: recipe.nutrition.carbs,
            fat: recipe.nutrition.fat,
            fiber: recipe.nutrition.fiber,
            vitaminB12: recipe.nutrition.vitaminB12,
          }
        : undefined,
    };
  }, [recipe]);

  const handleSubmit = async (values: RecipeFormValues) => {
    if (!recipe) return;

    const payload: Partial<Recipe> = {
      title: values.title,
      category: values.categoryId,
      coverImageUrl: values.coverImageUrl || '',
      coverMedia: values.coverMedia ?? null,
      difficulty: values.difficulty,
      servings: values.servings,
      prepTimeMinutes: values.prepTimeMinutes,
      cookTimeMinutes: values.cookTimeMinutes,
      body: values.description || '',
      ingredients: values.ingredients.map((ing) => ({
        ingredientId: ing.ingredientId ?? null,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        notes: ing.notes || '',
      })),
      steps: values.steps.map((st) => ({
        stepNumber: st.stepNumber,
        instruction: st.instruction,
        imageUrl: st.imageUrl || null,
      })),
      nutrition: values.nutrition
        ? {
            calories: values.nutrition.calories,
            protein: values.nutrition.protein,
            carbs: values.nutrition.carbs,
            fat: values.nutrition.fat,
            fiber: values.nutrition.fiber,
            vitaminB12: values.nutrition.vitaminB12,
          }
        : undefined,
      version: recipe.version,
    };

    try {
      await updateMutation.mutateAsync({ id, recipe: payload });
      await refetchRecipe();
    } catch {
      // Handled in mutation onError
    }
  };

  return (
    <AuthGuard>
      {isQueryLoading ? (
        <div className="mx-auto max-w-6xl px-4 py-20 text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu công thức...</p>
        </div>
      ) : isQueryError || !recipe ? (
        <div className="mx-auto max-w-xl py-20 px-4 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Không tìm thấy công thức để chỉnh sửa
          </h2>
          <p className="text-sm text-muted-foreground">
            Công thức có thể đã bị xoá hoặc bạn không có quyền truy cập.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button asChild className="rounded-full gap-2">
              <Link href="/recipes">
                <ArrowLeft className="h-4 w-4" /> Quay lại Kho công thức
              </Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => void refetchRecipe()}
            >
              Thử lại
            </Button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6 space-y-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/"
              className="inline-flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Home className="h-4 w-4" /> Trang chủ
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/recipes" className="hover:text-primary transition-colors">
              Kho công thức
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href={`/recipes/${recipe.id}`}
              className="hover:text-primary transition-colors truncate max-w-xs"
            >
              {recipe.title}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-primary">Chỉnh sửa</span>
          </nav>

          {/* Page Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
                <Pencil className="h-7 w-7 text-primary" /> Chỉnh Sửa Công Thức
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Cập nhật nguyên liệu, các bước thực hiện và thông tin dinh dưỡng.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <Link href={`/recipes/${recipe.id}`}>
                <ArrowLeft className="h-4 w-4" /> Huỷ &amp; Xem công thức
              </Link>
            </Button>
          </div>

          {/* Review Status Banner */}
          <ReviewStatusBanner
            postId={recipe.id}
            postTitle={recipe.title}
            postStatus={recipe.status}
            revisionId={recipe.revisionId}
            revisionVersion={recipe.revisionVersion ?? recipe.version}
            publishedRevisionVersion={recipe.publishedRevisionVersion}
            isAuthor={isAuthor}
            onOpenHistory={() => setHistoryDialogOpen(true)}
            onSuccess={() => void refetchRecipe()}
          />

          {/* History Dialog */}
          <ReviewHistoryDialog
            open={historyDialogOpen}
            onOpenChange={setHistoryDialogOpen}
            postId={recipe.id}
            postTitle={recipe.title}
          />

          {/* Editor Form */}
          <RecipeEditorForm
            postId={id}
            initialValues={initialFormValues}
            onSubmit={handleSubmit}
            isSubmitting={updateMutation.isPending}
            formTitle="Cập nhật công thức món chay"
          />
        </div>
      )}
    </AuthGuard>
  );
}
