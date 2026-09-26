'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  CalendarPlus,
  Edit,
  Flame,
  Info,
  Tag as TagIcon,
  Trash2,
  Users,
  Utensils,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  useAttachCustomMealMediaMutation,
  useCustomMealDetailQuery,
  useDeleteCustomMealMediaMutation,
  useDeleteCustomMealMutation,
} from '@/features/custom-meal/queries/custom-meal.queries';
import { CustomMealNutritionBar } from '@/features/custom-meal/components/custom-meal-nutrition-bar';
import { CustomMealPhotoManager } from '@/features/custom-meal/components/custom-meal-photo-manager';
import { CustomMealPhotoUploader } from '@/features/custom-meal/components/custom-meal-photo-uploader';
import { CustomMealDeleteDialog } from '@/features/custom-meal/components/custom-meal-delete-dialog';

export default function CustomMealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';

  const { data: meal, isLoading, isError, refetch } = useCustomMealDetailQuery(id);
  const deleteMutation = useDeleteCustomMealMutation();
  const attachMediaMutation = useAttachCustomMealMediaMutation(id);
  const deleteMediaMutation = useDeleteCustomMealMediaMutation(id);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteMeal = async () => {
    if (!meal) return;
    try {
      await deleteMutation.mutateAsync(meal.id);
      toast.success(`Đã xóa món ăn "${meal.name}" thành công`);
      router.push('/custom-meals');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa món ăn';
      toast.error(msg);
    }
  };

  const handleUploadPhoto = async (file: File) => {
    await attachMediaMutation.mutateAsync({ file });
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deleteMediaMutation.mutateAsync(photoId);
      toast.success('Đã xóa ảnh món ăn thành công');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa ảnh';
      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="md:col-span-2 h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !meal) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <Utensils className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Không tìm thấy món ăn</h2>
        <p className="text-xs text-muted-foreground">
          Món ăn này có thể đã bị xóa hoặc bạn không có quyền xem món ăn của người khác.
        </p>
        <Link href="/custom-meals">
          <Button variant="outline" size="sm" className="text-xs">
            Quay về danh sách món ăn
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      {/* Nút điều hướng & Thao tác */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/custom-meals')}
            className="text-xs gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Tất cả món ăn
          </Button>
          <Badge className="bg-primary/90 text-primary-foreground text-xs shadow-sm">
            Món ăn cá nhân
          </Badge>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link href="/meal-plans">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
              <CalendarPlus className="w-3.5 h-3.5 text-primary" />
              Thực đơn tuần
            </Button>
          </Link>

          <Link href={`/custom-meals/${meal.id}/edit`}>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
              <Edit className="w-3.5 h-3.5" />
              Chỉnh sửa
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-xs gap-1.5 h-8 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa
          </Button>
        </div>
      </div>

      {/* Thông tin tiêu đề chính */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{meal.name}</h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-primary" />
            {meal.servings} khẩu phần
          </span>
          {meal.sourceNote && <span>• Nguồn: {meal.sourceNote}</span>}
          <span>• Cập nhật: {new Date(meal.updatedAt).toLocaleDateString('vi-VN')}</span>
        </div>

        {/* Thẻ tags */}
        {meal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {meal.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-normal bg-primary/10 text-primary px-2.5 py-0.5"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Bố cục 2 cột */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cột trái (2/3): Ảnh & Ghi chú & Nguyên liệu */}
        <div className="md:col-span-2 space-y-6">
          {/* Ảnh bìa chính lớn */}
          {meal.coverPhoto && (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border bg-muted/20 shadow-sm">
              <Image
                src={meal.coverPhoto.url}
                alt={meal.name}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Ghi chú cách làm */}
          {meal.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-primary" />
                  Hướng dẫn & Ghi chú cách làm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs leading-relaxed text-foreground whitespace-pre-line">
                  {meal.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Danh sách nguyên liệu */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-primary" />
                Nguyên liệu chuẩn bị ({meal.ingredients.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meal.ingredients.length === 0 ? (
                <p className="text-xs text-muted-foreground">Chưa có nguyên liệu nào.</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {meal.ingredients.map((ing, idx) => (
                    <div
                      key={ing.id || idx}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{ing.name}</span>
                        {ing.isCustom ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30 px-1 py-0"
                          >
                            Tự do
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-1 py-0"
                          >
                            Chuẩn
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {ing.quantity} {ing.unit}
                        </span>
                        {ing.calculatedNutrients && (
                          <span className="text-[11px] text-orange-600 dark:text-orange-400">
                            (~{Math.round(ing.calculatedNutrients.calories)} kcal)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cột phải (1/3): Dinh dưỡng & Bộ sưu tập ảnh */}
        <div className="space-y-6">
          {/* Thanh tổng hợp dinh dưỡng */}
          <CustomMealNutritionBar
            coverageRatio={meal.coverageRatio}
            calculatedCalories={meal.calculatedCalories}
            calculatedProtein={meal.calculatedProtein}
            calculatedCarbs={meal.calculatedCarbs}
            calculatedFat={meal.calculatedFat}
            userCalories={meal.userCalories}
            unmatchedCount={meal.unmatchedIngredientCount}
            totalIngredientCount={meal.ingredients.length}
          />

          {/* Bộ sưu tập ảnh & Tải thêm ảnh */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Hình ảnh thực tế ({meal.photos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CustomMealPhotoManager photos={meal.photos} onDeletePhoto={handleDeletePhoto} />
              <CustomMealPhotoUploader
                onUpload={handleUploadPhoto}
                currentCount={meal.photos.length}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hộp thoại xóa an toàn */}
      <CustomMealDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        mealName={meal.name}
        onConfirmDelete={handleDeleteMeal}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
