import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PantryItem } from '../types/pantry.model';
import { usePantryAdjustmentsQuery } from '../queries/pantry.queries';

interface PantryHistoryDialogProps {
  item: PantryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PantryHistoryDialog({ item, open, onOpenChange }: PantryHistoryDialogProps) {
  const { data, isLoading, isError } = usePantryAdjustmentsQuery(
    item?.id || '',
    { limit: 50 },
    Boolean(item && open)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Lịch sử biến động: {item?.displayName}</DialogTitle>
          <DialogDescription>
            Sổ cái giao dịch bất biến ghi nhận mọi lần thêm, tiêu hao, hoàn trả hoặc bù sai lệch.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 border rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="py-8 text-center text-sm text-destructive">
              Không thể tải lịch sử biến động sổ cái.
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Chưa có bản ghi biến động nào cho nguyên liệu này.
            </div>
          ) : (
            <ScrollArea className="max-h-[360px] pr-3">
              <div className="space-y-2.5">
                {data.items.map((adj) => (
                  <div
                    key={adj.id}
                    className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            adj.type === 'CONSUME'
                              ? 'secondary'
                              : adj.type === 'RESTORE'
                                ? 'default'
                                : 'outline'
                          }
                          className="text-[10px]"
                        >
                          {adj.typeLabel}
                        </Badge>
                        <span className="font-semibold text-sm">{adj.formattedDelta}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{adj.formattedDate}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Số dư: {adj.formattedBalance}</span>
                      <span>
                        v{adj.versionBefore} → v{adj.versionAfter}
                      </span>
                    </div>

                    {adj.reason && (
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 italic pt-1 border-t border-neutral-100 dark:border-neutral-800/80">
                        "{adj.reason}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
