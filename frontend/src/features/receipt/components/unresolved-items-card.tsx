'use client';

import React from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ShoppingGapUnresolvedItem } from '../types/shopping-gap.model';

interface UnresolvedItemsCardProps {
  unresolvedItems: ShoppingGapUnresolvedItem[];
}

export function UnresolvedItemsCard({ unresolvedItems }: UnresolvedItemsCardProps) {
  if (!unresolvedItems || unresolvedItems.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Nguyên liệu cần kiểm tra thủ công ({unresolvedItems.length})
          </h4>
          <p className="text-xs text-muted-foreground">
            Các món dưới đây chưa thể tự động tính khoảng thiếu do chưa có tỷ lệ quy đổi đơn vị
            chuẩn hoặc chưa liên kết từ điển nguyên liệu. Vui lòng tự kiểm tra trước khi đi mua sắm:
          </p>
        </div>
      </div>

      <div className="divide-y divide-amber-200/50 dark:divide-amber-900/40 bg-card rounded-xl border border-amber-200/60 dark:border-amber-900/40 overflow-hidden">
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
    </div>
  );
}
