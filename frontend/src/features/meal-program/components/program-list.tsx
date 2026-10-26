'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Sparkles, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/shared/pagination';
import { ProgramCard } from './program-card';
import { useMealProgramsQuery } from '../queries/meal-program.queries';
import type { MealProgramQueryParams } from '../api/meal-program.api';

type MealProgramStatusFilter = NonNullable<MealProgramQueryParams['status']> | 'ALL';

const statusOptions: { value: MealProgramStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'GENERATING', label: 'Đang tạo' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PARTIAL', label: 'Tạo một phần' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
];

export const ProgramList: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<MealProgramStatusFilter>('ALL');
  const [page, setPage] = useState<number>(1);

  const { data, isLoading, isError } = useMealProgramsQuery({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
    limit: 12,
  });

  const handleFilterChange = (status: MealProgramStatusFilter) => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs">
            <Filter className="w-3.5 h-3.5 ml-1 text-muted-foreground" />
            {statusOptions.map(({ value: status, label }) => (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === status
                    ? 'bg-background font-semibold text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

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
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-xl border-2 border-dashed border-muted-foreground/20 space-y-4">
          <div className="size-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <Sparkles className="size-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-base font-semibold text-balance">
              Chưa có lộ trình dinh dưỡng nào
            </h4>
            <p className="text-sm text-muted-foreground text-pretty">
              Bạn chưa có lộ trình dinh dưỡng nào. Hãy bắt đầu một chương trình từ 2 tuần để theo
              dõi kế hoạch dài hạn.
            </p>
          </div>
          <Link href="/meal-programs/new">
            <Button className="mt-2">
              <Plus className="size-4 mr-2" />
              Tạo lộ trình cá nhân đầu tiên
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.items.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t text-xs text-muted-foreground">
              <span className="tabular-nums">
                Trang {data.pagination.page} / {data.pagination.totalPages} (Tổng cộng{' '}
                {data.pagination.totalItems} lộ trình)
              </span>
              <Pagination
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
