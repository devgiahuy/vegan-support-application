'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  useAttachCustomMealMediaMutation,
  useCustomMealDetailQuery,
  useDeleteCustomMealMediaMutation,
  useUpdateCustomMealMutation,
} from '@/features/custom-meal/queries/custom-meal.queries';
import { CustomMealForm } from '@/features/custom-meal/components/custom-meal-form';
import type { CreateCustomMealRequestDto } from '@/features/custom-meal/types/custom-meal.dto';

export default function EditCustomMealPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';

  const { data: meal, isLoading, isError } = useCustomMealDetailQuery(id);
  const updateMutation = useUpdateCustomMealMutation(id);
  const attachMediaMutation = useAttachCustomMealMediaMutation(id);
  const deleteMediaMutation = useDeleteCustomMealMediaMutation(id);

  const handleUpdate = async (data: CreateCustomMealRequestDto) => {
    const updated = await updateMutation.mutateAsync(data);
    toast.success(`Đã cập nhật món ăn "${updated.name}" thành công!`);
    router.push(`/custom-meals/${updated.id}`);
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
        <Skeleton className="h-96 rounded-xl" />
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
          Món ăn này có thể đã bị xóa hoặc bạn không có quyền chỉnh sửa.
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
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Chỉnh sửa món ăn: {meal.name}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Cập nhật thông tin định lượng, ảnh chụp thực tế hoặc thẻ phân loại.
        </p>
      </div>

      <CustomMealForm
        initialData={meal}
        onSubmit={handleUpdate}
        isSubmitting={updateMutation.isPending}
        onUploadPhoto={handleUploadPhoto}
        onDeletePhoto={handleDeletePhoto}
      />
    </div>
  );
}
