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

interface RecipeEditorFormProps {
  initialValues?: Partial<RecipeFormValues>;
  onSubmit: (values: RecipeFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  formTitle?: string;
}

export function RecipeEditorForm({
  initialValues,
  onSubmit,
  isSubmitting = false,
  formTitle = 'Đăng công thức món chay mới',
}: RecipeEditorFormProps) {
  const { data: categoryTree = [] } = useCategoryTreeQuery(CategoryType.RECIPE_GROUP);
  const flatCategories = React.useMemo(() => flattenCategories(categoryTree), [categoryTree]);

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      title: initialValues?.title || '',
      categoryId: initialValues?.categoryId || '',
      coverImageUrl: initialValues?.coverImageUrl || '',
      difficulty: initialValues?.difficulty || RecipeDifficulty.MEDIUM,
      servings: initialValues?.servings || 2,
      prepTimeMinutes: initialValues?.prepTimeMinutes ?? 15,
      cookTimeMinutes: initialValues?.cookTimeMinutes ?? 20,
      dietTag: initialValues?.dietTag || 'Thuần chay',
      description: initialValues?.description || '',
      ingredients: initialValues?.ingredients || [
        { name: 'Đậu hũ non', amount: 200, unit: 'gram', notes: 'Cắt quân cờ' },
        { name: 'Nấm rơm', amount: 150, unit: 'gram', notes: 'Rửa sạch ngâm nước muối' },
      ],
      steps: initialValues?.steps || [
        {
          stepNumber: 1,
          instruction: 'Sơ chế sạch các nguyên liệu, để ráo nước.',
          tip: 'Ngâm nấm vào nước muối loãng để giữ độ giòn ngọt.',
        },
        {
          stepNumber: 2,
          instruction: 'Đun nóng chảo, xào thơm nấm và gia vị vừa ăn.',
          tip: 'Không đảo mạnh tránh làm vỡ đậu hũ non.',
        },
      ],
      nutrition: initialValues?.nutrition || {
        calories: 250,
        protein: 14,
        carbs: 32,
        fat: 8,
        fiber: 6,
        vitaminB12: 0.5,
      },
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
                className="h-11 rounded-xl"
                {...form.register('servings', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prepTimeMinutes" className="font-semibold">
                Thời gian sơ chế (phút)
              </Label>
              <Input
                id="prepTimeMinutes"
                type="number"
                min={0}
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
                  meta?.publicId && meta?.mimeType && meta?.bytes
                    ? { publicId: meta.publicId, mimeType: meta.mimeType, bytes: meta.bytes }
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
                amount: 100,
                unit: 'gram',
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
                  placeholder="Ví dụ: Giữ lửa nhỏ để nấm ngấm đều gia vị..."
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

      {/* 4. PHÂN TÍCH DINH DƯỠNG ƯỚC TÍNH */}
      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" /> 4. Dinh dưỡng ước tính (cho 1 khẩu phần)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Năng lượng (kcal)</Label>
              <Input
                type="number"
                className="h-10 rounded-lg text-sm"
                {...form.register('nutrition.calories', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Chất đạm (Protein - g)</Label>
              <Input
                type="number"
                step="any"
                className="h-10 rounded-lg text-sm"
                {...form.register('nutrition.protein', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Carbs (g)</Label>
              <Input
                type="number"
                step="any"
                className="h-10 rounded-lg text-sm"
                {...form.register('nutrition.carbs', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Chất béo (g)</Label>
              <Input
                type="number"
                step="any"
                className="h-10 rounded-lg text-sm"
                {...form.register('nutrition.fat', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Chất xơ (g)</Label>
              <Input
                type="number"
                step="any"
                className="h-10 rounded-lg text-sm"
                {...form.register('nutrition.fiber', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vitamin B12 (mcg)</Label>
              <Input
                type="number"
                step="any"
                className="h-10 rounded-lg text-sm"
                {...form.register('nutrition.vitaminB12', { valueAsNumber: true })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
