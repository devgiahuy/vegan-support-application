'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useRecipeNutritionHistoryQuery } from '../queries/recipe-nutrition.queries';
import { History, Calendar, Flame, Sparkles, Scale, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export interface RecipeNutritionHistoryDialogProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeNutritionHistoryDialog({
  postId,
  isOpen,
  onClose,
}: RecipeNutritionHistoryDialogProps) {
  const [page, setPage] = useState(1);
  const limit = 5;

  const { data, isLoading, isError, error } = useRecipeNutritionHistoryQuery(postId, page, limit, {
    enabled: isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Lịch sử tính toán dinh dưỡng</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Truy vết các phiên bản tính toán calo và vi chất đã lưu của công thức
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          )}

          {isError && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Không thể tải lịch sử tính toán</p>
                <p className="text-xs mt-0.5 opacity-90">
                  {error instanceof Error ? error.message : 'Vui lòng thử lại sau.'}
                </p>
              </div>
            </div>
          )}

          {!isLoading && !isError && (!data?.items || data.items.length === 0) && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Chưa có dữ liệu lịch sử tính toán cho công thức này.
            </div>
          )}

          {!isLoading && !isError && data?.items && data.items.length > 0 && (
            <div className="space-y-2.5">
              {data.items.map((item, idx) => (
                <div
                  key={`${item.estimateVersion}-${idx}`}
                  className="p-3.5 rounded-lg border border-border/70 bg-card hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">
                        Phiên bản #{item.estimateVersion}
                      </span>
                      {item.aiAssisted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-medium">
                          <Sparkles className="w-3 h-3" /> AI hỗ trợ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                          <Scale className="w-3 h-3" /> Khoa học chuẩn
                        </span>
                      )}
                      {item.isStale && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-normal">
                          Đã cũ
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.formattedDate || item.createdAt}
                      </span>
                      <span>Khẩu phần: {item.servings}</span>
                      <span>Độ tin cậy: {item.confidenceScore}%</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 font-bold text-sm text-foreground justify-end">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span>{item.caloriesPerServing}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">
                        kcal
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">mỗi khẩu phần</span>
                  </div>
                </div>
              ))}

              {/* Pagination Controls */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                  <span className="text-muted-foreground">
                    Trang {page} / {data.totalPages} ({data.total} bản ghi)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="h-7 px-2 text-xs"
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.totalPages}
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                      className="h-7 px-2 text-xs"
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
