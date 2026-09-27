import { Metadata } from 'next';
import { Suspense } from 'react';
import { FridgeScanClientView } from './fridge-scan-client-view';

export const metadata: Metadata = {
  title: 'Nhận diện tủ lạnh qua hình ảnh | VeggieConnect',
  description:
    'Chụp hoặc tải ảnh các ngăn tủ lạnh để AI tự động nhận diện thực phẩm, kiểm soát độ tươi và cập nhật kho Tủ bếp gia đình.',
};

export default function FridgeScanPage() {
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
      <FridgeScanClientView />
    </Suspense>
  );
}
