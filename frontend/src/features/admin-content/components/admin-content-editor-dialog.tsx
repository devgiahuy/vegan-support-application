'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryType, CatalogStatus, PostType, VideoSource } from '@/common/enums';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { flattenCategories } from '@/features/category/utils/flatten-categories';
import { ADMIN_CONTENT_TYPE_OPTIONS } from '../types/admin-content.options';
import { RecipeEditorForm } from '@/features/recipe/components/recipe-editor-form';
import type { RecipeFormValues } from '@/features/recipe/schemas/recipe-form.schema';
import { ImageUploader } from '@/features/post/components/image-uploader';
import type { UploadedMediaMeta } from '@/features/post/api/upload.api';
import { StorageQuotaWidget } from '@/features/storage/components/storage-quota-widget';
import { postFormSchema, type PostFormValues } from '@/features/post/schemas/post-form.schema';
import { VideoUploader } from '@/features/video/components/video-uploader';
import { videoFormSchema, type VideoFormValues } from '@/features/video/schemas/video-form.schema';
import {
  useCreateAdminContentMutation,
  useUpdateAdminContentMutation,
} from '../queries/admin-content.queries';
import { adminContentMapper } from '../mappers/admin-content.mapper';
import type { AdminContentDraft } from '../api/admin-content.api';
import type { AdminContentRow } from '../types/admin-content.model';

const CATEGORY_TYPE_BY_POST_TYPE: Record<PostType, CategoryType> = {
  [PostType.RECIPE]: CategoryType.RECIPE_GROUP,
  [PostType.BLOG]: CategoryType.CONTENT_TOPIC,
  [PostType.VIDEO]: CategoryType.CONTENT_TOPIC,
};

interface AdminContentEditorDialogProps {
  open: boolean;
  type: PostType | null;
  mode: 'create' | 'edit';
  initial: AdminContentRow | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  /** Đổi loại khi ở chế độ tạo chưa chọn loại (bước chọn loại, T042). */
  onTypeChange?: (type: PostType) => void;
}

/**
 * Hộp thoại tạo / sửa nội dung của khu vực Quản lý nội dung.
 *
 * Ba nhánh thân theo loại nội dung. Nhánh `RECIPE` **tái sử dụng** `RecipeEditorForm`
 * vì nó uỷ quyền hoàn toàn cho `onSubmit` và không tự điều hướng. Nhánh `BLOG` và
 * `VIDEO` dùng **schema gốc** `postFormSchema` / `videoFormSchema` với biểu mẫu
 * riêng — `PostEditorForm` sở hữu mutation và `router.push()` nên tái dùng nó sẽ
 * đưa quản trị viên rời khỏi tab quản trị (research.md R-08).
 */
