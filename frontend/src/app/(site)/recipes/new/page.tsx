'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Home, ChevronRight, CheckCircle2, Hourglass, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  RecipeEditorForm,
  RecipeEditorFormHandle,
} from '@/features/recipe/components/recipe-editor-form';
import { AiRecipeDraftAssistant } from '@/features/recipe/components/ai-recipe-draft-assistant';
import { OverwriteConfirmDialog } from '@/features/recipe/components/overwrite-confirm-dialog';
import { recipeDraftMapper } from '@/features/recipe/mappers/recipe-draft.mapper';
import type { RecipeDraftSuggestion } from '@/features/recipe/types/recipe-draft.model';
import { AuthGuard } from '@/components/shared/auth-guard';
import {
  RecipeSubmitForReviewError,
  useCreateAndSubmitRecipeMutation,
} from '@/features/recipe/queries/recipe.queries';
import { POST_QUERY_KEYS } from '@/features/post/queries/post.queries';
import { addTrackedUserPost } from '@/features/post/utils/user-posts-tracker';
import type { RecipeFormValues } from '@/features/recipe/schemas/recipe-form.schema';
import type { Recipe } from '@/features/recipe/types/recipe.model';
import { recipeFormToRecipe } from '@/features/recipe/utils/recipe-form-values';
import { useAuthStore } from '@/store/useAuthStore';
import { PostStatus, UserRole } from '@/common/enums';
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
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const createRecipeMutation = useCreateAndSubmitRecipeMutation();
  const [createdRecipe, setCreatedRecipe] = React.useState<Recipe | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = React.useState(false);

  // AI draft hydration & overwrite protection
  const editorRef = React.useRef<RecipeEditorFormHandle>(null);
  const [pendingDraft, setPendingDraft] = React.useState<RecipeDraftSuggestion | null>(null);
  const [overwriteConfirmOpen, setOverwriteConfirmOpen] = React.useState(false);

  const applyDraftToEditor = (draft: RecipeDraftSuggestion) => {
    const formVals = recipeDraftMapper.toFormValues(draft);
    editorRef.current?.setDraftValues(formVals);
    // Khẩu phần/thời gian đã nhập được giữ; nếu AI đề xuất khác thì chỉ báo để tham khảo.
    const timingHint = recipeDraftMapper.timingHint(draft);
    toast.success('Đã điền gợi ý AI vào nguyên liệu và các bước nấu', {
      description: [
        'Kiểm tra lại định lượng, liên kết nguyên liệu chuẩn rồi chọn danh mục.',
        timingHint,
      ]
        .filter(Boolean)
        .join(' '),
    });
  };

  const handleApplyDraft = (draft: RecipeDraftSuggestion) => {
    const hasContent = editorRef.current?.hasUserContent?.() ?? false;
    if (hasContent) {
      setPendingDraft(draft);
      setOverwriteConfirmOpen(true);
    } else {
      applyDraftToEditor(draft);
    }
  };

  const handleConfirmOverwrite = () => {
    if (pendingDraft) {
      applyDraftToEditor(pendingDraft);
      setPendingDraft(null);
    }
  };

  const trackCreated = (created: Recipe, fallbackTitle: string) => {
    void queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.mineRoot() });
    if (created.id && user?.id) {
      addTrackedUserPost(user.id, {
        id: created.id,
        type: 'RECIPE',
        title: created.title || fallbackTitle,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleSubmit = async (values: RecipeFormValues) => {
    // Tạo + gửi kiểm duyệt trong một thao tác; toast do mutation hiển thị.
    try {
      const created = await createRecipeMutation.mutateAsync(recipeFormToRecipe(values));
      trackCreated(created, values.title);
      setCreatedRecipe(created);
      setIsSuccessModalOpen(true);
    } catch (error) {
      if (error instanceof RecipeSubmitForReviewError && error.recipe.id) {
        // Đã lưu nháp: chuyển sang trang sửa, nơi có nút "Gửi kiểm duyệt" để thử lại.
        trackCreated(error.recipe, values.title);
        router.push(`/recipes/${error.recipe.id}/edit`);
        return;
      }
      // Ném tiếp để form đưa người dùng về bước cần sửa.
      throw error;
    }
  };

  const isModerator = user?.role === UserRole.ADMIN || user?.role === UserRole.CONTRIBUTOR;
  // Trạng thái lấy từ phản hồi gửi: Contributor/Admin đủ dinh dưỡng thì được xuất bản ngay.
  const isPublished = createdRecipe?.status === PostStatus.PUBLISHED;

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
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            Đăng công thức món chay
          </h1>
          <p className="text-sm text-pretty text-muted-foreground">
            Năm bước ngắn: thông tin món, nguyên liệu, cách nấu, phân loại rồi xem lại.{' '}
            {isModerator
              ? 'Tài khoản của bạn đăng là xuất bản ngay, cần nhập đủ dinh dưỡng mỗi khẩu phần.'
              : 'Công thức được Ban biên tập duyệt trước khi xuất bản.'}
          </p>
        </div>

        <RecipeEditorForm
          ref={editorRef}
          formTitle="Đăng công thức mới"
          submitLabel={isModerator ? 'Đăng & xuất bản' : 'Gửi công thức để duyệt'}
          onSubmit={handleSubmit}
          isSubmitting={createRecipeMutation.isPending}
          renderAssistant={(seed, { editBasics }) => (
            <AiRecipeDraftAssistant
              seed={seed}
              onApplyDraft={handleApplyDraft}
              onEditBasics={editBasics}
            />
          )}
        />

        {/* Overwrite Confirmation Modal */}
        <OverwriteConfirmDialog
          open={overwriteConfirmOpen}
          onOpenChange={setOverwriteConfirmOpen}
          onConfirm={handleConfirmOverwrite}
        />

        {/* Success / Pending Review Modal */}
        <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
          <DialogContent className="sm:max-w-lg rounded-3xl p-6">
            <DialogHeader className="space-y-3">
              {isPublished ? (
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
              ) : (
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Hourglass className="h-7 w-7" />
                </div>
              )}
              <DialogTitle className="text-center text-xl sm:text-2xl font-bold text-foreground">
                {isPublished ? 'Đăng công thức thành công!' : 'Gửi công thức thành công!'}
              </DialogTitle>
              <DialogDescription className="text-center text-sm text-muted-foreground leading-relaxed">
                Công thức <strong>{createdRecipe?.title}</strong> đã được ghi nhận vào hệ thống và
                đang ở trạng thái{' '}
                {isPublished ? (
                  <Badge className="rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30">
                    Đã xuất bản
                  </Badge>
                ) : (
                  <Badge className="rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30">
                    Chờ kiểm duyệt
                  </Badge>
                )}
              </DialogDescription>
            </DialogHeader>

            {!isPublished && (
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
                    Bộ lọc tự động đã gắn cờ nội dung này nên công thức cần Quản trị viên duyệt
                    trước khi xuất bản.
                  </p>
                )}
              </div>
            )}

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
              {isModerator && !isPublished && (
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
