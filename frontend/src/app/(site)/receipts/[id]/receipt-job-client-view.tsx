'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Receipt, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReceiptJobQuery } from '@/features/receipt/queries/receipt.queries';
import { ReceiptInspectionView } from '@/features/receipt/components/receipt-inspection-view';
import { ReceiptConfirmationSummary } from '@/features/receipt/components/receipt-confirmation-summary';
import type { ReceiptConfirmationDiff } from '@/features/receipt/types/receipt.model';

interface ReceiptJobClientViewProps {
  jobId: string;
}

export function ReceiptJobClientView({ jobId }: ReceiptJobClientViewProps) {
  const router = useRouter();
  const [confirmationDiff, setConfirmationDiff] = useState<ReceiptConfirmationDiff | null>(null);

  const { data: job, isLoading, isError, error, refetch } = useReceiptJobQuery(jobId);

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-12 flex flex-col items-center justify-center space-y-4 min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground font-medium">
          Đang tải thông tin tác vụ bóc tách hóa đơn...
        </p>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="container max-w-xl py-12 text-center space-y-5">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold">Không tìm thấy tác vụ hóa đơn</h2>
          <p className="text-sm text-muted-foreground">
            {error?.message || 'Tác vụ không tồn tại hoặc bạn không có quyền truy cập.'}
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Thử lại
          </Button>
          <Link href="/pantry">
            <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
              Về Tủ bếp
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-6 sm:py-8 space-y-6">
      {/* Header điều hướng */}
      <div className="flex items-center gap-3">
        <Link href="/pantry">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl h-8 px-2 text-muted-foreground hover:text-foreground text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Tủ bếp
          </Button>
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <Link href="/receipts/scan">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl h-8 px-2 text-muted-foreground hover:text-foreground text-xs"
          >
            Quét hóa đơn
          </Button>
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
          Kiểm duyệt hóa đơn
        </span>
      </div>

      {/* Màn hình đối chiếu kép & kiểm duyệt */}
      <ReceiptInspectionView
        job={job}
        onConfirmationSuccess={(diff) => setConfirmationDiff(diff)}
      />

      {/* Modal tổng kết kết quả nhập kho */}
      <ReceiptConfirmationSummary
        open={Boolean(confirmationDiff)}
        onOpenChange={(open) => {
          if (!open) setConfirmationDiff(null);
        }}
        diff={confirmationDiff}
      />
    </div>
  );
}
