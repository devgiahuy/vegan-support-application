'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Utensils,
  Clock,
  Flame,
  Plus,
  Trash2,
  Save,
  Send,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryType, RecipeDifficulty } from '@/common/enums';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { flattenCategories } from '@/features/category/utils/flatten-categories';
import { ImageUploader } from '@/features/post/components/image-uploader';
import { recipeFormSchema, RecipeFormValues } from '../schemas/recipe-form.schema';
import { RecipeIngredientRow } from './recipe-ingredient-row';
import { RecipeNutritionPreviewDrawer } from '@/features/recipe-nutrition/components/recipe-nutrition-preview-drawer';

interface RecipeEditorFormProps {
  postId?: string;
  initialValues?: Partial<RecipeFormValues>;
  onSubmit: (values: RecipeFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  formTitle?: string;
}

export function RecipeEditorForm({
  postId,
  initialValues,
  onSubmit,
  isSubmitting = false,
  formTitle = 'Đăng công thức món chay mới',
}: RecipeEditorFormProps) {
  const [previewDrawerOpen, setPreviewDrawerOpen] = React.useState(false);
  const { data: categoryTree = [] } = useCategoryTreeQuery(CategoryType.RECIPE_GROUP);
  const flatCategories = React.useMemo(() => flattenCategories(categoryTree), [categoryTree]);

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      title: initialValues?.title || '',
      categoryId: initialValues?.categoryId || '',
      coverImageUrl: initialValues?.coverImageUrl || '',
      difficulty: initialValues?.difficulty || RecipeDifficulty.MEDIUM,
      servings: initialValues?.servings ?? ('' as unknown as number),
      prepTimeMinutes: initialValues?.prepTimeMinutes ?? ('' as unknown as number),
      cookTimeMinutes: initialValues?.cookTimeMinutes ?? ('' as unknown as number),
      dietTag: initialValues?.dietTag || 'Thuần chay',
      description: initialValues?.description || '',
      ingredients:
        initialValues?.ingredients && initialValues.ingredients.length > 0
          ? initialValues.ingredients
          : [
              {
                name: '',
                ingredientId: null,
                amount: '' as unknown as number,
                unit: '',
                notes: '',
              },
            ],
      steps:
        initialValues?.steps && initialValues.steps.length > 0
          ? initialValues.steps
          : [
              {
                stepNumber: 1,
                instruction: '',
                tip: '',
              },
            ],
      nutrition: initialValues?.nutrition,
    },
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control: form.control,
    name: 'ingredients',
  });

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({
    control: form.control,
    name: 'steps',
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* 1. THÔNG TIN CHUNG */}
      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" /> 1. Thông tin chung của món ăn
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-semibold">
              Tên món ăn / Tiêu đề công thức <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ví dụ: Đậu hũ sốt nấm đông cô thanh đạm"
              className="h-11 rounded-xl"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-semibold">
                Danh mục món ăn <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch('categoryId')}
                onValueChange={(val) => form.setValue('categoryId', val, { shouldValidate: true })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="-- Chọn danh mục món chay --" />
                </SelectTrigger>
                <SelectContent>
                  {flatCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.categoryId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.categoryId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Độ khó chế biến</Label>
              <Select
                value={form.watch('difficulty')}
                onValueChange={(val) =>
                  form.setValue('difficulty', val as RecipeDifficulty, { shouldValidate: true })
                }
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Độ khó" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RecipeDifficulty.EASY}>Dễ (Người mới)</SelectItem>
                  <SelectItem value={RecipeDifficulty.MEDIUM}>Trung bình</SelectItem>
                  <SelectItem value={RecipeDifficulty.HARD}>Nâng cao (Đầu bếp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="servings" className="font-semibold">
                Khẩu phần (số người)
              </Label>
              <Input
                id="servings"
                type="number"
                min={1}
                placeholder="Ví dụ: 4"
                className="h-11 rounded-xl"
                {...form.register('servings', { valueAsNumber: true })}
              />
              {form.formState.errors.servings && (
                <p className="text-xs text-destructive">{form.formState.errors.servings.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prepTimeMinutes" className="font-semibold">
                Thời gian sơ chế (phút)
              </Label>
              <Input
                id="prepTimeMinutes"
                type="number"
                min={0}
                placeholder="Ví dụ: 15"
                className="h-11 rounded-xl"
                {...form.register('prepTimeMinutes', { valueAsNumber: true })}
              />
              {form.formState.errors.prepTimeMinutes && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.prepTimeMinutes.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cookTimeMinutes" className="font-semibold">
                Thời gian nấu (phút)
              </Label>
              <Input
                id="cookTimeMinutes"
                type="number"
                min={0}
                placeholder="Ví dụ: 25"
                className="h-11 rounded-xl"
                {...form.register('cookTimeMinutes', { valueAsNumber: true })}
              />
              {form.formState.errors.cookTimeMinutes && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.cookTimeMinutes.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Ảnh bìa món ăn</Label>
            <ImageUploader
              value={form.watch('coverImageUrl')}
              onChange={(url, meta) => {
                form.setValue('coverImageUrl', url, { shouldValidate: true });
                form.setValue(
                  'coverMedia',
                  meta?.assetId || (meta?.publicId && meta?.mimeType && meta?.bytes)
                    ? {
                        assetId: meta?.assetId,
                        publicId: meta?.publicId,
                        mimeType: meta?.mimeType,
                        bytes: meta?.bytes,
                      }
                    : null,
                  { shouldValidate: true }
                );
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-semibold">
              Mô tả ngắn cảm hứng món ăn
            </Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Chia sẻ lý do bạn sáng tạo món ăn này hoặc dịp thưởng thức phù hợp..."
              className="rounded-xl resize-none"
              {...form.register('description')}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. NGUYÊN LIỆU ĐỊNH LƯỢNG */}
      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" /> 2. Danh sách nguyên liệu định lượng
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Nhập tên và chọn nguyên liệu từ gợi ý để hệ thống liên kết chuẩn và bảo chứng an toàn
              ăn chay.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendIngredient({
                name: '',
                ingredientId: null,
                amount: '' as unknown as number,
                unit: '',
                notes: '',
              })
            }
            className="rounded-xl gap-1.5"
          >
            <Plus className="h-4 w-4" /> Thêm nguyên liệu
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">
                Mẹo hiển thị an toàn cho mọi tài khoản:
              </p>
              <p className="mt-0.5">
                Khi gõ tên nguyên liệu, hãy nhấp chọn từ danh sách{' '}
                <strong>Gợi ý nguyên liệu chuẩn</strong>. Các nguyên liệu chuẩn giúp công thức hiển
                thị được cho các thành viên có cài đặt chế độ ăn kiêng nghiêm ngặt (Thuần chay,
                tránh dị ứng...).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {ingredientFields.map((field, idx) => (
              <RecipeIngredientRow
                key={field.id}
                index={idx}
                form={form}
                onRemove={() => removeIngredient(idx)}
                canRemove={ingredientFields.length > 1}
              />
            ))}
          </div>

          {form.formState.errors.ingredients && (
            <p className="text-xs text-destructive">{form.formState.errors.ingredients.message}</p>
          )}
        </CardContent>
      </Card>

      {/* 3. CÁC BƯỚC THỰC HIỆN */}
      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> 3. Các bước thực hiện tuần tự
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendStep({
                stepNumber: stepFields.length + 1,
                instruction: '',
                tip: '',
              })
            }
            className="rounded-xl gap-1.5"
          >
            <Plus className="h-4 w-4" /> Thêm bước
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {stepFields.map((field, idx) => (
            <div key={field.id} className="p-4 rounded-xl border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                  {idx + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(idx)}
                  disabled={stepFields.length <= 1}
                  className="h-7 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa bước này
                </Button>
              </div>

              <div className="space-y-1">
                <Textarea
                  placeholder={`Mô tả chi tiết bước ${idx + 1}...`}
                  rows={3}
                  className="rounded-lg resize-none"
                  {...form.register(`steps.${idx}.instruction`)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <Lightbulb className="h-3.5 w-3.5" /> Mẹo nhỏ cho bước này (tùy chọn)
                </div>
                <Input
                  placeholder="Mẹo nhỏ tùy chọn cho bước này..."
                  className="h-9 rounded-lg text-xs"
                  {...form.register(`steps.${idx}.tip`)}
                />
              </div>
            </div>
          ))}
          {form.formState.errors.steps && (
            <p className="text-xs text-destructive">{form.formState.errors.steps.message}</p>
          )}
        </CardContent>
      </Card>

      {/* 4. DINH DƯỠNG & NĂNG LƯỢNG TỰ ĐỘNG */}
      <Card className="rounded-2xl border-border/80 shadow-sm bg-muted/20">
        <CardHeader className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Flame className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              4. Phân tích Dinh dưỡng tự động
            </CardTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bạn không cần tính toán thủ công. Hệ thống sẽ tự động đối soát nguyên liệu và phương
              pháp nấu để ước tính vi chất, năng lượng và cảnh báo kiêng kỵ sau khi lưu công thức.
            </p>
          </div>
          {postId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewDrawerOpen(true)}
              className="rounded-xl text-xs shrink-0 inline-flex items-center gap-1.5 border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem trước tính toán chi tiết</span>
            </Button>
          )}
        </CardHeader>
      </Card>

      {/* Drawer xem trước dinh dưỡng nấu nướng */}
      {postId && (
        <RecipeNutritionPreviewDrawer
          postId={postId}
          isOpen={previewDrawerOpen}
          onClose={() => setPreviewDrawerOpen(false)}
        />
      )}

      {/* Nút gửi */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="rounded-2xl gap-2 font-bold px-8 shadow-md shadow-primary/20"
        >
          <Send className="h-5 w-5" />
          {isSubmitting ? 'Đang gửi công thức...' : 'Gửi công thức xuất bản'}
        </Button>
      </div>
    </form>
  );
}
