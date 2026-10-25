'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Home, ChevronRight, Pencil, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
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
import { recipeFormToRecipe, recipeToFormValues } from '@/features/recipe/utils/recipe-form-values';
import { getApiErrorCode } from '@/lib/api-error';

export default function EditRecipePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
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

  const initialFormValues = React.useMemo<Partial<RecipeFormValues> | undefined>(
    () => (recipe ? recipeToFormValues(recipe) : undefined),
    [recipe]
  );

  const handleSubmit = async (values: RecipeFormValues) => {
    if (!recipe) return;
    try {
      await updateMutation.mutateAsync({
        id,
        recipe: { ...recipeFormToRecipe(values), version: recipe.version },
      });
      await refetchRecipe();
    } catch (error) {
      // Xung đột phiên bản: tải bản mới nhất để lần gửi sau mang đúng `expectedVersion`.
      if (getApiErrorCode(error) === 'CONTENT_VERSION_CONFLICT') void refetchRecipe();
      throw error;
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
            <Button variant="outline" className="rounded-full" onClick={() => void refetchRecipe()}>
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
                Sửa theo từng bước, xem lại rồi lưu thay đổi.
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
            submitLabel="Lưu thay đổi"
          />
        </div>
      )}
    </AuthGuard>
  );
}
