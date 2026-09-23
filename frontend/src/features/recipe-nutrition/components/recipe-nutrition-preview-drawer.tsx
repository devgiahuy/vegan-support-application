'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { usePreviewNutritionMutation } from '../queries/recipe-nutrition.queries';
import { MacroDistributionBar } from './macro-distribution-bar';
import { UncoveredIngredientsAlert } from './uncovered-ingredients-alert';
import { NutrientListTable } from './nutrient-list-table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Eye, RotateCw, AlertCircle, Info } from 'lucide-react';
import type { RecipeNutritionEstimateModel } from '../types/recipe-nutrition.model';

export interface RecipeNutritionPreviewDrawerProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  initialEstimate?: RecipeNutritionEstimateModel | null;
}

export function RecipeNutritionPreviewDrawer({
  postId,
  isOpen,
  onClose,
  initialEstimate,
}: RecipeNutritionPreviewDrawerProps) {
  const [useAiFallback, setUseAiFallback] = useState(false);
  const [previewResult, setPreviewResult] = useState<RecipeNutritionEstimateModel | null>(
    initialEstimate || null
  );

  const previewMutation = usePreviewNutritionMutation(postId);

  const handleRunPreview = async () => {
    if (!postId) return;
    try {
      const res = await previewMutation.mutateAsync({ useAiFallback });
      setPreviewResult(res);
    } catch {
      // toast đã được xử lý trong queries
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg overflow-y-auto p-4 sm:p-6 space-y-4"
      >
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold">
                Xem trước Dinh dưỡng Công thức
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Mô phỏng kết quả tính toán calo và vi chất theo phương pháp nấu (không lưu vào DB)
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Toolbar & Controls */}
        <div className="p-3 rounded-xl border border-border/70 bg-muted/40 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 pr-2">
              <Label htmlFor="preview-ai-toggle" className="font-semibold cursor-pointer">
                Bật AI ước lượng bổ trợ
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Suy đoán hệ số nấu nếu nguyên liệu chưa có đủ dữ liệu nhiệt
              </p>
            </div>
            <Switch
              id="preview-ai-toggle"
              checked={useAiFallback}
              onCheckedChange={setUseAiFallback}
            />
          </div>

          <Button
            size="sm"
            onClick={handleRunPreview}
            disabled={previewMutation.isPending || !postId}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs inline-flex items-center justify-center gap-1.5"
          >
            {previewMutation.isPending ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>
              {previewResult ? 'Cập nhật phân tích xem trước' : 'Bắt đầu xem trước dinh dưỡng'}
            </span>
          </Button>
        </div>

        {/* Preview State Display */}
        <div className="space-y-4 pt-1">
          {previewMutation.isPending && (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-44 w-full rounded-xl" />
            </div>
          )}

          {previewMutation.isError && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Không thể xem trước dinh dưỡng</p>
                <p className="mt-0.5 opacity-90">
                  {previewMutation.error instanceof Error
                    ? previewMutation.error.message
                    : 'Vui lòng kiểm tra lại nguyên liệu, số lượng hoặc số khẩu phần ăn.'}
                </p>
              </div>
            </div>
          )}

          {!previewMutation.isPending && !previewResult && !previewMutation.isError && (
            <div className="text-center py-12 text-muted-foreground text-xs space-y-2 border border-dashed rounded-xl p-4">
              <p className="font-medium text-foreground">Chưa có dữ liệu xem trước</p>
              <p>
                Bấm nút "Bắt đầu xem trước dinh dưỡng" ở trên để gửi yêu cầu phân tích tạm thời tới
                hệ thống.
              </p>
            </div>
          )}

          {!previewMutation.isPending && previewResult && (
            <div className="space-y-4">
              {/* Macro Bar */}
              <MacroDistributionBar
                macros={previewResult.macros}
                servings={previewResult.servings}
              />

              {/* Uncovered Ingredients */}
              {previewResult.hasUncoveredIngredients && (
                <UncoveredIngredientsAlert
                  uncoveredIngredients={previewResult.uncoveredIngredients}
                  confidenceScore={previewResult.confidenceScore}
                />
              )}

              {/* Nutrient List Table */}
              <NutrientListTable nutrients={previewResult.perServingNutrients} />

              {/* Educational Disclaimer */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-[11px] text-muted-foreground flex items-start gap-2 leading-relaxed">
                <Info className="w-3.5 h-3.5 shrink-0 text-muted-foreground mt-0.5" />
                <p>{previewResult.disclaimerText}</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
