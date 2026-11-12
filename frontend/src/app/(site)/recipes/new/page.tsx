'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronRight,
  Home,
  Hourglass,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
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
    toast.success('Đã điền gợi ý AI vào nguyên liệu và các bước nấu', {
      description: 'Kiểm tra lại định lượng, liên kết nguyên liệu chuẩn rồi chọn danh mục.',
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

  const isContributor = user?.role === UserRole.CONTRIBUTOR;
  const effectiveSubmittedStatus = createdRecipe?.revisionStatus ?? createdRecipe?.status;
  const isPublished = effectiveSubmittedStatus === PostStatus.PUBLISHED;
  const isFlaggedOrQuarantined =
    effectiveSubmittedStatus === PostStatus.FLAGGED ||
    effectiveSubmittedStatus === PostStatus.QUARANTINED;

  return (
    <AuthGuard>
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link
            href="/"
            className="inline-flex items-center gap-1 transition-colors hover:text-primary"
          >
            <Home className="h-3.5 w-3.5" /> Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/recipes" className="transition-colors hover:text-primary">
            Kho công thức
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">Đăng công thức mới</span>
        </nav>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            Đăng công thức món chay
          </h1>
          <p className="text-sm text-pretty text-muted-foreground">
            {isContributor
              ? 'Năm bước ngắn: thông tin món, nguyên liệu, cách nấu, phân loại rồi xem lại. Công thức của Người đóng góp được tự động duyệt và xuất bản ngay khi đăng.'
              : 'Năm bước ngắn: thông tin món, nguyên liệu, cách nấu, phân loại rồi xem lại. Công thức được Ban biên tập duyệt trước khi xuất bản.'}
          </p>
        </div>

        <RecipeEditorForm
          ref={editorRef}
          formTitle="Đăng công thức mới"
          submitLabel={isContributor ? 'Đăng & xuất bản công thức' : 'Gửi công thức để duyệt'}
          autoPublishEligible={isContributor}
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

        {/* Success Modal (phân nhánh theo trạng thái revision thật do backend trả về) */}
        <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
          <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-x-hidden overflow-y-auto rounded-3xl p-5 sm:max-w-xl sm:p-6">
            <DialogHeader className="w-full min-w-0 items-center gap-3 text-center sm:text-center">
              {isPublished ? (
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-7" />
                </div>
              ) : isFlaggedOrQuarantined ? (
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="size-7" />
                </div>
              ) : (
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Hourglass className="size-7" />
                </div>
              )}

              <DialogTitle className="px-6 text-center text-xl font-bold text-balance text-foreground sm:text-2xl">
                {isPublished
                  ? 'Đăng công thức thành công!'
                  : isFlaggedOrQuarantined
                    ? 'Đã ghi nhận công thức!'
                    : 'Gửi công thức thành công!'}
              </DialogTitle>

              <DialogDescription asChild>
                <div className="min-w-0 text-center text-sm leading-relaxed text-pretty break-words text-muted-foreground">
                  {isPublished ? (
                    <>
                      Công thức{' '}
                      <strong className="font-semibold text-foreground">
                        {createdRecipe?.title}
                      </strong>{' '}
                      đã được xuất bản và hiện ở trạng thái{' '}
                      <Badge
                        variant="outline"
                        className="inline-flex align-middle rounded-full border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      >
                        Đã xuất bản
                      </Badge>
                    </>
                  ) : isFlaggedOrQuarantined ? (
                    <>
                      Công thức{' '}
                      <strong className="font-semibold text-foreground">
                        {createdRecipe?.title}
                      </strong>{' '}
                      đã được ghi nhận vào hệ thống và đang ở trạng thái{' '}
                      <Badge
                        variant="outline"
                        className="inline-flex align-middle rounded-full border-amber-500/30 bg-amber-500/20 text-amber-800 dark:text-amber-300"
                      >
                        Cần rà soát
                      </Badge>
                    </>
                  ) : (
                    <>
                      Công thức{' '}
                      <strong className="font-semibold text-foreground">
                        {createdRecipe?.title}
                      </strong>{' '}
                      đã được ghi nhận vào hệ thống và đang ở trạng thái{' '}
                      <Badge
                        variant="outline"
                        className="inline-flex align-middle rounded-full border-amber-500/30 bg-amber-500/20 text-amber-800 dark:text-amber-300"
                      >
                        Chờ kiểm duyệt
                      </Badge>
                    </>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>

            {isPublished ? (
              <div className="flex w-full min-w-0 flex-col gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-left text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Đã hiển thị công khai trên kho công thức</span>
                </p>
                <p className="leading-relaxed text-pretty">
                  Với vai trò Người đóng góp, công thức của bạn đã được tự động duyệt và chia sẻ
                  ngay tới cộng đồng ăn chay mà không cần chờ kiểm duyệt thủ công.
                </p>
              </div>
            ) : isFlaggedOrQuarantined ? (
              <div className="flex w-full min-w-0 flex-col gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-left text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Cần rà soát nội dung trước khi công khai</span>
                </p>
                <p className="leading-relaxed text-pretty">
                  Hệ thống ghi nhận một số tín hiệu cần kiểm tra thêm. Ban biên tập sẽ xem xét trước
                  khi công thức được xuất bản công khai lên kho công thức.
                </p>
              </div>
            ) : (
              <div className="flex w-full min-w-0 flex-col gap-2 rounded-2xl border border-border/80 bg-muted/50 p-4 text-left text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <ShieldCheck className="size-4 shrink-0 text-primary" />
                  <span>Tiêu chuẩn chất lượng thuần thực vật</span>
                </p>
                <p className="leading-relaxed text-pretty">
                  Nhằm đảm bảo 100% nguyên liệu thuần chay, dinh dưỡng an toàn và định lượng chính
                  xác, công thức sẽ được Ban biên tập thẩm định trước khi xuất bản công khai lên kho
                  công thức.
                </p>
              </div>
            )}

            <DialogFooter className="w-full flex-col gap-2.5 pt-2 sm:flex-row sm:flex-wrap sm:justify-center">
              <Button
                variant="outline"
                className="h-auto min-h-9 w-full whitespace-normal rounded-full px-4 py-2 text-center sm:flex-1"
                onClick={() => router.push('/recipes')}
              >
                Về kho công thức
              </Button>
              {createdRecipe?.id && (
                <Button
                  className="h-auto min-h-9 w-full whitespace-normal rounded-full px-4 py-2 text-center sm:flex-1"
                  onClick={() => router.push(`/recipes/${createdRecipe.id}`)}
                >
                  Xem bài viết của bạn
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
