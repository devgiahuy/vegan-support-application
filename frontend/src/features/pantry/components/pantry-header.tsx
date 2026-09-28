import React from 'react';
import Link from 'next/link';
import { Plus, GitMerge, Search, Filter, Camera, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PantryItemSource } from '../types/pantry.model';

interface PantryHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  sourceFilter: PantryItemSource | 'ALL';
  onSourceFilterChange: (value: PantryItemSource | 'ALL') => void;
  onOpenCreateDialog: () => void;
  onOpenMergeDialog: () => void;
  totalItems: number;
  duplicateCount?: number;
}

export function PantryHeader({
  search,
  onSearchChange,
  sourceFilter,
  onSourceFilterChange,
  onOpenCreateDialog,
  onOpenMergeDialog,
  totalItems,
  duplicateCount = 0,
}: PantryHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Tủ bếp gia đình
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý nguyên liệu hiện có ({totalItems} mục), theo dõi hạn sử dụng và kiểm soát tồn
            kho thông minh.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <Link href="/receipts/scan">
              <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Quét hóa đơn</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <Link href="/pantry/scan">
              <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Quét ảnh tủ lạnh</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenMergeDialog}
            className="flex items-center gap-1.5 border-dashed"
          >
            <GitMerge className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Gộp trùng lặp</span>
            {duplicateCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-emerald-600 rounded-full">
                {duplicateCount}
              </span>
            )}
          </Button>
          <Button
            size="sm"
            onClick={onOpenCreateDialog}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm nguyên liệu</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên nguyên liệu..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select
            value={sourceFilter}
            onValueChange={(val) => onSourceFilterChange(val as PantryItemSource | 'ALL')}
          >
            <SelectTrigger className="bg-card">
              <div className="flex items-center gap-2 truncate">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Nguồn nhập" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả nguồn</SelectItem>
              <SelectItem value="MANUAL">Nhập thủ công</SelectItem>
              <SelectItem value="FRIDGE_RECOGNITION">Nhận diện tủ lạnh</SelectItem>
              <SelectItem value="RECEIPT">Quét hóa đơn</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
