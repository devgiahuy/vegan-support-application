'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Check, Flame, Search, Utensils, BookOpen, Users } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { useCustomMealsQuery } from '@/features/custom-meal/queries/custom-meal.queries';
import { useRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import type { CustomMealListItem } from '@/features/custom-meal/types/custom-meal.model';
import type { Recipe } from '@/features/recipe/types/recipe.model';

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
  const [servings, setServings] = useState<number>(1);

  // Lấy danh sách món ăn cá nhân (Phase 17)
  const { data: customMealsData, isLoading: isCustomLoading } = useCustomMealsQuery(
    { search: search.trim() || undefined, limit: 20 },
    open && activeTab === 'custom'
  );

  // Lấy danh sách công thức cộng đồng
  const { data: recipesData, isLoading: isRecipesLoading } = useRecipesQuery(
    { q: search.trim() || undefined, limit: 20 },
    { enabled: open && activeTab === 'recipes' }
  );

  const handleSelectCustomMeal = (meal: CustomMealListItem) => {
    onSelect({
      sourceType: 'CUSTOM_MEAL',
      id: meal.id,
      title: meal.name,
      servings: Math.max(1, servings),
      calories: meal.calculatedCalories || meal.userCalories || null,
      coverPhotoUrl: meal.coverPhotoUrl,
    });
    onOpenChange(false);
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    onSelect({
      sourceType: 'RECIPE',
      id: recipe.id,
      title: recipe.title,
      servings: Math.max(1, servings),
      calories: recipe.nutrition?.calories || null,
      coverPhotoUrl: recipe.coverImageUrl || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-base">
            <Utensils className="w-5 h-5 text-primary" />
            Chọn món cho {mealTypeLabel || 'bữa ăn'} {dayLabel ? `(${dayLabel})` : ''}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Chọn từ bộ sưu tập món ăn cá nhân của bạn hoặc công thức chuẩn từ cộng đồng.
          </DialogDescription>
        </DialogHeader>

        {/* Thanh khẩu phần ăn muốn thêm */}
        <div className="flex items-center justify-between bg-muted/30 p-2.5 rounded-lg border border-border/60">
          <Label htmlFor="selector-servings" className="text-xs font-medium text-foreground">
            Số khẩu phần ăn cho bữa này:
          </Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 text-xs"
              onClick={() => setServings((prev) => Math.max(1, prev - 1))}
              disabled={servings <= 1}
            >
              -
            </Button>
            <span className="w-8 text-center text-xs font-semibold">{servings}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 text-xs"
              onClick={() => setServings((prev) => Math.min(20, prev + 1))}
              disabled={servings >= 20}
            >
              +
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'custom' | 'recipes')}
          className="flex-1 flex flex-col min-h-0 mt-1"
        >
          <TabsList className="grid grid-cols-2 w-full h-9">
            <TabsTrigger value="custom" className="text-xs gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Món ăn cá nhân ({customMealsData?.pagination.totalItems ?? 0})
            </TabsTrigger>
            <TabsTrigger value="recipes" className="text-xs gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Công thức cộng đồng
            </TabsTrigger>
          </TabsList>

          {/* Ô tìm kiếm chung */}
          <div className="relative my-2.5">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên món hoặc nguyên liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          {/* Tab 1: Món ăn cá nhân */}
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
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg bg-muted/10 p-4">
                Chưa có món ăn cá nhân nào phù hợp. Bạn có thể tạo món mới tại mục &ldquo;Món ăn cá
                nhân&rdquo;.
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
                      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted/30 shrink-0 border">
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

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            {meal.name}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20"
                          >
                            Cá nhân
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span>{meal.servings} khẩu phần gốc</span>
                          {cal && (
                            <span className="flex items-center gap-0.5 text-orange-600 dark:text-orange-400 font-medium">
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
                      className="text-xs gap-1 text-primary shrink-0 hover:bg-primary/10"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Chọn
                    </Button>
                  </div>
                );
              })}
          </TabsContent>

          {/* Tab 2: Công thức cộng đồng */}
          <TabsContent
            value="recipes"
            className="flex-1 overflow-y-auto pr-1 min-h-0 space-y-2 mt-0"
          >
            {isRecipesLoading && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            )}

            {!isRecipesLoading && recipesData?.items.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg bg-muted/10 p-4">
                Không tìm thấy công thức món chay nào phù hợp với từ khóa.
              </div>
            )}

            {!isRecipesLoading &&
              recipesData?.items.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => handleSelectRecipe(recipe)}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/40 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted/30 shrink-0 border">
                      {recipe.coverImageUrl ? (
                        <Image
                          src={recipe.coverImageUrl}
                          alt={recipe.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-muted-foreground/50">
                          <BookOpen className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          {recipe.title}
                        </h4>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Công thức
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {recipe.nutrition?.calories ? (
                          <span className="flex items-center gap-0.5 text-orange-600 dark:text-orange-400 font-medium">
                            <Flame className="w-3 h-3" />
                            {Math.round(recipe.nutrition.calories)} kcal
                          </span>
                        ) : null}
                        <span>{recipe.servings || 1} khẩu phần</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs gap-1 text-primary shrink-0 hover:bg-primary/10"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Chọn
                  </Button>
                </div>
              ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
