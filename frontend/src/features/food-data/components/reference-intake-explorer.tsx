'use client';

import React, { useState } from 'react';
import { Search, Users, ShieldAlert, Award, Sparkles, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { useReferenceIntakesQuery } from '../queries/food-data.queries';
import { POPULATION_LABELS } from '../types/food-data.model';

const POPULATION_OPTIONS = [
  { value: 'ALL', label: 'Tất cả đối tượng' },
  { value: 'GENERAL_ADULT', label: 'Người trưởng thành chung' },
  { value: 'ADULT_MALE', label: 'Nam giới trưởng thành' },
  { value: 'ADULT_FEMALE', label: 'Nữ giới trưởng thành' },
  { value: 'PREGNANT_WOMAN', label: 'Phụ nữ mang thai' },
  { value: 'ELDERLY', label: 'Người cao tuổi' },
];

interface ReferenceIntakeExplorerProps {
  className?: string;
}

export function ReferenceIntakeExplorer({ className = '' }: ReferenceIntakeExplorerProps) {
  const [populationCode, setPopulationCode] = useState<string>('GENERAL_ADULT');
  const [keyword, setKeyword] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const query = useReferenceIntakesQuery({
    populationCode: populationCode === 'ALL' ? undefined : populationCode,
    page,
    limit: 12,
  });

  const { data, isLoading, isError, refetch } = query;

  // Lọc cục bộ theo từ khóa nếu người dùng gõ tìm tên dưỡng chất
  const filteredItems = React.useMemo(() => {
    if (!data?.items) return [];
    if (!keyword.trim()) return data.items;
    const lower = keyword.toLowerCase();
    return data.items.filter(
      (item) =>
        item.nutrientName.toLowerCase().includes(lower) ||
        item.nutrientCode.toLowerCase().includes(lower)
    );
  }, [data?.items, keyword]);

  return (
    <div className={`space-y-4 ${className}`} data-testid="reference-intake-explorer">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên dưỡng chất (Canxi, Sắt, Vitamin C...)"
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={populationCode}
            onValueChange={(val) => {
              setPopulationCode(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-56">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Nhóm đối tượng" />
            </SelectTrigger>
            <SelectContent>
              {POPULATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content States */}
      {isLoading && <LoadingState message="Đang tải dữ liệu nhu cầu khuyến nghị..." />}
      {isError && (
        <ErrorState title="Không thể tải dữ liệu khuyến nghị." onRetry={() => void refetch()} />
      )}

      {!isLoading && !isError && filteredItems.length === 0 && (
        <EmptyState
          title="Không tìm thấy mức khuyến nghị phù hợp."
          description="Thử tìm tên dưỡng chất khác hoặc đổi nhóm đối tượng nhân khẩu học."
        />
      )}

      {!isLoading && !isError && filteredItems.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border bg-card p-4 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{item.nutrientName}</h4>
                    <p className="text-xs text-muted-foreground font-mono">{item.nutrientCode}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px] dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 font-semibold"
                  >
                    {item.referenceType}
                  </Badge>
                </div>

                <div className="mt-3 rounded-lg bg-muted/40 p-2.5 space-y-1 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">Mức khuyến nghị (RDA/AI):</span>
                    <span className="font-bold text-base text-foreground font-mono">
                      {item.value}{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        {item.unit}/ngày
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-muted/80">
                    <span className="text-muted-foreground">Đối tượng:</span>
                    <span className="font-medium text-right text-foreground">
                      {item.populationName}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3 text-amber-500" />
                    <span className="truncate max-w-[140px]">{item.sourceName}</span>
                  </div>
                  {item.warningEligible && (
                    <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                      <ShieldAlert className="h-3 w-3" />
                      <span>Có cảnh báo</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {data && data.metadata && data.metadata.totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                page={data.metadata.page}
                totalPages={data.metadata.totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
