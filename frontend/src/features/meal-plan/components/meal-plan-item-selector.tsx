'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Check, Flame, Search, Utensils } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomMealsQuery } from '@/features/custom-meal/queries/custom-meal.queries';
import type { CustomMealListItem } from '@/features/custom-meal/types/custom-meal.model';

export interface SelectedMealItem {
  sourceType: 'RECIPE' | 'CUSTOM_MEAL';
  id: string;
  title: string;
  servings: number;
  calories: number | null;
  coverPhotoUrl: string | null;
}

interface MealPlanItemSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: SelectedMealItem) => void;
  dayLabel?: string;
  mealTypeLabel?: string;
}

export const MealPlanItemSelector: React.FC<MealPlanItemSelectorProps> = ({
  open,
  onOpenChange,
  onSelect,
  dayLabel,
  mealTypeLabel,
}) => {
  const [activeTab, setActiveTab] = useState<'custom' | 'recipes'>('custom');
  const [search, setSearch] = useState('');

  // Lấy danh sách món ăn cá nhân
  const { data: customMealsData, isLoading: isCustomLoading } = useCustomMealsQuery(
    { search: search.trim() || undefined, limit: 20 },
    open
  );

  const handleSelectCustomMeal = (meal: CustomMealListItem) => {
    onSelect({
      sourceType: 'CUSTOM_MEAL',
      id: meal.id,
      title: meal.name,
      servings: meal.servings,
      calories: meal.calculatedCalories || meal.userCalories || null,
      coverPhotoUrl: meal.coverPhotoUrl,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Utensils className="w-5 h-5 text-primary" />
            Chọn món ăn cho {mealTypeLabel || 'bữa ăn'} {dayLabel ? `(${dayLabel})` : ''}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Chọn từ danh mục công thức cộng đồng hoặc bộ sưu tập món ăn cá nhân của bạn.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'custom' | 'recipes')}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="custom" className="text-xs">
              Món ăn cá nhân ({customMealsData?.pagination.totalItems ?? 0})
            </TabsTrigger>
            <TabsTrigger value="recipes" className="text-xs">
              Công thức cộng đồng
            </TabsTrigger>
          </TabsList>

          {/* Ô tìm kiếm chung */}
          <div className="relative my-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm món ăn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>

          {/* Tab Món ăn cá nhân */}
          <TabsContent
            value="custom"
            className="flex-1 overflow-y-auto pr-1 min-h-0 space-y-2 mt-0"
          >
            {isCustomLoading && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            )}

            {!isCustomLoading && customMealsData?.items.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg bg-muted/10">
                Chưa có món ăn cá nhân nào phù hợp. Bạn có thể tạo món mới trong mục "Món ăn của
                tôi".
              </div>
            )}

            {!isCustomLoading &&
              customMealsData?.items.map((meal) => {
                const cal = meal.calculatedCalories || meal.userCalories;
                return (
                  <div
                    key={meal.id}
                    onClick={() => handleSelectCustomMeal(meal)}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/40 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted/30 shrink-0">
                        {meal.coverPhotoUrl ? (
                          <Image
                            src={meal.coverPhotoUrl}
                            alt={meal.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-muted-foreground/50">
                            <Utensils className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            {meal.name}
                          </h4>
                          <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                            Cá nhân
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span>{meal.servings} khẩu phần</span>
                          {cal && (
                            <span className="flex items-center gap-0.5 text-orange-600 dark:text-orange-400">
                              <Flame className="w-3 h-3" />
                              {Math.round(cal)} kcal
                            </span>
                          )}
                          <span>{meal.ingredientCount} nguyên liệu</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs gap-1 text-primary shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Chọn
                    </Button>
                  </div>
                );
              })}
          </TabsContent>

          {/* Tab Công thức cộng đồng */}
          <TabsContent value="recipes" className="flex-1 overflow-y-auto pr-1 min-h-0 mt-0">
            <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg bg-muted/10">
              Chức năng chọn công thức chuẩn cộng đồng đang kết nối với danh mục món ăn.
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
