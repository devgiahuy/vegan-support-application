import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, GitMerge, CheckCircle2, Loader2, Sparkles, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PantryItem, PantryMergePreview } from '../types/pantry.model';
import {
  usePreviewPantryMergeMutation,
  useMergePantryItemsMutation,
} from '../queries/pantry.queries';
import {
  findPantryDuplicateGroups,
  getPantryItemIdentityKey,
  isDuplicatePantryItem,
} from '../utils/pantry-helpers';

interface PantryMergeDialogProps {
  items: PantryItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedItem?: PantryItem | null;
}

export function PantryMergeDialog({
  items,
  open,
  onOpenChange,
  preselectedItem,
}: PantryMergeDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetItemId, setTargetItemId] = useState<string>('');
  const [previewResult, setPreviewResult] = useState<PantryMergePreview | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const previewMutation = usePreviewPantryMergeMutation();
  const mergeMutation = useMergePantryItemsMutation();

  // Nhóm các nguyên liệu trùng lặp
  const duplicateGroups = useMemo(() => findPantryDuplicateGroups(items), [items]);

  // Khởi tạo trạng thái khi mở dialog
  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setTargetItemId('');
      setPreviewResult(null);
      setSearchFilter('');
      return;
    }

    if (preselectedItem) {
      const targetKey = getPantryItemIdentityKey(preselectedItem);
      const matchingItems = items.filter((i) => getPantryItemIdentityKey(i) === targetKey);
      if (matchingItems.length >= 2) {
        setSelectedIds(matchingItems.map((i) => i.id));
        setTargetItemId(preselectedItem.id);
        return;
      }
    }

    // Nếu không có preselectedItem nhưng có ít nhất 1 nhóm trùng lặp, gợi ý nhóm đầu tiên
    if (duplicateGroups.length > 0 && selectedIds.length === 0) {
      const firstGroup = duplicateGroups[0];
      setSelectedIds(firstGroup.items.map((i) => i.id));
      setTargetItemId(firstGroup.items[0].id);
    }
  }, [open, preselectedItem, items, duplicateGroups]);

  // Tự động tính toán xem trước (Auto-preview) khi số lượng mục chọn >= 2
  useEffect(() => {
    if (selectedIds.length < 2) {
      setPreviewResult(null);
      return;
    }

    let isSubscribed = true;
    previewMutation
      .mutateAsync({ itemIds: selectedIds })
      .then((res) => {
        if (!isSubscribed) return;
        setPreviewResult(res);
        if (res.targetItemId && (!targetItemId || !selectedIds.includes(targetItemId))) {
          setTargetItemId(res.targetItemId);
        }
      })
      .catch(() => {
        if (!isSubscribed) return;
        setPreviewResult(null);
      });

    return () => {
      isSubscribed = false;
    };
  }, [selectedIds]);

  const handleToggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      if (!next.includes(targetItemId) && next.length > 0) {
        setTargetItemId(next[0]);
      }
      return next;
    });
  };

  const handleSelectGroup = (groupIds: string[]) => {
    setSelectedIds(groupIds);
    if (groupIds.length > 0) {
      setTargetItemId(groupIds[0]);
    }
  };

  const handleExecuteMerge = async () => {
    if (selectedIds.length < 2 || !targetItemId) return;

    const itemsPayload = selectedIds.map((id) => {
      const found = items.find((i) => i.id === id);
      return {
        id,
        expectedVersion: found?.version || 1,
      };
    });

    const idempotencyKey = `pantry-merge-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    await mergeMutation.mutateAsync({
      targetItemId,
      items: itemsPayload,
      idempotencyKey,
    });

    onOpenChange(false);
  };

  const filteredItems = useMemo(() => {
    if (!searchFilter.trim()) return items;
    const term = searchFilter.trim().toLowerCase();
    return items.filter((i) => i.displayName.toLowerCase().includes(term));
  }, [items, searchFilter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
            <GitMerge className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Gộp các nguyên liệu trùng lặp
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Chọn từ 2 mục nguyên liệu cùng loại để cộng dồn tồn kho và hợp nhất thành một thẻ duy
            nhất trong tủ bếp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nhóm trùng lặp gợi ý */}
          {duplicateGroups.length > 0 && (
            <div className="p-3 rounded-lg border border-emerald-200/80 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Gợi ý nhóm trùng lặp trong tủ bếp:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {duplicateGroups.map((group) => {
                  const isCurrentGroupSelected =
                    group.items.length === selectedIds.length &&
                    group.items.every((i) => selectedIds.includes(i.id));

                  return (
                    <Button
                      key={group.key}
                      type="button"
                      size="sm"
                      variant={isCurrentGroupSelected ? 'default' : 'outline'}
                      onClick={() => handleSelectGroup(group.items.map((i) => i.id))}
                      className={
                        isCurrentGroupSelected
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5'
                          : 'border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900 text-xs h-7 px-2.5'
                      }
                    >
                      {group.name} ({group.items.length} mục)
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Danh sách chọn nguyên liệu */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Danh sách nguyên liệu ({selectedIds.length} đã chọn):
              </Label>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-muted-foreground hover:text-destructive underline cursor-pointer"
                >
                  Bỏ chọn tất cả
                </button>
              )}
            </div>

            {/* Ô tìm kiếm nhanh khi danh sách nhiều */}
            {items.length > 6 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Lọc nhanh theo tên nguyên liệu..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 h-8 text-xs bg-muted/20"
                />
              </div>
            )}

            <div className="border rounded-lg max-h-48 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 p-1 bg-card">
              {filteredItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const hasDuplicate = isDuplicatePantryItem(item, items);

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-700/60'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
                    }`}
                    onClick={() => handleToggleItem(item.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleItem(item.id)}
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100 truncate">
                            {item.displayName}
                          </p>
                          {hasDuplicate && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 h-4 border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300"
                            >
                              Trùng lặp
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {item.sourceLabel} • Hạn dùng: {item.expiryBadgeLabel}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 shrink-0 ml-2">
                      {item.formattedQuantity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Loading khi đang tính toán */}
          {previewMutation.isPending && (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              <span>Đang tính toán xem trước số dư cộng dồn...</span>
            </div>
          )}

          {/* Kết quả tính toán xem trước */}
          {previewResult && !previewMutation.isPending && (
            <div className="space-y-3 p-3.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Tên nguyên liệu gộp:
                </span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {previewResult.label}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Tổng tồn kho sau khi gộp:
                </span>
                <div className="text-right">
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {previewResult.formattedResultQuantity}
                  </span>
                  {previewResult.resultGrams !== null && (
                    <span className="text-muted-foreground ml-1.5">
                      (≈ {previewResult.resultGrams}g)
                    </span>
                  )}
                </div>
              </div>

              {previewResult.warnings.length > 0 && (
                <Alert className="py-2 border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 text-xs">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <AlertDescription>{previewResult.warnings.join('; ')}</AlertDescription>
                </Alert>
              )}

              {previewResult.canMerge && (
                <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <Label
                    htmlFor="targetSelect"
                    className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                  >
                    Giữ lại thông tin của thẻ đích (Hạn dùng, ghi chú):
                  </Label>
                  <Select value={targetItemId} onValueChange={setTargetItemId}>
                    <SelectTrigger id="targetSelect" className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Chọn nguyên liệu đích..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedIds.map((id) => {
                        const found = items.find((i) => i.id === id);
                        return (
                          <SelectItem key={id} value={id} className="text-xs">
                            {found?.displayName} ({found?.formattedQuantity}) — Hạn dùng:{' '}
                            {found?.expiryBadgeLabel}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mergeMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={handleExecuteMerge}
            disabled={
              selectedIds.length < 2 ||
              !targetItemId ||
              !previewResult ||
              !previewResult.canMerge ||
              mergeMutation.isPending
            }
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {mergeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang gộp...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Xác nhận gộp nguyên liệu
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
