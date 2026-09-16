'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';

export default function RestaurantDetailPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <EmptyState
        title="Chưa có thông tin quán ăn"
        description="Chi tiết quán ăn sẽ hiển thị ngay khi API địa điểm (SRS UC-12) sẵn sàng."
        action={
          <Button variant="outline" asChild className="mt-2 rounded-xl">
            <Link href="/restaurants" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Quay lại bản đồ quán chay
            </Link>
          </Button>
        }
      />
    </div>
  );
}
