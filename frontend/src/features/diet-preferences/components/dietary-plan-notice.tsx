'use client';
import { useRouter } from 'next/navigation';
import type { DietaryCompatibility } from '../types/diet-impact.model';
import { DietImpactNotice } from './diet-impact-notice';
import { compatibilityCounts } from '../utils/diet-impact-view';
export function DietaryPlanNotice({
  compatibility,
  planIds = [],
  programId,
  showTitle = true,
}: {
  compatibility?: DietaryCompatibility;
  planIds?: string[];
  programId?: string;
  showTitle?: boolean;
}) {
  const router = useRouter();
  const counts = compatibilityCounts(compatibility);
  return (
    <DietImpactNotice
      {...counts}
      showTitle={showTitle}
      onRepair={() => {
        if (planIds.length)
          router.push(
            '/meal-plans/diet-repair?plans=' +
              planIds.join(',') +
              '&revision=' +
              compatibility?.dietaryRevision
          );
        else if (programId) router.push('/meal-programs/' + programId);
      }}
    />
  );
}
