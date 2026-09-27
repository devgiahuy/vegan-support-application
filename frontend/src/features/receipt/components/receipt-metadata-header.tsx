'use client';

import React from 'react';
import { Store, Calendar, CreditCard, Sparkles, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ReceiptJob } from '../types/receipt.model';

interface ReceiptMetadataHeaderProps {
  job: ReceiptJob;
}

export function ReceiptMetadataHeader({ job }: ReceiptMetadataHeaderProps) {
  const { receiptMetadata, statusLabel, statusBadgeVariant } = job;
  const { merchantName, formattedDate, formattedTotalAmount, confidencePercent } = receiptMetadata;

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge
            variant={statusBadgeVariant}
            className="rounded-lg px-2.5 py-0.5 text-xs font-medium"
          >
            {statusLabel}
          </Badge>
          {confidencePercent !== null && (
            <Badge
              variant="outline"
              className={`rounded-lg px-2.5 py-0.5 text-xs font-normal border ${
                confidencePercent >= 80
                  ? 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : confidencePercent >= 50
                    ? 'border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30'
                    : 'border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
              }`}
            >
              <Sparkles className="h-3 w-3 mr-1 inline" />
              Độ tin cậy OCR {confidencePercent}%
            </Badge>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          {job.candidates.length} dòng hàng phát hiện
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        {/* Người bán / Siêu thị */}
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0">
            <Store className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Cửa hàng / Siêu thị</div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {merchantName}
            </div>
          </div>
        </div>

        {/* Ngày mua */}
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Thời gian mua</div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {formattedDate}
            </div>
          </div>
        </div>

        {/* Tổng tiền */}
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tổng tiền thanh toán</div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formattedTotalAmount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
