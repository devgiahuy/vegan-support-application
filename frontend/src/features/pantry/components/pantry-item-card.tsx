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
    <Card className="flex flex-col justify-between hover:shadow-md transition-shadow border-neutral-200/80 dark:border-neutral-800">
      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-neutral-900 dark:text-neutral-100 truncate">
                {item.displayName}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                {item.isCanonical ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200"
                  >
                    Chuẩn từ điển
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400"
                  >
                    Tự do
                  </Badge>
                )}
                {hasDuplicates && (
                  <Badge
                    variant="outline"
                    onClick={() => onOpenMerge?.(item)}
                    className="text-[10px] text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/60"
                    title="Nhấn để gộp nguyên liệu trùng lặp"
                  >
                    <GitMerge className="h-2.5 w-2.5 mr-0.5" />
                    Có trùng lặp
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">• {item.sourceLabel}</span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mr-1.5 text-muted-foreground"
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

          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              {item.formattedQuantity}
            </div>
            {item.conversion.formattedGrams && (
              <span className="text-xs text-muted-foreground font-medium">
                {item.conversion.formattedGrams}
              </span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-col gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Hạn sử dụng:
            </span>
            <Badge variant={item.expiryBadgeVariant} className="text-[11px] font-normal">
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

      <CardFooter className="px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenAdjustment(item, 'CONSUME')}
          className="flex-1 h-8 text-xs font-medium"
        >
          <MinusCircle className="h-3.5 w-3.5 mr-1 text-amber-600 dark:text-amber-400" />
          Tiêu hao
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenAdjustment(item, 'RESTORE')}
          className="flex-1 h-8 text-xs font-medium"
        >
          <PlusCircle className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
          Bổ sung
        </Button>
      </CardFooter>
    </Card>
  );
}
