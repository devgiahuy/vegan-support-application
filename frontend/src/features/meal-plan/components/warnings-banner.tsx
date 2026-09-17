import { TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { PlanWarning } from '../types/meal-plan.model';

/** Banner cảnh báo thực đơn (mã gốc + diễn giải tiếng Việt từ mapper). */
export function WarningsBanner({ warnings }: { warnings: PlanWarning[] }) {
  if (warnings.length === 0) return null;
  return (
    <Alert>
      <TriangleAlert className="size-4" />
      <AlertTitle>Lưu ý về thực đơn này</AlertTitle>
      <AlertDescription>
        <ul className="mt-1 flex list-disc flex-col gap-1 pl-4">
          {warnings.map((warning) => (
            <li key={warning.code}>{warning.message}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
