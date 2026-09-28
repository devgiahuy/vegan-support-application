import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReceiptScanClientView } from './receipt-scan-client-view';

export const metadata: Metadata = {
  title: 'Quét hóa đơn mua thực phẩm | VeggieConnect',
  description:
    'Tải ảnh hóa đơn siêu thị để AI tự động bóc tách các dòng sản phẩm và cập nhật vào tủ bếp gia đình.',
};

export default function ReceiptScanPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded mb-6" />
          <div className="h-64 border rounded-2xl bg-muted/30 animate-pulse" />
        </div>
      }
    >
      <ReceiptScanClientView />
    </Suspense>
  );
}
