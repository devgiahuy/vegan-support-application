'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Loader2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useShoppingGapPreviewQuery } from '../queries/shopping.queries';
import { ShoppingGapItemRow } from './shopping-gap-item-row';
import { UnresolvedItemsCard } from './unresolved-items-card';
import type { SelectedMealInput } from '../types/shopping-gap.model';

interface ShoppingGapViewProps {
  meals: SelectedMealInput[];
  className?: string;
}

export function ShoppingGapView({ meals, className = '' }: ShoppingGapViewProps) {
  const [filterTab, setFilterTab] = useState<'missing' | 'all' | 'ready'>('missing');

  const {
    data: preview,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useShoppingGapPreviewQuery(meals, {
    enabled: meals.length > 0,
  });

  if (meals.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-muted-foreground text-sm space-y-2">
        <ShoppingCart className="h-8 w-8 mx-auto opacity-40 mb-1" />
        <p>Vui lòng chọn ít nhất một bữa ăn trong thực đơn để tính toán danh sách đi chợ.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground font-medium">
          Đang so sánh nguyên liệu thực đơn với tồn kho Tủ bếp...
        </p>
      </div>
    );
  }

  if (isError || !preview) {
    return (
      <div className="p-6 text-center rounded-2xl border border-destructive/20 bg-destructive/5 space-y-3">
        <AlertCircle className="h-6 w-6 text-destructive mx-auto" />
        <div className="text-sm font-semibold text-destructive">
          Không thể tính toán danh sách đi chợ thông minh
        </div>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          {error?.message || 'Có lỗi xảy ra khi kiểm tra tồn kho tủ bếp hoặc công thức món ăn.'}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="rounded-xl text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Thử lại
        </Button>
      </div>
    );
  }

  const { items, readyItems, missingItems, unresolvedItems, summary, formattedPantryAsOf } =
    preview;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header thống kê & Thời điểm tham chiếu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-emerald-600" />
            Đi chợ thông minh theo Tủ bếp
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dữ liệu đối chiếu tồn kho tủ bếp tính đến:{' '}
            <span className="font-medium text-foreground">{formattedPantryAsOf}</span>
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-xl h-8 px-2.5 text-xs text-muted-foreground self-start sm:self-center"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
          Cập nhật lại
        </Button>
      </div>

      {/* 4 Thẻ thống kê tóm tắt */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Số bữa ăn */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-1">
          <div className="text-xs text-muted-foreground">Món đã chọn</div>
          <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {summary.selectedMealCount}
          </div>
        </div>

        {/* Cần mua thêm */}
        <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-1">
          <div className="text-xs text-rose-700 dark:text-rose-400 font-medium">Cần mua thêm</div>
          <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
            {summary.missingItemCount} món
          </div>
        </div>

        {/* Đã có đủ */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-1">
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            Đã có đủ trong tủ
          </div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {summary.readyItemCount} món
          </div>
        </div>

        {/* Cần kiểm tra thủ công */}
        <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1">
          <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            Cần tự kiểm tra
          </div>
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
            {summary.unresolvedItemCount} món
          </div>
        </div>
      </div>

      {/* Cảnh báo nguyên liệu chưa thể quy đổi */}
      <UnresolvedItemsCard unresolvedItems={unresolvedItems} />

      {/* Tabs lọc & Danh sách món */}
      <Tabs
        value={filterTab}
        onValueChange={(val) => setFilterTab(val as 'missing' | 'all' | 'ready')}
        className="w-full space-y-4"
      >
        <div className="flex items-center justify-between pb-1">
          <TabsList className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-1">
            <TabsTrigger value="missing" className="rounded-lg text-xs font-medium px-3">
              Cần mua thêm ({missingItems.length})
            </TabsTrigger>
            <TabsTrigger value="ready" className="rounded-lg text-xs font-medium px-3">
              Đã có đủ ({readyItems.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg text-xs font-medium px-3">
              Tất cả ({items.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Cần mua thêm */}
        <TabsContent value="missing" className="space-y-3">
          {missingItems.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Tủ bếp của bạn đã có đủ toàn bộ nguyên liệu!
              </div>
              <p className="text-xs text-muted-foreground">
                Không cần phải mua thêm món nào cho các bữa ăn đã chọn.
              </p>
            </div>
          ) : (
            missingItems.map((item) => (
              <ShoppingGapItemRow key={item.ingredientId || item.ingredientName} item={item} />
            ))
          )}
        </TabsContent>

        {/* Tab Đã có đủ */}
        <TabsContent value="ready" className="space-y-3">
          {readyItems.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-muted-foreground text-sm">
              Chưa có nguyên liệu nào có sẵn đủ số lượng trong tủ bếp.
            </div>
          ) : (
            readyItems.map((item) => (
              <ShoppingGapItemRow key={item.ingredientId || item.ingredientName} item={item} />
            ))
          )}
        </TabsContent>

        {/* Tab Tất cả */}
        <TabsContent value="all" className="space-y-3">
          {items.map((item) => (
            <ShoppingGapItemRow key={item.ingredientId || item.ingredientName} item={item} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
