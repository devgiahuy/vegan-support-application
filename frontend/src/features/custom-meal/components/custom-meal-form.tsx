'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import type { CreateCustomMealRequestDto } from '../types/custom-meal.dto';
import type { CustomMeal } from '../types/custom-meal.model';
import { CustomMealTagInput } from './custom-meal-tag-input';
import { CustomMealIngredientInput, type IngredientRow } from './custom-meal-ingredient-input';
import { CustomMealNutritionBar } from './custom-meal-nutrition-bar';
import { CustomMealPhotoManager } from './custom-meal-photo-manager';
import { CustomMealPhotoUploader } from './custom-meal-photo-uploader';

interface CustomMealFormProps {
  initialData?: CustomMeal;
  onSubmit: (data: CreateCustomMealRequestDto) => Promise<void>;
  isSubmitting?: boolean;
  onUploadPhoto?: (file: File) => Promise<void>;
  onDeletePhoto?: (photoId: string) => Promise<void>;
}

export const CustomMealForm: React.FC<CustomMealFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  onUploadPhoto,
  onDeletePhoto,
}) => {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || '');
  const [servings, setServings] = useState<number>(initialData?.servings || 1);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [sourceNote, setSourceNote] = useState(initialData?.sourceNote || '');

  // Dinh dưỡng ước tính cá nhân
  const [userCalories, setUserCalories] = useState<string>(
    initialData?.userCalories !== null && initialData?.userCalories !== undefined
      ? String(initialData.userCalories)
      : ''
  );
  const [userProtein, setUserProtein] = useState<string>(
    initialData?.userProtein !== null && initialData?.userProtein !== undefined
      ? String(initialData.userProtein)
      : ''
  );
  const [userCarbs, setUserCarbs] = useState<string>(
    initialData?.userCarbs !== null && initialData?.userCarbs !== undefined
      ? String(initialData.userCarbs)
      : ''
  );
  const [userFat, setUserFat] = useState<string>(
    initialData?.userFat !== null && initialData?.userFat !== undefined
      ? String(initialData.userFat)
      : ''
  );

  // Thẻ cá nhân
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);

  // Danh sách nguyên liệu
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    initialData?.ingredients?.map((ing) => ({
      ingredientId: ing.ingredientId,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
    })) || [{ ingredientId: null, name: '', quantity: 100, unit: 'g' }]
  );

  // Lỗi xác thực
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập tên món ăn';
    } else if (name.trim().length > 100) {
      newErrors.name = 'Tên món ăn không được vượt quá 100 ký tự';
    }

    if (!servings || servings < 1) {
      newErrors.servings = 'Số khẩu phần phải lớn hơn hoặc bằng 1';
    }

    // Kiểm tra nguyên liệu
    const validIngredients = ingredients.filter((ing) => ing.name.trim().length > 0);
    if (validIngredients.length === 0) {
      newErrors.ingredients = 'Vui lòng thêm ít nhất 1 nguyên liệu có tên';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại các trường thông tin bị lỗi.');
      return;
    }

    const payload: CreateCustomMealRequestDto = {
      name: name.trim(),
      servings: Number(servings),
      notes: notes.trim() || null,
      sourceNote: sourceNote.trim() || null,
      userCalories: userCalories ? parseFloat(userCalories) : null,
      userProtein: userProtein ? parseFloat(userProtein) : null,
      userCarbs: userCarbs ? parseFloat(userCarbs) : null,
      userFat: userFat ? parseFloat(userFat) : null,
      tags,
      ingredients: ingredients
        .filter((ing) => ing.name.trim().length > 0)
        .map((ing) => ({
          ingredientId: ing.ingredientId || null,
          name: ing.name.trim(),
          quantity: Number(ing.quantity) || 0,
          unit: ing.unit.trim() || 'g',
        })),
    };

    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu món ăn';
      toast.error(msg);
    }
  };

  // Tính sơ bộ thông số dinh dưỡng hiển thị
  const validIngredients = ingredients.filter((ing) => ing.name.trim().length > 0);
  const unmatchedCount = validIngredients.filter((ing) => !ing.ingredientId).length;
  const coverageRatio =
    validIngredients.length > 0
      ? (validIngredients.length - unmatchedCount) / validIngredients.length
      : 1;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Header nút quay lại và hành động */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-xs gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại
        </Button>

        <Button type="submit" disabled={isSubmitting} className="gap-1.5 text-xs h-9">
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Đang lưu món ăn...
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              Lưu món ăn cá nhân
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cột trái: Thông tin chính & Nguyên liệu */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Thông tin món ăn cá nhân</CardTitle>
              <CardDescription className="text-xs">
                Món ăn này hoàn toàn riêng tư, chỉ có bạn mới xem và dùng được trong thực đơn tuần.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tên món */}
              <div className="space-y-1.5">
                <Label htmlFor="meal-name" className="text-xs font-semibold">
                  Tên món ăn <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="meal-name"
                  placeholder="Ví dụ: Salad bơ sốt mè rang, Bún chả chay..."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  disabled={isSubmitting}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              {/* Số khẩu phần & Nguồn gốc */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="meal-servings" className="text-xs font-semibold">
                    Số khẩu phần ăn <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="meal-servings"
                    type="number"
                    min="1"
                    value={servings}
                    onChange={(e) => setServings(parseInt(e.target.value, 10) || 1)}
                    disabled={isSubmitting}
                    className={errors.servings ? 'border-destructive' : ''}
                  />
                  {errors.servings && <p className="text-xs text-destructive">{errors.servings}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="meal-source" className="text-xs font-semibold">
                    Ghi chú nguồn gốc (tùy chọn)
                  </Label>
                  <Input
                    id="meal-source"
                    placeholder="Ví dụ: Mẹ dạy, Tự sáng chế, Học trên mạng..."
                    value={sourceNote}
                    onChange={(e) => setSourceNote(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Cách làm / Ghi chú */}
              <div className="space-y-1.5">
                <Label htmlFor="meal-notes" className="text-xs font-semibold">
                  Ghi chú cách chế biến (tùy chọn)
                </Label>
                <Textarea
                  id="meal-notes"
                  placeholder="Mô tả sơ lược các bước chế biến hoặc mẹo nấu nướng để tiện nhớ..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Phần Nguyên liệu */}
          <Card>
            <CardContent className="p-4">
              <CustomMealIngredientInput
                ingredients={ingredients}
                onChange={setIngredients}
                disabled={isSubmitting}
              />
              {errors.ingredients && (
                <p className="text-xs text-destructive mt-2">{errors.ingredients}</p>
              )}
            </CardContent>
          </Card>

          {/* Thẻ cá nhân (User Tags) */}
          <Card>
            <CardContent className="p-4">
              <CustomMealTagInput tags={tags} onChange={setTags} disabled={isSubmitting} />
            </CardContent>
          </Card>
        </div>

        {/* Cột phải: Dinh dưỡng & Hình ảnh */}
        <div className="space-y-6">
          {/* Bảng Dinh dưỡng */}
          <CustomMealNutritionBar
            coverageRatio={coverageRatio}
            calculatedCalories={initialData?.calculatedCalories || null}
            calculatedProtein={initialData?.calculatedProtein || null}
            calculatedCarbs={initialData?.calculatedCarbs || null}
            calculatedFat={initialData?.calculatedFat || null}
            userCalories={userCalories ? parseFloat(userCalories) : null}
            unmatchedCount={unmatchedCount}
            totalIngredientCount={validIngredients.length}
          />

          {/* Ước tính dinh dưỡng người dùng */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Tự điền dinh dưỡng ước tính
              </CardTitle>
              <CardDescription className="text-[11px]">
                Dành cho đồ hộp hoặc sản phẩm có nhãn năng lượng sẵn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="user-calories" className="text-[11px] text-muted-foreground">
                  Năng lượng (kcal)
                </Label>
                <Input
                  id="user-calories"
                  type="number"
                  placeholder="kcal"
                  value={userCalories}
                  onChange={(e) => setUserCalories(e.target.value)}
                  disabled={isSubmitting}
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="user-protein" className="text-[10px] text-muted-foreground">
                    Đạm (g)
                  </Label>
                  <Input
                    id="user-protein"
                    type="number"
                    step="0.1"
                    placeholder="g"
                    value={userProtein}
                    onChange={(e) => setUserProtein(e.target.value)}
                    disabled={isSubmitting}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="user-carbs" className="text-[10px] text-muted-foreground">
                    Carbs (g)
                  </Label>
                  <Input
                    id="user-carbs"
                    type="number"
                    step="0.1"
                    placeholder="g"
                    value={userCarbs}
                    onChange={(e) => setUserCarbs(e.target.value)}
                    disabled={isSubmitting}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="user-fat" className="text-[10px] text-muted-foreground">
                    Béo (g)
                  </Label>
                  <Input
                    id="user-fat"
                    type="number"
                    step="0.1"
                    placeholder="g"
                    value={userFat}
                    onChange={(e) => setUserFat(e.target.value)}
                    disabled={isSubmitting}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quản lý ảnh đính kèm (chỉ hiển thị khi cập nhật món hoặc có onUploadPhoto) */}
          {initialData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold">Hình ảnh món ăn</CardTitle>
                <CardDescription className="text-[11px]">
                  Tải lên ảnh thực tế có kiểm soát hạn ngạch lưu trữ.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <CustomMealPhotoManager
                  photos={initialData.photos}
                  onDeletePhoto={onDeletePhoto}
                  disabled={isSubmitting}
                />
                {onUploadPhoto && (
                  <CustomMealPhotoUploader
                    onUpload={onUploadPhoto}
                    currentCount={initialData.photos.length}
                    disabled={isSubmitting}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
};
