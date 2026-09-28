import React from 'react';
import { Metadata } from 'next';
import { Target } from 'lucide-react';
import { ProgramList } from '@/features/meal-program/components/program-list';

export const metadata: Metadata = {
  title: 'Lộ trình Dinh dưỡng Nhiều tuần | VeggieConnect',
  description:
    'Thiết kế và theo dõi các lộ trình ăn chay 2 tuần, 4 tuần, 8 tuần theo mục tiêu sức khỏe cá nhân hóa.',
};

export default function MealProgramsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header trang */}
      <div className="border-b pb-5">
        <div className="flex items-center gap-2 text-primary font-medium text-xs mb-1">
          <Target className="w-4 h-4" />
          <span>Kế Hoạch Dài Hạn</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Lộ trình Dinh dưỡng Nhiều tuần
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Thiết kế các chương trình ăn chay 2 tuần, 4 tuần, 8 tuần theo mục tiêu cụ thể, theo dõi độ
          tuân thủ thực tế và phân tích tích lũy dinh dưỡng dài hạn.
        </p>
      </div>

      {/* Danh sách chương trình */}
      <ProgramList />
    </div>
  );
}
