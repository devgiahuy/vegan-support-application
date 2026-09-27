'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MealAnalysisCard } from './meal-analysis-card';
import type { MealWarning, MealWarningScope } from '../types/meal-analysis.model';

interface MealAnalysisAlertsProps {
  warnings: MealWarning[];
  onViewDetails?: (warning: MealWarning) => void;
  onViewSwaps?: (warning: MealWarning) => void;
  className?: string;
}

type FilterScope = 'ALL' | MealWarningScope;

/**
 * Danh sách hiển thị các cảnh báo dinh dưỡng & tương thích có bộ lọc phạm vi.
 */
export function MealAnalysisAlerts({
  warnings,
  onViewDetails,
  onViewSwaps,
  className = '',
}: MealAnalysisAlertsProps) {
  const [activeTab, setActiveTab] = React.useState<FilterScope>('ALL');

  const [isExpanded, setIsExpanded] = React.useState(false);
  const INITIAL_DISPLAY_COUNT = 3;

  if (warnings.length === 0) {
    return null;
  }

  // Sắp xếp ưu tiên DANGER lên đầu
  const sortedWarnings = [...warnings].sort((a, b) => {
    if (a.severity === 'DANGER' && b.severity !== 'DANGER') return -1;
    if (a.severity !== 'DANGER' && b.severity === 'DANGER') return 1;
    return 0;
  });

  const filteredWarnings =
    activeTab === 'ALL' ? sortedWarnings : sortedWarnings.filter((w) => w.scope === activeTab);

  const displayedWarnings = isExpanded
    ? filteredWarnings
    : filteredWarnings.slice(0, INITIAL_DISPLAY_COUNT);

  const hasMore = filteredWarnings.length > INITIAL_DISPLAY_COUNT;
  const remainingCount = filteredWarnings.length - INITIAL_DISPLAY_COUNT;

  const sameDishCount = warnings.filter((w) => w.scope === 'SAME_DISH').length;
  const sameMealCount = warnings.filter((w) => w.scope === 'SAME_MEAL').length;
  const sameDayCount = warnings.filter((w) => w.scope === 'SAME_DAY').length;

  return (
    <div
      id="canh-bao-chi-tiet"
      className={`space-y-3 rounded-xl border bg-card/60 p-4 transition-all ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Chi tiết Cảnh báo Dinh dưỡng ({warnings.length})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dữ liệu khuyến nghị tương thích và giới hạn an toàn thực đơn
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val as FilterScope);
            setIsExpanded(false);
          }}
          className="w-auto"
        >
          <TabsList className="h-8 p-1">
            <TabsTrigger value="ALL" className="h-6 px-2.5 text-xs">
              Tất cả ({warnings.length})
            </TabsTrigger>
            {sameDishCount > 0 && (
              <TabsTrigger value="SAME_DISH" className="h-6 px-2.5 text-xs">
                Cùng món ({sameDishCount})
              </TabsTrigger>
            )}
            {sameMealCount > 0 && (
              <TabsTrigger value="SAME_MEAL" className="h-6 px-2.5 text-xs">
                Cùng bữa ({sameMealCount})
              </TabsTrigger>
            )}
            {sameDayCount > 0 && (
              <TabsTrigger value="SAME_DAY" className="h-6 px-2.5 text-xs">
                Cả ngày ({sameDayCount})
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      {filteredWarnings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
          Không có cảnh báo nào trong phạm vi đã chọn.
        </div>
      ) : (
        <div className="space-y-3">
          {displayedWarnings.map((warning) => (
            <MealAnalysisCard
              key={warning.id}
              warning={warning}
              onViewDetails={onViewDetails}
              onViewSwaps={onViewSwaps}
            />
          ))}

          {hasMore && (
            <div className="pt-2 text-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-medium gap-1.5 h-8 px-4"
              >
                {isExpanded ? (
                  <>Thu gọn bớt cảnh báo</>
                ) : (
                  <>Xem thêm {remainingCount} cảnh báo khác trong mục này</>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
