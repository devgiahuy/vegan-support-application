'use client';

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ShoppingGapUnresolvedItem } from '../types/shopping-gap.model';

interface UnresolvedItemsCardProps {
  unresolvedItems: ShoppingGapUnresolvedItem[];
}

export function UnresolvedItemsCard({ unresolvedItems }: UnresolvedItemsCardProps) {
  // Mặc định đóng dropdown theo yêu cầu người dùng
  const [isOpen, setIsOpen] = useState(false);

  if (!unresolvedItems || unresolvedItems.length === 0) return null;

  const hasMoreThan5 = unresolvedItems.length > 5;

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 overflow-hidden transition-all shadow-2xs">
      {/* Dropdown Header Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left transition-colors hover:bg-amber-100/40 dark:hover:bg-amber-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
        aria-expanded={isOpen}
        aria-controls="unresolved-items-dropdown-content"
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Nguyên liệu cần kiểm tra thủ công
              </h4>
              <Badge
                variant="outline"
                className="text-[11px] font-semibold border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/70 px-2 py-0.2 rounded-full"
              >
                {unresolvedItems.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {isOpen
                ? 'Nhấn để thu gọn danh sách nguyên liệu chưa quy đổi'
                : 'Chưa có tỷ lệ quy đổi hoặc chưa liên kết từ điển — nhấn để xem chi tiết'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-amber-800 dark:text-amber-300 hidden sm:inline">
            {isOpen ? 'Thu gọn' : 'Xem danh sách'}
          </span>
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-amber-100/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
            <ChevronDown
              className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
            />
          </div>
        </div>
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          id="unresolved-items-dropdown-content"
          className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 space-y-3 border-t border-amber-200/50 dark:border-amber-900/40"
        >
          <p className="text-xs text-muted-foreground pt-3">
            Các món dưới đây chưa thể tự động tính khoảng thiếu do chưa có tỷ lệ quy đổi đơn vị
            chuẩn hoặc chưa liên kết từ điển nguyên liệu. Vui lòng tự kiểm tra trước khi đi mua sắm:
          </p>

          <div className="rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-card overflow-hidden shadow-2xs">
            <div
              className={cn(
                'divide-y divide-amber-200/50 dark:divide-amber-900/40',
                hasMoreThan5 && 'max-h-[380px] overflow-y-auto modal-scroll pr-1'
              )}
            >
              {unresolvedItems.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="p-3.5 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {item.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50/60"
                    >
                      {item.reasonLabel}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-muted-foreground gap-2 pt-0.5">
                    <span>
                      Cần dùng:{' '}
                      <span className="font-medium text-foreground">{item.required.formatted}</span>
                    </span>

                    {item.sourceMeals.length > 0 && (
                      <span className="text-[11px]">
                        Dùng trong: {item.sourceMeals.map((m) => m.name).join(', ')}
                      </span>
                    )}
                  </div>

                  {item.explanation && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-400/90 italic">
                      Lý do: {item.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {hasMoreThan5 && (
              <div className="p-2 text-center text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/40 border-t border-amber-200/50 dark:border-amber-900/40">
                Đang hiển thị 5 mục trên màn hình • Cuộn danh sách để xem tất cả{' '}
                {unresolvedItems.length} món
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
