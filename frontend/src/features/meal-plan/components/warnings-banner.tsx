import { TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { PlanWarning, PlanWarningDetail } from '../types/meal-plan.model';

interface WarningsBannerProps {
  warnings?: PlanWarning[];
  warningDetails?: PlanWarningDetail[];
}

/** Banner cảnh báo thực đơn (chi tiết tiếng Việt từ warningDetails hoặc mã gốc từ warnings). */
export function WarningsBanner({ warnings = [], warningDetails = [] }: WarningsBannerProps) {
  // Ẩn các mã cảnh báo nội bộ/kỹ thuật không cần làm người dùng hoang mang
  const userFacingWarnings = warnings.filter(
    (w) => w.code !== 'UNFILLED_SLOT' && w.code !== 'MICRONUTRIENT_DATA_PARTIAL'
  );
  const userFacingDetails = warningDetails.filter(
    (d) => d.code !== 'UNFILLED_SLOT' && d.code !== 'MICRONUTRIENT_DATA_PARTIAL'
  );

  const hasDetails = userFacingDetails.length > 0;
  const hasSimple = userFacingWarnings.length > 0;

  if (!hasDetails && !hasSimple) return null;

  return (
    <Alert>
      <TriangleAlert className="size-4" />
      <AlertTitle>Lưu ý về thực đơn tuần này</AlertTitle>
      <AlertDescription>
        {hasDetails ? (
          <div className="mt-2 space-y-2">
            {userFacingDetails.map((detail) => (
              <div key={detail.code} className="text-xs space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{detail.title}</span>
                  {detail.severityLabel && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {detail.severityLabel}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{detail.detail}</p>
                {detail.suggestion && (
                  <p className="text-muted-foreground italic">💡 {detail.suggestion}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-4">
            {userFacingWarnings.map((warning) => (
              <li key={warning.code}>{warning.message}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}
