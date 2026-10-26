import React from 'react';
import { TriangleAlert, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { PlanWarning, PlanWarningDetail } from '../types/meal-plan.model';

interface WarningsBannerProps {
  warnings?: PlanWarning[];
  warningDetails?: PlanWarningDetail[];
}

/** Banner cảnh báo và lưu ý tối ưu thực đơn (chi tiết tiếng Việt từ warningDetails hoặc mã gốc từ warnings). */
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

  const totalCount = hasDetails ? userFacingDetails.length : userFacingWarnings.length;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-300/60 dark:border-amber-900/50 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-orange-500/10 p-5 shadow-2xs">
      <div className="flex items-start gap-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shadow-2xs mt-0.5">
          <TriangleAlert className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm sm:text-base font-bold text-foreground">
              Lưu ý về thực đơn tuần này
            </h4>
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/15 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              {totalCount} lưu ý
            </span>
          </div>

          {hasDetails ? (
            <div className="space-y-2.5 pt-0.5">
              {userFacingDetails.map((detail) => (
                <div
                  key={detail.code}
                  className="rounded-xl bg-card/85 dark:bg-card/60 border border-amber-200/60 dark:border-amber-900/40 p-3.5 space-y-1.5 shadow-2xs backdrop-blur-xs"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-foreground">
                      {detail.title}
                    </span>
                    {detail.severityLabel && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 rounded-full border-amber-300 dark:border-amber-800 bg-amber-100/70 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-medium"
                      >
                        {detail.severityLabel}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{detail.detail}</p>

                  {detail.suggestion && (
                    <div className="flex items-start gap-2 pt-1 text-xs text-amber-900 dark:text-amber-200 font-medium">
                      <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <span>{detail.suggestion}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <ul className="mt-1 space-y-1.5 text-xs text-muted-foreground pl-1">
              {userFacingWarnings.map((warning) => (
                <li key={warning.code} className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                  <span>{warning.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
