import React from 'react';
import {
  Calendar,
  History,
  MoreVertical,
  MinusCircle,
  PlusCircle,
  Edit,
  Trash2,
  Clock,
  Sparkles,
  GitMerge,
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PantryItem } from '../types/pantry.model';

interface PantryItemCardProps {
  item: PantryItem;
  onOpenAdjustment: (item: PantryItem, initialType: 'CONSUME' | 'RESTORE') => void;
  onOpenHistory: (item: PantryItem) => void;
  onOpenEdit: (item: PantryItem) => void;
  onOpenDelete: (item: PantryItem) => void;
  hasDuplicates?: boolean;
  onOpenMerge?: (item: PantryItem) => void;
}

export function PantryItemCard({
  item,
  onOpenAdjustment,
  onOpenHistory,
  onOpenEdit,
  onOpenDelete,
  hasDuplicates = false,
  onOpenMerge,
}: PantryItemCardProps) {
  return (
    <Card className="flex min-w-0 flex-col justify-between border-neutral-200/80 transition-shadow hover:shadow-md dark:border-neutral-800">
      <CardContent className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
        <div>
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-neutral-900 text-balance dark:text-neutral-100">
                {item.displayName}
              </h3>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                {item.isCanonical ? (
                  <Badge
                    variant="outline"
                    className="max-w-full whitespace-normal text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200"
                  >
                    Chuẩn từ điển
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="whitespace-normal text-[10px] text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400"
                  >
                    Tự do
                  </Badge>
                )}
                {hasDuplicates && (
                  <Badge
                    variant="outline"
                    onClick={() => onOpenMerge?.(item)}
                    className="max-w-full whitespace-normal text-[10px] text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/60"
                    title="Nhấn để gộp nguyên liệu trùng lặp"
                  >
                    <GitMerge className="h-2.5 w-2.5 mr-0.5" />
                    Có trùng lặp
                  </Badge>
                )}
                <span className="min-w-0 flex-1 basis-full text-xs text-muted-foreground text-pretty">
                  <span aria-hidden="true">• </span>
                  {item.sourceLabel}
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Tùy chọn cho ${item.displayName}`}
                  className="-mr-1.5 size-11 shrink-0 text-muted-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {hasDuplicates && (
                  <DropdownMenuItem
                    onClick={() => onOpenMerge?.(item)}
                    className="text-emerald-700 dark:text-emerald-400 font-medium"
                  >
                    <GitMerge className="h-4 w-4 mr-2" />
                    Gộp mục trùng lặp...
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onOpenEdit(item)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Sửa thông tin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenHistory(item)}>
                  <History className="h-4 w-4 mr-2" />
                  Lịch sử sổ cái
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onOpenDelete(item)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa khỏi tủ bếp
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-4 flex min-w-0 items-baseline justify-between gap-2">
            <div className="min-w-0 break-words text-xl font-bold tabular-nums tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-2xl">
              {item.formattedQuantity}
            </div>
            {item.conversion.formattedGrams && (
              <span className="shrink-0 text-right text-xs font-medium text-muted-foreground">
                {item.conversion.formattedGrams}
              </span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-col gap-1.5 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5 shrink-0" />
              Hạn sử dụng:
            </span>
            <Badge
              variant={item.expiryBadgeVariant}
              className="max-w-full whitespace-normal text-[11px] font-normal"
            >
              {item.expiryBadgeLabel}
            </Badge>
          </div>

          {item.freshnessNote && (
            <p className="text-[11px] italic text-neutral-600 dark:text-neutral-400 line-clamp-1 mt-0.5">
              "{item.freshnessNote}"
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 border-t border-neutral-100 bg-neutral-50/70 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenAdjustment(item, 'CONSUME')}
          className="h-11 min-w-0 flex-1 whitespace-normal px-2 text-xs font-medium"
        >
          <MinusCircle className="h-3.5 w-3.5 mr-1 text-amber-600 dark:text-amber-400" />
          Tiêu hao
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenAdjustment(item, 'RESTORE')}
          className="h-11 min-w-0 flex-1 whitespace-normal px-2 text-xs font-medium"
        >
          <PlusCircle className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
          Bổ sung
        </Button>
      </CardFooter>
    </Card>
  );
}
