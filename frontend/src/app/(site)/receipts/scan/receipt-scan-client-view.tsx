'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Receipt, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReceiptUploadZone } from '@/features/receipt/components/receipt-upload-zone';
import type { ReceiptJob } from '@/features/receipt/types/receipt.model';

export function ReceiptScanClientView() {
  const router = useRouter();

  const handleJobCreated = (job: ReceiptJob) => {
    router.push(`/receipts/${job.id}`);
  };

  return (
    <div className="container max-w-4xl py-6 sm:py-10 space-y-8">
      {/* Header điều hướng */}
      <div className="flex items-center gap-3">
        <Link href="/pantry">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl h-9 px-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Tủ bếp
          </Button>
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          Quét hóa đơn siêu thị
        </span>
      </div>

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
          Chụp hoặc tải ảnh hóa đơn từ siêu thị hoặc cửa hàng tiện lợi. AI sẽ tự động đọc các dòng
          hàng, khớp nguyên liệu và cho phép bạn xem lại trước khi cập nhật số dư vào Tủ bếp.
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
      <div className="bg-card p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <ReceiptUploadZone onJobCreated={handleJobCreated} />
      </div>
    </div>
  );
}
