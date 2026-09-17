'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ChevronRight, Sparkles, Hourglass, ShieldCheck } from 'lucide-react';
import { RecipeEditorForm } from '@/features/recipe/components/recipe-editor-form';
import { AuthGuard } from '@/components/shared/auth-guard';
import { useCreateRecipeMutation } from '@/features/recipe/queries/recipe.queries';
import type { RecipeFormValues } from '@/features/recipe/schemas/recipe-form.schema';
import type { Recipe } from '@/features/recipe/types/recipe.model';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/common/enums';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CreateRecipePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createRecipeMutation = useCreateRecipeMutation();
  const [createdRecipe, setCreatedRecipe] = React.useState<Recipe | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = React.useState(false);

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
      if (created?.status === 'PENDING_REVIEW') {
        setCreatedRecipe(created);
        setIsSuccessModalOpen(true);
      } else if (created?.id) {
        router.push(`/recipes/${created.id}`);
      } else {
        router.push('/recipes');
      }
    } catch {
      // Toast notification is handled in mutation onError
    }
  };

  const isModerator = user?.role === UserRole.ADMIN || user?.role === UserRole.CONTRIBUTOR;

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
            <Sparkles className="h-3.5 w-3.5" /> Sáng tạo &amp; Lan tỏa món chay
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

        {/* Success / Pending Review Modal */}
        <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
          <DialogContent className="sm:max-w-lg rounded-3xl p-6">
            <DialogHeader className="space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Hourglass className="h-7 w-7" />
              </div>
              <DialogTitle className="text-center text-xl sm:text-2xl font-bold text-foreground">
                Gửi công thức thành công!
              </DialogTitle>
              <DialogDescription className="text-center text-sm text-muted-foreground leading-relaxed">
                Công thức <strong>{createdRecipe?.title}</strong> đã được ghi nhận vào hệ thống và
                đang ở trạng thái{' '}
                <Badge className="rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30">
                  Chờ kiểm duyệt
                </Badge>
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border border-border/80 bg-muted/50 p-4 text-xs text-muted-foreground space-y-2 my-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                <ShieldCheck className="h-4 w-4 text-primary" /> Tiêu chuẩn chất lượng thuần thực
                vật
              </p>
              <p className="leading-relaxed">
                Nhằm đảm bảo 100% nguyên liệu thuần chay, dinh dưỡng an toàn và định lượng chính
                xác, công thức sẽ được Ban biên tập thẩm định trước khi xuất bản công khai lên kho
                công thức.
              </p>
              {isModerator && (
                <p className="font-medium text-primary pt-1 border-t border-border/50">
                  Tài khoản của bạn có quyền kiểm duyệt. Bạn có thể mở Bảng điều khiển để phê duyệt
                  công thức này ngay bây giờ.
                </p>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2.5 mt-4">
              <Button
                variant="outline"
                className="rounded-full flex-1"
                onClick={() => router.push('/recipes')}
              >
                Về kho công thức
              </Button>
              {createdRecipe?.id && (
                <Button
                  className="rounded-full flex-1"
                  onClick={() => router.push(`/recipes/${createdRecipe.id}`)}
                >
                  Xem bài viết của bạn
                </Button>
              )}
              {isModerator && (
                <Button
                  variant="secondary"
                  className="rounded-full flex-1"
                  onClick={() =>
                    router.push(
                      user?.role === UserRole.ADMIN
                        ? '/admin/dashboard?tab=queue'
                        : '/contributor/dashboard'
                    )
                  }
                >
                  Phê duyệt ngay
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
