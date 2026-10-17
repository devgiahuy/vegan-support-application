import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BillingView } from '@/features/billing/components/billing-view';
import { Skeleton } from '@/components/ui/skeleton';
export const metadata: Metadata = {
  title: 'Gói tiện ích | VeggieConnect',
  description: 'Quản lý lượt AI và sức chứa tủ đồ ăn trong bản demo.',
};
export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-64" />
        </div>
      }
    >
      <BillingView />
    </Suspense>
  );
}
