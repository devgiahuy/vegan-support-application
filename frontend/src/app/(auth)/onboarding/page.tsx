'use client';
import { useRouter } from 'next/navigation';
import { DietWizard } from '@/features/diet-preferences/components/diet-wizard';
import { useDetailedProfileQuery } from '@/features/profile/queries/profile.queries';
import { ErrorState } from '@/components/shared/error-state';
import { AuthGuard } from '@/components/shared/auth-guard';
function OnboardingContent() {
  const router = useRouter();
  const profile = useDetailedProfileQuery();
  if (profile.isPending) return <p className="p-6">Đang tải hồ sơ…</p>;
  if (profile.isError)
    return <ErrorState title="Không tải được hồ sơ" onRetry={() => void profile.refetch()} />;
  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <DietWizard
        initial={profile.data?.diet}
        onSaved={() => router.push('/profile?tab=diet')}
        onCancel={() => router.push('/profile')}
      />
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingContent />
    </AuthGuard>
  );
}
