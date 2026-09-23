'use client';

import React from 'react';
import { Target } from 'lucide-react';
import { ProgramCreateForm } from '@/features/meal-program/components/program-create-form';

export default function NewMealProgramPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="border-b pb-4">
        <div className="flex items-center gap-2 text-primary font-medium text-xs mb-1">
          <Target className="w-4 h-4" />
          <span>Khởi Tạo Lộ Trình</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Tạo lộ trình dinh dưỡng cá nhân mới
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Chọn mục tiêu, ngày bắt đầu và thời lượng 2, 4 hoặc 8 tuần. Bạn sẽ có thể xem trước và tùy
          biến các tuần ở trạng thái bản nháp.
        </p>
      </div>

      <ProgramCreateForm />
    </div>
  );
}
