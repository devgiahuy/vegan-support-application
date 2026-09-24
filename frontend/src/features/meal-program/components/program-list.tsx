'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Sparkles, BookOpen, Layers, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgramCard } from './program-card';
import { useMealProgramsQuery } from '../queries/meal-program.queries';

export const ProgramList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MY_PROGRAMS' | 'TEMPLATES'>('MY_PROGRAMS');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data, isLoading, isError, error } = useMealProgramsQuery({
    type: activeTab,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page: 1,
    limit: 12,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'MY_PROGRAMS' | 'TEMPLATES')}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full sm:w-[320px] grid-cols-2">
            <TabsTrigger value="MY_PROGRAMS" className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              Lộ trình của tôi
            </TabsTrigger>
            <TabsTrigger value="TEMPLATES" className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              Chương trình mẫu
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          {activeTab === 'MY_PROGRAMS' && (
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs">
              <Filter className="w-3.5 h-3.5 ml-1 text-muted-foreground" />
              {['ALL', 'DRAFT', 'CONFIRMED', 'COMPLETED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    statusFilter === st
                      ? 'bg-background font-semibold text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st === 'ALL'
                    ? 'Tất cả'
                    : st === 'DRAFT'
                      ? 'Bản nháp'
                      : st === 'CONFIRMED'
                        ? 'Đang chạy'
                        : 'Hoàn thành'}
                </button>
              ))}
            </div>
          )}

          <Link href="/meal-programs/new">
            <Button className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Tạo lộ trình mới</span>
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-4">
              <Skeleton className="h-44 w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12 rounded-xl border border-destructive/20 bg-destructive/5 space-y-3 p-6">
          <p className="text-destructive font-medium">
            Không thể tải danh sách lộ trình dinh dưỡng.
          </p>
          <p className="text-xs text-muted-foreground">
            {error instanceof Error ? error.message : 'Vui lòng kiểm tra lại kết nối mạng.'}
          </p>
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-xl border-2 border-dashed border-muted-foreground/20 space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-base font-semibold">Chưa có lộ trình dinh dưỡng nào</h4>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'MY_PROGRAMS'
                ? 'Bạn chưa tham gia lộ trình nào. Hãy bắt đầu ngay một chương trình 2 tuần hoặc 4 tuần để cải thiện sức khỏe.'
                : 'Hiện chưa có chương trình mẫu nào được xuất bản.'}
            </p>
          </div>
          <Link href="/meal-programs/new">
            <Button className="mt-2">
              <Plus className="w-4 h-4 mr-2" />
              Tạo lộ trình cá nhân đầu tiên
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.items.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      )}
    </div>
  );
};
