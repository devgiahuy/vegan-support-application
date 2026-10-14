'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Receipt,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReceiptUploadZone } from '@/features/receipt/components/receipt-upload-zone';
import { ReceiptInspectionView } from '@/features/receipt/components/receipt-inspection-view';
import { ReceiptConfirmationSummary } from '@/features/receipt/components/receipt-confirmation-summary';
import { useReceiptJobQuery } from '@/features/receipt/queries/receipt.queries';
import type { ReceiptConfirmationDiff, ReceiptJob } from '@/features/receipt/types/receipt.model';

export function ReceiptScanClientView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlJobId = searchParams.get('jobId');

  const [activeJobId, setActiveJobId] = useState<string | null>(urlJobId);
  const [confirmationDiff, setConfirmationDiff] = useState<ReceiptConfirmationDiff | null>(null);

  const {
    data: job,
    isLoading: isJobLoading,
    isError,
    error,
    refetch,
  } = useReceiptJobQuery(activeJobId);

  const handleJobCreated = (newJob: ReceiptJob) => {
    setActiveJobId(newJob.id);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/receipts/scan?jobId=${newJob.id}`);
    }
  };

  const handleCancelJob = () => {
    setActiveJobId(null);
    setConfirmationDiff(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/receipts/scan');
    }
  };

  const handleScanAnother = () => {
    setActiveJobId(null);
    setConfirmationDiff(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/receipts/scan');
    }
  };

  return (
    <div
      className={`container mx-auto px-4 py-6 sm:py-8 space-y-6 transition-all duration-300 ${
        activeJobId && job && !job.isProcessing ? 'max-w-7xl' : 'max-w-4xl'
      }`}
    >
      {/* Header điều hướng */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/pantry">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl h-8 px-2 text-muted-foreground hover:text-foreground text-xs"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Tủ bếp
            </Button>
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {activeJobId ? 'Kiểm duyệt hóa đơn' : 'Quét hóa đơn mua thực phẩm'}
          </span>
        </div>

        {activeJobId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleScanAnother}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Tải ảnh khác
          </Button>
        )}
      </div>

      {/* Trường hợp lỗi tải tác vụ */}
      {activeJobId && isError && (
        <div className="max-w-xl mx-auto py-12 text-center space-y-5">
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
            <Button
              size="sm"
              onClick={handleScanAnother}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Quét hóa đơn mới
            </Button>
          </div>
        </div>
      )}

      {/* Trường hợp đang tải dữ liệu ban đầu của tác vụ */}
      {activeJobId && isJobLoading && (
        <div className="py-16 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground font-medium">Đang tải thông tin hóa đơn...</p>
        </div>
      )}

      {/* Trường hợp có tác vụ đang hoạt động: Hiển thị giao diện kiểm duyệt 2 phần */}
      {activeJobId && job && !isError && (
        <ReceiptInspectionView
          job={job}
          onConfirmationSuccess={(diff) => setConfirmationDiff(diff)}
          onCancel={handleCancelJob}
          onScanAnother={handleScanAnother}
        />
      )}

      {/* Trường hợp chưa có tác vụ: Hiển thị màn hình tải ảnh & hướng dẫn */}
      {!activeJobId && (
        <div className="space-y-8">
          {/* Tiêu đề & Giới thiệu */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <Receipt className="h-3.5 w-3.5" />
              Nhận diện OCR & Bóc tách Hóa đơn
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Quét hóa đơn mua thực phẩm
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
              Chụp hoặc tải ảnh hóa đơn từ siêu thị hoặc cửa hàng tiện lợi. AI sẽ tự động đọc các
              dòng hàng, hiển thị ảnh đối chiếu bên trái và danh sách để bạn điền trọng lượng, đơn
              vị bên phải trước khi lưu vào Tủ bếp.
            </p>
          </div>

          {/* Hướng dẫn chụp ảnh đạt kết quả tốt nhất */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Đặt hóa đơn trên mặt phẳng phẳng, đủ ánh sáng và không bị lóa bóng.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Hóa đơn dài có thể chụp liên tiếp từ 2 đến 4 ảnh từ trên xuống dưới.</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Bạn sẽ luôn được đối chiếu và kiểm duyệt danh sách trước khi lưu vào kho.</span>
            </div>
          </div>

          {/* Vùng tải ảnh */}
          <ReceiptUploadZone onJobCreated={handleJobCreated} />
        </div>
      )}

      {/* Modal tổng kết kết quả nhập kho thành công */}
      <ReceiptConfirmationSummary
        open={Boolean(confirmationDiff)}
        onOpenChange={(open) => {
          if (!open) setConfirmationDiff(null);
        }}
        diff={confirmationDiff}
        onScanAnother={handleScanAnother}
      />
    </div>
  );
}
