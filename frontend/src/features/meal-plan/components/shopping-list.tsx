'use client';

import React, { useState } from 'react';
import { ShoppingCart, ListFilter, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ShoppingGapView } from '@/features/receipt/components/shopping-gap-view';
import type { ShoppingListItem } from '../types/meal-plan.model';
import type { SelectedMealInput } from '@/features/receipt/types/shopping-gap.model';

interface ShoppingListProps {
  items: ShoppingListItem[];
  planMeals?: SelectedMealInput[];
}

/**
 * Danh sách đi chợ với 2 chế độ:
 * 1. "Đi chợ thông minh": Tính toán lượng còn thiếu theo Tủ bếp (Pantry-aware Shopping Gaps).
 * 2. "Tất cả nguyên liệu": Hiển thị tổng nguyên liệu công thức.
 */
export function ShoppingList({ items, planMeals = [] }: ShoppingListProps) {
  const [activeMode, setActiveMode] = useState<'smart' | 'all'>(
    planMeals.length > 0 ? 'smart' : 'all'
  );

  return (
    <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <span>Danh sách đi chợ</span>
            <span className="text-xs font-normal text-muted-foreground">
              ({items.length} nguyên liệu)
            </span>
          </CardTitle>

          {planMeals.length > 0 && (
            <Tabs value={activeMode} onValueChange={(val) => setActiveMode(val as 'smart' | 'all')}>
              <TabsList className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-1 h-8">
                <TabsTrigger value="smart" className="rounded-lg text-xs font-medium px-3 h-6">
                  <Sparkles className="h-3 w-3 mr-1 text-emerald-600" />
                  Đi chợ thông minh
                </TabsTrigger>
                <TabsTrigger value="all" className="rounded-lg text-xs font-medium px-3 h-6">
                  <ListFilter className="h-3 w-3 mr-1" />
                  Tất cả nguyên liệu
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {activeMode === 'smart' && planMeals.length > 0 ? (
          <ShoppingGapView meals={planMeals} />
        ) : (
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Chưa có nguyên liệu nào trong thực đơn.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, index) => (
                  <li
                    key={`${item.ingredientId ?? item.name}-${index}`}
                    className="flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2 text-sm border border-neutral-100 dark:border-neutral-800"
                  >
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                      {item.name}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                      {item.quantity} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