export function AdminContentEditorDialog({
  open,
  type,
  mode,
  initial,
  onOpenChange,
  onSaved,
  onTypeChange,
}: AdminContentEditorDialogProps) {
  const createMutation = useCreateAdminContentMutation();
  const updateMutation = useUpdateAdminContentMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleError = React.useCallback((error: unknown) => {
    // Giữ nguyên toàn bộ dữ liệu đã nhập — chỉ báo lỗi, không reset biểu mẫu.
    setFormError(adminContentMapper.mapErrorObject(error));
  }, []);

  const title = mode === 'create' ? 'Tạo nội dung mới' : `Sửa nội dung: ${initial?.title ?? ''}`;

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Nội dung luôn được lưu ở trạng thái bản nháp. Bản sửa cần được quản trị viên khác duyệt
            trước khi công khai.
          </DialogDescription>
        </DialogHeader>

        {/* Hạn mứng dung lượng tài khoản: đã dùng / hạn mức / còn lại (FR-040). */}
        <StorageQuotaWidget variant="compact" className="mx-6 -mb-2" />

        <ScrollArea className="max-h-[65vh] pr-3">
          <div className="space-y-4">
            {formError && (
              <Alert variant="destructive" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {!type && mode === 'create' && (
              <div
                className="grid gap-3 sm:grid-cols-3"
                role="group"
                aria-label="Chọn loại nội dung"
              >
                {ADMIN_CONTENT_TYPE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    className="h-auto flex-col gap-1 py-5"
                    onClick={() => onTypeChange?.(option.value)}
                  >
                    <span className="text-base font-semibold">{option.label}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {option.value === PostType.RECIPE && 'Nguyên liệu, khẩu phần, độ khó'}
                      {option.value === PostType.BLOG && 'Bài viết, hướng dẫn, kiến thức'}
                      {option.value === PostType.VIDEO && 'Video nấu ăn, YouTube hoặc tải lên'}
                    </span>
                  </Button>
                ))}
              </div>
            )}

            {!type && mode !== 'create' && (
              <Alert>
                <AlertDescription>Vui lòng chọn loại nội dung cần tạo.</AlertDescription>
              </Alert>
            )}

            {type === PostType.RECIPE && (
              <RecipeBranch
                mode={mode}
                initial={initial}
                isSubmitting={isSubmitting}
                onOpenChange={onOpenChange}
                onSaved={onSaved}
                onError={handleError}
                updateMutation={updateMutation}
                createMutation={createMutation}
              />
            )}

            {type === PostType.BLOG && (
              <BlogBranch
                mode={mode}
                initial={initial}
                isSubmitting={isSubmitting}
                onOpenChange={onOpenChange}
                onSaved={onSaved}
                onError={handleError}
                updateMutation={updateMutation}
                createMutation={createMutation}
              />
            )}

            {type === PostType.VIDEO && (
              <VideoBranch
                mode={mode}
                initial={initial}
                isSubmitting={isSubmitting}
                onOpenChange={onOpenChange}
                onSaved={onSaved}
                onError={handleError}
                updateMutation={updateMutation}
                createMutation={createMutation}
              />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// Shared
// ==========================================

interface MutationBundle {
  createMutation: ReturnType<typeof useCreateAdminContentMutation>;
  updateMutation: ReturnType<typeof useUpdateAdminContentMutation>;
}

interface BranchProps extends MutationBundle {
  mode: 'create' | 'edit';
  initial: AdminContentRow | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  onError: (error: unknown) => void;
}

/** Chọn chuyên mục đang hoạt động theo loại nội dung. */
function useActiveCategories(type: PostType) {
  const treeQuery = useCategoryTreeQuery(CATEGORY_TYPE_BY_POST_TYPE[type]);
  return React.useMemo(
    () =>
      flattenCategories(treeQuery.data ?? []).filter(
        (category) => category.status === CatalogStatus.ACTIVE
      ),
    [treeQuery.data]
  );
}

function FieldError({ message, id }: { message?: string; id: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

function SubmitRow({ isSubmitting, label }: { isSubmitting: boolean; label: string }) {
  return (
    <DialogFooter>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Đang lưu...' : label}
      </Button>
    </DialogFooter>
  );
}

// ==========================================
// RECIPE — tái sử dụng RecipeEditorForm
// ==========================================

function RecipeBranch({
  mode,
  initial,
  isSubmitting,
  onOpenChange,
  onSaved,
  onError,
  createMutation,
  updateMutation,
}: BranchProps) {
  const handleSubmit = async (values: RecipeFormValues) => {
    try {
      if (mode === 'edit' && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          type: PostType.RECIPE,
          draft: { ...values, version: initial.version } as AdminContentDraft,
        });
      } else {
        await createMutation.mutateAsync({
          type: PostType.RECIPE,
          draft: values as AdminContentDraft,
        });
      }
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      onError(error);
    }
  };

  return (
    <RecipeEditorForm
      key={initial?.id ?? 'new-recipe'}
      postId={initial?.id}
      initialValues={
        initial
          ? ({ title: initial.title, excerpt: initial.title } as Partial<RecipeFormValues>)
          : undefined
      }
      formTitle={mode === 'create' ? 'Tạo công thức mới' : `Sửa công thức: ${initial?.title ?? ''}`}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}

// ==========================================
// BLOG — schema gốc `postFormSchema`
// ==========================================

function BlogBranch({
  mode,
  initial,
  isSubmitting,
  onOpenChange,
  onSaved,
  onError,
  createMutation,
  updateMutation,
}: BranchProps) {
  const categories = useActiveCategories(PostType.BLOG);
  const [coverImageUrl, setCoverImageUrl] = React.useState<string>('');
  const [coverMedia, setCoverMedia] = React.useState<UploadedMediaMeta | null>(null);

  const [categoryId, setCategoryId] = React.useState('');

  const form = useForm<PostFormValues>({
    // `tags` có `.default([])` nên kiểu input/output của resolver lệch nhau; ép kiểu
    // tại đây là cách chuẩn cho react-hook-form + zod v4.
    resolver: zodResolver(postFormSchema) as unknown as Resolver<PostFormValues>,
    defaultValues: {
      title: initial?.title ?? '',
      categoryId: '',
      coverImageUrl: '',
      excerpt: '',
      content: '',
      tags: [],
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const category = categories.find((item) => item.id === values.categoryId);
    const draft = {
      title: values.title,
      excerpt: values.excerpt,
      content: values.content,
      tags: values.tags,
      coverImageUrl: coverImageUrl || undefined,
      coverMedia,
      category,
      version: initial?.version ?? 1,
    };
    try {
      if (mode === 'edit' && initial) {
        await updateMutation.mutateAsync({ id: initial.id, type: PostType.BLOG, draft });
      } else {
        await createMutation.mutateAsync({ type: PostType.BLOG, draft });
      }
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      onError(error);
    }
  });

  const titleError = form.formState.errors.title;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="admin-blog-title">Tiêu đề</Label>
        <Input
          id="admin-blog-title"
          {...form.register('title')}
          aria-invalid={Boolean(titleError)}
          aria-describedby={titleError ? 'admin-blog-title-error' : undefined}
        />
        <FieldError id="admin-blog-title-error" message={titleError?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-blog-category">Chủ đề</Label>
        <Select
          value={categoryId}
          onValueChange={(value) => {
            setCategoryId(value);
            form.setValue('categoryId', value, { shouldValidate: true });
          }}
        >
          <SelectTrigger id="admin-blog-category">
            <SelectValue placeholder="Chọn chủ đề" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError
          id="admin-blog-category-error"
          message={form.formState.errors.categoryId?.message}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-blog-excerpt">Tóm tắt</Label>
        <Textarea
          id="admin-blog-excerpt"
          rows={2}
          {...form.register('excerpt')}
          aria-invalid={Boolean(form.formState.errors.excerpt)}
        />
        <FieldError
          id="admin-blog-excerpt-error"
          message={form.formState.errors.excerpt?.message}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-blog-content">Nội dung</Label>
        <Textarea
          id="admin-blog-content"
          rows={10}
          {...form.register('content')}
          aria-invalid={Boolean(form.formState.errors.content)}
        />
        <FieldError
          id="admin-blog-content-error"
          message={form.formState.errors.content?.message}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-blog-cover">Ảnh bìa</Label>
        <ImageUploader
          value={coverImageUrl}
          onChange={(url, meta) => {
            setCoverImageUrl(url);
            setCoverMedia(meta ?? null);
            form.setValue('coverImageUrl', url, { shouldValidate: true });
          }}
          disabled={isSubmitting}
        />
        <FieldError
          id="admin-blog-cover-error"
          message={form.formState.errors.coverImageUrl?.message}
        />
      </div>

      <SubmitRow
        isSubmitting={isSubmitting}
        label={mode === 'create' ? 'Tạo bài viết' : 'Lưu thay đổi'}
      />
    </form>
  );
}

// ==========================================
// VIDEO — schema gốc `videoFormSchema`
// ==========================================

function VideoBranch({
  mode,
  initial,
  isSubmitting,
  onOpenChange,
  onSaved,
  onError,
  createMutation,
  updateMutation,
}: BranchProps) {
  const categories = useActiveCategories(PostType.VIDEO);
  const [coverImageUrl, setCoverImageUrl] = React.useState<string>('');
  const [coverMedia, setCoverMedia] = React.useState<UploadedMediaMeta | null>(null);
  const [videoUrl, setVideoUrl] = React.useState<string>('');
  const [videoSource, setVideoSource] = React.useState<VideoSource>(VideoSource.CLOUDINARY);
  const [videoMedia, setVideoMedia] = React.useState<UploadedMediaMeta | null>(null);

  const [categoryId, setCategoryId] = React.useState('');

  const form = useForm<VideoFormValues>({
    resolver: zodResolver(videoFormSchema) as unknown as Resolver<VideoFormValues>,
    defaultValues: {
      title: initial?.title ?? '',
      categoryId: '',
      videoUrl: '',
      videoSource: VideoSource.CLOUDINARY,
      description: '',
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const category = categories.find((item) => item.id === values.categoryId);
    const draft = {
      title: values.title,
      description: values.description,
      videoUrl: values.videoUrl,
      videoSource: values.videoSource,
      videoMedia,
      coverImageUrl: coverImageUrl || undefined,
      coverMedia,
      category,
      durationSeconds: values.durationSeconds,
      version: initial?.version ?? 1,
    };
    try {
      if (mode === 'edit' && initial) {
        await updateMutation.mutateAsync({ id: initial.id, type: PostType.VIDEO, draft });
      } else {
        await createMutation.mutateAsync({ type: PostType.VIDEO, draft });
      }
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      onError(error);
    }
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="admin-video-title">Tiêu đề</Label>
        <Input
          id="admin-video-title"
          {...form.register('title')}
          aria-invalid={Boolean(form.formState.errors.title)}
        />
        <FieldError id="admin-video-title-error" message={form.formState.errors.title?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-video-category">Chủ đề</Label>
        <Select
          value={categoryId}
          onValueChange={(value) => {
            setCategoryId(value);
            form.setValue('categoryId', value, { shouldValidate: true });
          }}
        >
          <SelectTrigger id="admin-video-category">
            <SelectValue placeholder="Chọn chủ đề" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError
          id="admin-video-category-error"
          message={form.formState.errors.categoryId?.message}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-video-source">Nguồn video (bắt buộc)</Label>
        <VideoUploader
          value={videoUrl}
          source={videoSource}
          disabled={isSubmitting}
          onChange={(url, source, meta) => {
            setVideoUrl(url);
            setVideoSource(source);
            setVideoMedia(meta ?? null);
            form.setValue('videoUrl', url, { shouldValidate: true });
            form.setValue('videoSource', source);
          }}
        />
        <FieldError
          id="admin-video-source-error"
          message={form.formState.errors.videoUrl?.message}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-video-description">Mô tả</Label>
        <Textarea
          id="admin-video-description"
          rows={6}
          {...form.register('description')}
          aria-invalid={Boolean(form.formState.errors.description)}
        />
        <FieldError
          id="admin-video-description-error"
          message={form.formState.errors.description?.message}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-video-cover">Ảnh bìa</Label>
        <ImageUploader
          value={coverImageUrl}
          onChange={(url, meta) => {
            setCoverImageUrl(url);
            setCoverMedia(meta ?? null);
            form.setValue('coverImageUrl', url, { shouldValidate: true });
          }}
          disabled={isSubmitting}
        />
      </div>

      <SubmitRow
        isSubmitting={isSubmitting}
        label={mode === 'create' ? 'Tạo video' : 'Lưu thay đổi'}
      />
    </form>
  );
}
