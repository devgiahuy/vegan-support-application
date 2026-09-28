import React from 'react';
import { PackageOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PantryItemCard } from './pantry-item-card';
import type { PantryItem } from '../types/pantry.model';
import { isDuplicatePantryItem } from '../utils/pantry-helpers';

interface PantryItemListProps {
  items: PantryItem[];
  allPantryItems?: PantryItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onOpenCreateDialog: () => void;
  onOpenAdjustment: (item: PantryItem, initialType: 'CONSUME' | 'RESTORE') => void;
  onOpenHistory: (item: PantryItem) => void;
  onOpenEdit: (item: PantryItem) => void;
  onOpenDelete: (item: PantryItem) => void;
  onOpenMerge?: (item: PantryItem) => void;
}

export function PantryItemList({
  items,
  allPantryItems,
  isLoading,
  isError,
  onRetry,
  onOpenCreateDialog,
  onOpenAdjustment,
  onOpenHistory,
  onOpenEdit,
  onOpenDelete,
  onOpenMerge,
}: PantryItemListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border rounded-xl p-4 flex flex-col gap-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-1/3 mt-2" />
            <Skeleton className="h-4 w-full mt-4" />
            <div className="flex gap-2 mt-2 pt-2 border-t">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed rounded-xl p-6 bg-card">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Không thể tải danh sách tủ bếp
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-4">
          Đã có lỗi xảy ra trong quá trình kết nối tới máy chủ. Vui lòng thử lại.
        </p>
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tải lại dữ liệu
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center border border-dashed rounded-xl p-8 bg-card/50">
        <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
          <PackageOpen className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Tủ bếp hiện chưa có nguyên liệu nào
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mb-6 leading-relaxed">
          Ghi nhận các nguyên liệu gia vị, rau củ quả hoặc đồ khô bạn đang có sẵn tại nhà để thuận
          tiện cho việc gợi ý thực đơn và kiểm soát hạn sử dụng.
        </p>
        <Button
          onClick={onOpenCreateDialog}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Thêm nguyên liệu đầu tiên
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <PantryItemCard
          key={item.id}
          item={item}
          hasDuplicates={isDuplicatePantryItem(item, allPantryItems || items)}
          onOpenAdjustment={onOpenAdjustment}
          onOpenHistory={onOpenHistory}
          onOpenEdit={onOpenEdit}
          onOpenDelete={onOpenDelete}
          onOpenMerge={onOpenMerge}
        />
      ))}
    </div>
  );
}
