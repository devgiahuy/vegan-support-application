'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecipeDetailView } from '@/features/recipe/components/recipe-detail-view';
import { useRecipeDetailQuery, useRecipesQuery } from '@/features/recipe/queries/recipe.queries';

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  const {
    data: recipe,
    isLoading: isRecipeLoading,
    isError: isRecipeError,
    refetch: refetchRecipe,
  } = useRecipeDetailQuery(id);

  const { data: recipesPagination } = useRecipesQuery({ limit: 6 });
  const relatedRecipes = React.useMemo(() => {
    return (recipesPagination?.items || []).filter((r) => r.id !== id);
  }, [recipesPagination?.items, id]);

  if (isRecipeLoading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-7xl flex-col items-center justify-center px-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">
          Đang tải chi tiết công thức món chay...
        </p>
      </div>
    );
  }

  if (isRecipeError || !recipe) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <div className="rounded-full bg-destructive/10 p-3 text-destructive">
          <span className="text-2xl">🍲</span>
        </div>
        <h2 className="mt-4 text-xl font-bold">Không tìm thấy công thức</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Công thức bạn đang tìm kiếm có thể đã bị xóa hoặc không tồn tại.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" asChild className="rounded-xl">
            <Link href="/recipes" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
            </Link>
          </Button>
          <Button onClick={() => void refetchRecipe()} className="rounded-xl">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return <RecipeDetailView recipe={recipe} relatedRecipes={relatedRecipes} />;
}
