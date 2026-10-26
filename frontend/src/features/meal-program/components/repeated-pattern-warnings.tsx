'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/shared/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RepeatedPatternWarning } from '../types/meal-program.model';
import {
  paginateWarnings,
  formatPaginationSummary,
} from '../utils/repeated-pattern-warnings.utils';

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;
const DEFAULT_PAGE_SIZE = 5;

interface RepeatedPatternWarningsProps {
  warnings: RepeatedPatternWarning[];
  pageSize?: number;
}

export const RepeatedPatternWarnings: React.FC<RepeatedPatternWarningsProps> = ({
  warnings,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
}) => {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  const totalItems = warnings?.length ?? 0;

  if (!warnings || totalItems === 0) {
    return (
      <Card className="border border-emerald-200/60 dark:border-emerald-800/30 bg-emerald-50/20 dark:bg-emerald-950/10">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground text-balance">
              Độ đa dạng thực phẩm đạt chuẩn
            </p>
            <p className="text-xs text-muted-foreground text-pretty">
              Không phát hiện món ăn nào bị lặp lại quá dày đặc trong lộ trình. Thực đơn có sự cân
              đối phong phú giữa các nhóm nguyên liệu thực vật.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totalPages, currentPage, startIndex, endIndex, items } = paginateWarnings(
    warnings,
    page,
    pageSize
  );

  return (
    <Card className="border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/10 dark:bg-amber-950/10">
      <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between gap-2 space-y-0">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <CardTitle className="text-sm font-semibold text-foreground truncate">
            Cảnh báo tần suất lặp lại món ăn ({totalItems} món)
          </CardTitle>
        </div>
        {totalPages > 1 && (
          <span className="text-xs text-muted-foreground font-medium tabular-nums shrink-0">
            Trang {currentPage} / {totalPages}
          </span>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground text-pretty">
          Một số món ăn xuất hiện nhiều lần trong chu kỳ lộ trình. Bạn có thể cân nhắc hoán đổi sang
          các món chay tương đương để đa dạng vi chất tự nhiên:
        </p>

        <div className="space-y-2">
          {items.map((warning, index) => {
            const displayDates =
              warning.formattedDates && warning.formattedDates.length > 0
                ? warning.formattedDates
                : warning.dates;

            return (
              <div
                key={`${warning.mealId}-${startIndex + index}`}
                className="p-3 rounded-lg bg-background border space-y-1.5 transition-colors hover:border-amber-300/60 dark:hover:border-amber-800/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-foreground truncate">
                    {warning.mealName}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 shrink-0"
                  >
                    Lặp lại {warning.occurrences} lần
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
                  {warning.message}
                </p>

                {displayDates && displayDates.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[11px] text-muted-foreground mr-1">Các ngày:</span>
                    {displayDates.map((dateStr) => (
                      <span
                        key={dateStr}
                        className="px-1.5 py-0.5 rounded-xs bg-muted text-[10px] font-mono tabular-nums"
                      >
                        {dateStr}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Phân trang khi danh sách vượt quá 1 trang */}
        {totalPages > 1 && (
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-200/50 dark:border-amber-900/30 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-3">
              <span className="tabular-nums">
                {formatPaginationSummary(startIndex, endIndex, totalItems)}
              </span>

              {totalItems > DEFAULT_PAGE_SIZE && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    Mỗi trang:
                  </span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(val) => {
                      setPageSize(Number(val));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger
                      size="sm"
                      className="h-7 w-[68px] text-xs bg-background"
                      aria-label="Chọn số món trên mỗi trang"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={String(opt)} className="text-xs">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
