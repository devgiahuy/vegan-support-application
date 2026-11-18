'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DietRepairPanel } from '@/features/diet-preferences/components/diet-repair-panel';
import { AuthGuard } from '@/components/shared/auth-guard';
function Repair() {
  const params = useSearchParams();
  const router = useRouter();
  const ids = (params.get('plans') ?? '').split(',').filter(Boolean);
  const revision = Number(params.get('revision'));
  return ids.length && revision > 0 ? (
    <DietRepairPanel
      planIds={ids}
      dietaryRevision={revision}
      onClose={() => router.push('/meal-plans/saved')}
    />
  ) : (
    <p className="p-6">Hãy chọn thực đơn cần điều chỉnh từ trang thực đơn.</p>
  );
}
export default function Page() {
  return (
    <AuthGuard>
      <Suspense fallback={<p className="p-6">Đang tải phương án…</p>}>
        <Repair />
      </Suspense>
    </AuthGuard>
  );
}
