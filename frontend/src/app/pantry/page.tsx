import { Metadata } from 'next';
import { Suspense } from 'react';
import { PantryClientView } from './pantry-client-view';

export const metadata: Metadata = {
  title: 'Tủ bếp gia đình | VeggieConnect',
  description:
    'Quản lý nguyên liệu hiện có trong tủ bếp, theo dõi hạn sử dụng và tối ưu kế hoạch thực đơn gia đình.',
};

export default function PantryPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 border rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <PantryClientView />
    </Suspense>
  );
}
