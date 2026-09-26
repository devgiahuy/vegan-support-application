'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Utensils } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useCustomMealsQuery, useDeleteCustomMealMutation } from '../queries/custom-meal.queries';
import type { CustomMealListItem } from '../types/custom-meal.model';
import { CustomMealCard } from './custom-meal-card';
import { CustomMealTagFilterBar } from './custom-meal-tag-filter-bar';
import { CustomMealDeleteDialog } from './custom-meal-delete-dialog';

export const CustomMealList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Món ăn đang chuẩn bị xóa
  const [deletingMeal, setDeletingMeal] = useState<CustomMealListItem | null>(null);

  const { data, isLoading, isError, refetch } = useCustomMealsQuery({
    page,
    limit: 12,
    search: search.trim() || undefined,
    tag: selectedTag || undefined,
  });

  const deleteMutation = useDeleteCustomMealMutation();

  const handleConfirmDelete = async () => {
    if (!deletingMeal) return;

    try {
      await deleteMutation.mutateAsync(deletingMeal.id);
      toast.success(`Đã xóa món ăn "${deletingMeal.name}" thành công`);
      setDeletingMeal(null);
    } catch (err: unknown) {
      // Nếu có lỗi CUSTOM_MEAL_IN_USE hoặc lỗi khác
      const errorMsg = err instanceof Error ? err.message : 'Lỗi khi xóa món ăn';
      toast.error(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Thanh công cụ tìm kiếm và lọc */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên món ăn..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <Link href="/custom-meals/new">
          <Button size="sm" className="w-full sm:w-auto h-9 text-xs gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            Tạo món mới
          </Button>
        </Link>
      </div>

      {/* Thanh lọc theo thẻ cá nhân (User Tags) */}
      {data?.availableTags && data.availableTags.length > 0 && (
        <CustomMealTagFilterBar
          availableTags={data.availableTags}
          selectedTag={selectedTag}
          onSelectTag={(tag) => {
            setSelectedTag(tag);
            setPage(1);
          }}
          totalCount={data.pagination.totalItems}
        />
      )}

      {/* Trạng thái tải Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-3">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trạng thái Lỗi */}
      {isError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-3">
          <p className="text-sm text-destructive font-medium">
            Không thể tải danh sách món ăn cá nhân.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
            Thử lại
          </Button>
        </div>
      )}

      {/* Trạng thái Rỗng Empty State */}
      {!isLoading && !isError && data?.items.length === 0 && (
        <div className="rounded-2xl border border-dashed p-12 text-center bg-muted/10 space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <Utensils className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              {search || selectedTag
                ? 'Không tìm thấy món ăn phù hợp'
                : 'Chưa có món ăn cá nhân nào'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {search || selectedTag
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc chọn thẻ khác để xem các món ăn khác của bạn.'
                : 'Bạn có thể tự do ghi chép các bữa ăn hàng ngày, đính kèm ảnh chụp thực tế và đưa vào thực đơn tuần.'}
            </p>
          </div>
          <div className="pt-2">
            {search || selectedTag ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedTag(null);
                }}
                className="text-xs"
              >
                Xóa bộ lọc
              </Button>
            ) : (
              <Link href="/custom-meals/new">
                <Button size="sm" className="text-xs gap-1.5">
                  <Plus className="w-4 h-4" />
                  Tạo món ăn đầu tiên của bạn
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Lưới danh sách món ăn */}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items.map((meal) => (
            <CustomMealCard key={meal.id} meal={meal} onDeleteClick={(m) => setDeletingMeal(m)} />
          ))}
        </div>
      )}

      {/* Phân trang */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-xs h-8"
          >
            Trang trước
          </Button>
          <span className="text-xs text-muted-foreground">
            Trang {data.pagination.page} / {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page >= data.pagination.totalPages}
            className="text-xs h-8"
          >
            Trang sau
          </Button>
        </div>
      )}

      {/* Hộp thoại xóa an toàn */}
      <CustomMealDeleteDialog
        open={Boolean(deletingMeal)}
        onOpenChange={(open) => {
          if (!open) setDeletingMeal(null);
        }}
        mealName={deletingMeal?.name || ''}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};
