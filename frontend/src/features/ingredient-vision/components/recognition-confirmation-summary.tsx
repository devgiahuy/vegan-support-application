'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  PackageCheck,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RecognitionConfirmationDiff } from '../types/ingredient-recognition.model';

interface RecognitionConfirmationSummaryProps {
  diff: RecognitionConfirmationDiff;
  onScanAnother: () => void;
}

export function RecognitionConfirmationSummary({
  diff,
  onScanAnother,
}: RecognitionConfirmationSummaryProps) {
  const { pantryChanges } = diff;

  const createdCount = pantryChanges.filter((c) => c.action === 'CREATED').length;
  const updatedCount = pantryChanges.filter((c) => c.action === 'UPDATED').length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-center py-6 sm:py-10">
      {/* Icon chúc mừng */}
      <div className="inline-flex items-center justify-center p-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-2">
        <PackageCheck className="h-10 w-10 sm:h-12 sm:w-12" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Đã thêm vào Tủ bếp thành công!
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
          Hệ thống đã đồng bộ{' '}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {pantryChanges.length}
          </span>{' '}
          nguyên liệu bạn đã xác nhận vào kho thực phẩm gia đình.
        </p>
      </div>

      {/* Thống kê nhanh */}
      <div className="flex items-center justify-center gap-4 text-xs sm:text-sm font-medium">
        {createdCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <PlusCircle className="h-4 w-4" />
            <span>Thêm mới: {createdCount}</span>
          </div>
        )}
        {updatedCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <RefreshCw className="h-4 w-4" />
            <span>Cập nhật số lượng: {updatedCount}</span>
          </div>
        )}
      </div>

      {/* Danh sách thay đổi chi tiết */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card p-4 sm:p-6 text-left space-y-3">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Danh sách thay đổi tồn kho
        </h3>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[320px] overflow-y-auto pr-1">
          {pantryChanges.map((change, idx) => {
            const { action, pantryItem } = change;
            const name = pantryItem.ingredient?.name || pantryItem.unmatchedText || 'Nguyên liệu';

            return (
              <div
                key={change.candidateId || idx}
                className="py-3 flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({pantryItem.quantity} {pantryItem.unit})
                    </span>
                  </div>
                </div>

                <Badge
                  variant={action === 'CREATED' ? 'default' : 'outline'}
                  className={`text-[11px] shrink-0 ${
                    action === 'CREATED'
                      ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                      : 'border-blue-500/40 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {change.actionLabel}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nút điều hướng */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onScanAnother}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Quét thêm ảnh khác</span>
        </Button>

        <Button
          asChild
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 px-6"
        >
          <Link href="/pantry">
            <span>Đi tới Tủ bếp gia đình</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
