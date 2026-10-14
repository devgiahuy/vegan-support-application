'use client';

import React, { useState, useMemo } from 'react';
import { GitMerge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  usePantryItemsQuery,
  useExpiringSoonQuery,
} from '@/features/pantry/queries/pantry.queries';
import { PantryHeader } from '@/features/pantry/components/pantry-header';
import { PantryTabs } from '@/features/pantry/components/pantry-tabs';
import { PantryItemList } from '@/features/pantry/components/pantry-item-list';
import { PantrySafetyBanner } from '@/features/pantry/components/pantry-safety-banner';
import { PantryItemDialog } from '@/features/pantry/components/pantry-item-dialog';
import { PantryAdjustmentDialog } from '@/features/pantry/components/pantry-adjustment-dialog';
import { PantryHistoryDialog } from '@/features/pantry/components/pantry-history-dialog';
import { PantryDeleteDialog } from '@/features/pantry/components/pantry-delete-dialog';
import { PantryMergeDialog } from '@/features/pantry/components/pantry-merge-dialog';
import type { PantryItem, PantryItemSource } from '@/features/pantry/types/pantry.model';
import { findPantryDuplicateGroups } from '@/features/pantry/utils/pantry-helpers';

export function PantryClientView() {
  const [activeTab, setActiveTab] = useState<'all' | 'expiring'>('all');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<PantryItemSource | 'ALL'>('ALL');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [adjustmentItem, setAdjustmentItem] = useState<PantryItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'CONSUME' | 'RESTORE'>('CONSUME');
  const [historyItem, setHistoryItem] = useState<PantryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<PantryItem | null>(null);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergePreselectedItem, setMergePreselectedItem] = useState<PantryItem | null>(null);

  // Queries
  const itemsQuery = usePantryItemsQuery({
    search: search || undefined,
    source: sourceFilter === 'ALL' ? undefined : sourceFilter,
    limit: 100,
  });

  const expiringQuery = useExpiringSoonQuery({
    days: 7,
    limit: 100,
  });

  const allItems = itemsQuery.data?.items || [];
  const expiringItems = expiringQuery.data?.items || [];

  // Nhóm các nguyên liệu trùng lặp trong kho
  const duplicateGroups = useMemo(() => findPantryDuplicateGroups(allItems), [allItems]);

  const displayedItems = activeTab === 'all' ? allItems : expiringItems;
  const isCurrentLoading = activeTab === 'all' ? itemsQuery.isLoading : expiringQuery.isLoading;
  const isCurrentError = activeTab === 'all' ? itemsQuery.isError : expiringQuery.isError;
  const handleRetry = () => {
    if (activeTab === 'all') itemsQuery.refetch();
    else expiringQuery.refetch();
  };

  const handleOpenAdjustment = (item: PantryItem, initialType: 'CONSUME' | 'RESTORE') => {
    setAdjustmentItem(item);
    setAdjustmentType(initialType);
  };

  const handleOpenMerge = (item?: PantryItem) => {
    setMergePreselectedItem(item || null);
    setMergeDialogOpen(true);
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <PantrySafetyBanner />

      <PantryHeader
        search={search}
        onSearchChange={setSearch}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        onOpenCreateDialog={() => {
          setEditingItem(null);
          setCreateDialogOpen(true);
        }}
        onOpenMergeDialog={() => handleOpenMerge()}
        totalItems={itemsQuery.data?.metadata?.totalItems || 0}
        duplicateCount={duplicateGroups.length}
      />

      {/* Banner thông báo khi có nguyên liệu trùng lặp */}
      {duplicateGroups.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-emerald-200/80 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100 text-xs sm:text-sm shadow-xs">
          <div className="flex items-center gap-2.5">
            <GitMerge className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                Phát hiện {duplicateGroups.length} nhóm nguyên liệu trùng lặp:{' '}
              </span>
              <span className="text-emerald-800 dark:text-emerald-300">
                {duplicateGroups.map((g) => `${g.name} (${g.items.length} thẻ)`).join(', ')}. Bạn có
                thể gộp lại để kiểm soát số lượng thuận tiện hơn.
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenMerge(duplicateGroups[0].items[0])}
            className="border-emerald-600 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400 dark:text-emerald-300 shrink-0 self-end sm:self-auto h-8 text-xs font-semibold"
          >
            Gộp ngay
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <PantryTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalCount={itemsQuery.data?.metadata?.totalItems || 0}
          expiringCount={expiringQuery.data?.metadata?.totalItems || 0}
        />
      </div>

      <PantryItemList
        items={displayedItems}
        allPantryItems={allItems}
        isLoading={isCurrentLoading}
        isError={isCurrentError}
        onRetry={handleRetry}
        onOpenCreateDialog={() => {
          setEditingItem(null);
          setCreateDialogOpen(true);
        }}
        onOpenAdjustment={handleOpenAdjustment}
        onOpenHistory={(item) => setHistoryItem(item)}
        onOpenEdit={(item) => {
          setEditingItem(item);
          setCreateDialogOpen(true);
        }}
        onOpenDelete={(item) => setDeleteItem(item)}
        onOpenMerge={(item) => handleOpenMerge(item)}
      />

      {/* Dialogs */}
      <PantryItemDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        editingItem={editingItem}
      />

      <PantryAdjustmentDialog
        open={Boolean(adjustmentItem)}
        onOpenChange={(open) => !open && setAdjustmentItem(null)}
        item={adjustmentItem}
        initialType={adjustmentType}
      />

      <PantryHistoryDialog
        open={Boolean(historyItem)}
        onOpenChange={(open) => !open && setHistoryItem(null)}
        item={historyItem}
      />

      <PantryDeleteDialog
        open={Boolean(deleteItem)}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        item={deleteItem}
      />

      <PantryMergeDialog
        open={mergeDialogOpen}
        onOpenChange={(open) => {
          setMergeDialogOpen(open);
          if (!open) setMergePreselectedItem(null);
        }}
        items={allItems}
        preselectedItem={mergePreselectedItem}
      />
    </div>
  );
}
