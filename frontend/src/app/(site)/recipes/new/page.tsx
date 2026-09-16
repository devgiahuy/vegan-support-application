'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ChevronRight, Sparkles } from 'lucide-react';
import { RecipeEditorForm } from '@/features/recipe/components/recipe-editor-form';
import { AuthGuard } from '@/components/shared/auth-guard';
import { useCreateRecipeMutation } from '@/features/recipe/queries/recipe.queries';
import type { RecipeFormValues } from '@/features/recipe/schemas/recipe-form.schema';
import type { Recipe } from '@/features/recipe/types/recipe.model';

export default function CreateRecipePage() {
  const router = useRouter();
  const createRecipeMutation = useCreateRecipeMutation();

  const handleSubmit = async (values: RecipeFormValues) => {
    const payload: Partial<Recipe> = {
      title: values.title,
      category: values.categoryId,
      coverImageUrl: values.coverImageUrl || '',
      coverMedia: values.coverMedia ?? null,
      difficulty: values.difficulty,
      servings: values.servings,
      prepTimeMinutes: values.prepTimeMinutes,
      cookTimeMinutes: values.cookTimeMinutes,
      description: values.description || '',
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
    };

    try {
      const created = await createRecipeMutation.mutateAsync(payload);
      if (created?.id) {
        router.push(`/recipes/${created.id}`);
      } else {
        router.push('/recipes');
      }
    } catch {
      // Toast notification is handled in mutation onError
    }
  };

  return (
    <AuthGuard>
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Home className="h-3.5 w-3.5" /> Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/recipes" className="hover:text-primary transition-colors">
            Kho công thức
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Đăng công thức mới</span>
        </nav>

        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Sáng tạo & Lan tỏa món chay
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Đóng góp công thức thuần chay mới
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Chia sẻ những món ăn thanh lành, giàu dinh dưỡng cùng định lượng nguyên liệu chuẩn xác
            để cộng đồng cùng thực hành.
          </p>
        </div>

        {/* Form */}
        <RecipeEditorForm onSubmit={handleSubmit} isSubmitting={createRecipeMutation.isPending} />
      </div>
    </AuthGuard>
  );
}
