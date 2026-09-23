'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CustomMealForm } from '@/features/custom-meal/components/custom-meal-form';
import { useCreateCustomMealMutation } from '@/features/custom-meal/queries/custom-meal.queries';
import type { CreateCustomMealRequestDto } from '@/features/custom-meal/types/custom-meal.dto';

export default function NewCustomMealPage() {
  const router = useRouter();
  const createMutation = useCreateCustomMealMutation();

  const handleCreate = async (data: CreateCustomMealRequestDto) => {
    const created = await createMutation.mutateAsync(data);
    toast.success(`Đã tạo món ăn "${created.name}" thành công!`);
    router.push(`/custom-meals/${created.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Tạo món ăn cá nhân mới</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ghi lại định lượng nguyên liệu, cách làm và gắn thẻ để dễ dàng phân loại sau này.
        </p>
      </div>

      <CustomMealForm onSubmit={handleCreate} isSubmitting={createMutation.isPending} />
    </div>
  );
}
