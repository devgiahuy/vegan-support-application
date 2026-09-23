import React from 'react';
import { Metadata } from 'next';
import { Utensils } from 'lucide-react';
import { CustomMealList } from '@/features/custom-meal/components/custom-meal-list';

export const metadata: Metadata = {
  title: 'Món ăn của tôi | VeggieConnect',
  description:
    'Quản lý các món ăn thuần chay cá nhân, định lượng dinh dưỡng và đưa vào thực đơn tuần.',
};

export default function CustomMealsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header trang */}
      <div className="border-b pb-5">
        <div className="flex items-center gap-2 text-primary font-medium text-xs mb-1">
          <Utensils className="w-4 h-4" />
          <span>Góc Bếp Cá Nhân</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Món ăn của tôi</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Lưu giữ công thức nấu ăn thường nhật của riêng bạn, đính kèm ảnh thực tế và tùy chỉnh đưa
          vào thực đơn tuần.
        </p>
      </div>

      {/* Danh sách món ăn */}
      <CustomMealList />
    </div>
  );
}
