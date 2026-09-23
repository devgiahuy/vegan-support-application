'use client';

import React, { useState } from 'react';
import {
  useRecipeNutritionQuery,
  useRecipeNutritionStatusQuery,
  useRecalculateNutritionMutation,
} from '../queries/recipe-nutrition.queries';
import { MacroDistributionBar } from './macro-distribution-bar';
import { NutrientListTable } from './nutrient-list-table';
import { UncoveredIngredientsAlert } from './uncovered-ingredients-alert';
import { RecipeNutritionHistoryDialog } from './recipe-nutrition-history-dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertTriangle, History, RotateCw, Sparkles, Info } from 'lucide-react';

export interface RecipeNutritionCardProps {
  postId: string;
  isAuthorOrAdmin?: boolean;
  className?: string;
}

export function RecipeNutritionCard({
  postId,
  isAuthorOrAdmin = false,
  className,
}: RecipeNutritionCardProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [recalculateModalOpen, setRecalculateModalOpen] = useState(false);
  const [useAiFallback, setUseAiFallback] = useState(true);

  // Queries
  const {
    data: nutrition,
    isLoading: isNutritionLoading,
    isError: isNutritionError,
    error: nutritionError,
    refetch: refetchNutrition,
  } = useRecipeNutritionQuery(postId);

  const { data: statusData, isLoading: isStatusLoading } = useRecipeNutritionStatusQuery(postId, {
    enabled: isAuthorOrAdmin,
  });

  // Mutation recalculate
  const recalculateMutation = useRecalculateNutritionMutation(postId);

  const handleRecalculate = async () => {
    try {
      await recalculateMutation.mutateAsync({
        useAiFallback,
        expectedPostVersion: nutrition?.postVersion,
      });
      setRecalculateModalOpen(false);
    } catch {
      // toast đã được xử lý tự động trong hook queries
    }
  };

  const isLoading = isNutritionLoading;
  const isStale = Boolean(statusData?.isStale || nutrition?.isStale);

  // 1. Trạng thái Loading Skeleton
  if (isLoading) {
    return (
      <div
        className={`rounded-2xl border border-border/70 bg-card p-5 sm:p-6 space-y-4 shadow-xs ${
          className || ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-40 h-5" />
          </div>
          <Skeleton className="w-24 h-4" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    );
  }

  // 2. Trạng thái Chưa có dữ liệu hoặc Lỗi 404 (Empty State)
  if (isNutritionError || !nutrition) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-border/80 bg-card/50 p-6 text-center space-y-3 ${
          className || ''
        }`}
      >
        <div className="mx-auto w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Activity className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">
            Chưa có thông tin dinh dưỡng chính thức
          </h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {isAuthorOrAdmin
              ? 'Bạn là tác giả của công thức này. Hãy kích hoạt tính toán dinh dưỡng tự động dựa trên nguyên liệu và các bước nấu.'
              : 'Công thức này chưa được phân tích dinh dưỡng chi tiết theo phương pháp chế biến.'}
          </p>
        </div>

        {isAuthorOrAdmin && (
          <div className="pt-2">
            <Button
              size="sm"
              onClick={() => setRecalculateModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs inline-flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Tính toán dinh dưỡng ngay</span>
            </Button>
          </div>
        )}

        {/* Modal Recalculate */}
        <Dialog open={recalculateModalOpen} onOpenChange={setRecalculateModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Tính toán dinh dưỡng công thức
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Hệ thống sẽ đối soát nguyên liệu sạch sau sơ chế, áp dụng hệ số giữ lại dinh dưỡng
                của phương pháp nấu để tính toán.
              </DialogDescription>
            </DialogHeader>

            <div className="py-3 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-muted/40">
                <div className="space-y-0.5 pr-3">
                  <Label
                    htmlFor="ai-toggle-initial"
                    className="text-xs font-semibold cursor-pointer"
                  >
                    Cho phép AI ước lượng vi chất còn thiếu
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Sử dụng mô hình AI hỗ trợ suy luận bổ trợ nếu nguyên liệu thiếu hệ số nhiệt
                    độ/cách nấu.
                  </p>
                </div>
                <Switch
                  id="ai-toggle-initial"
                  checked={useAiFallback}
                  onCheckedChange={setUseAiFallback}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRecalculateModalOpen(false)}
                className="text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={handleRecalculate}
                disabled={recalculateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs inline-flex items-center gap-1.5"
              >
                {recalculateMutation.isPending && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Bắt đầu tính toán</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // 3. Trạng thái Đầy đủ Dữ liệu (Success State)
  return (
    <div
      className={`rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-5 shadow-xs transition-all ${
        className || ''
      }`}
    >
      {/* Header Thẻ Dinh dưỡng */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Phân tích Dinh dưỡng Nấu nướng</h3>
            <p className="text-xs text-muted-foreground">
              Có tính đến hao hụt nhiệt độ và phương pháp chế biến (Cooking-aware)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="h-8 text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lịch sử tính</span>
          </Button>

          {isAuthorOrAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRecalculateModalOpen(true)}
              className="h-8 text-xs inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Tính lại</span>
            </Button>
          )}
        </div>
      </div>

      {/* Cảnh báo Dữ liệu Cũ (Stale Warning Banner) */}
      {isStale && (
        <div className="rounded-xl border border-amber-300/80 bg-amber-50/90 dark:border-amber-900/60 dark:bg-amber-950/40 p-3.5 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-950 dark:text-amber-200">
                Dữ liệu dinh dưỡng có thể đã cũ
              </span>
              <p className="text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                Công thức hoặc nguyên liệu đã có sự thay đổi sau lần tính trước.
              </p>
            </div>
          </div>
          {isAuthorOrAdmin && (
            <Button
              size="sm"
              onClick={() => setRecalculateModalOpen(true)}
              className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white shrink-0"
            >
              Làm mới ngay
            </Button>
          )}
        </div>
      )}

      {/* Biểu đồ Phân bổ Calo Macro */}
      <MacroDistributionBar macros={nutrition.macros} servings={nutrition.servings} />

      {/* Cảnh báo nguyên liệu chưa có dữ liệu */}
      {nutrition.hasUncoveredIngredients && (
        <UncoveredIngredientsAlert
          uncoveredIngredients={nutrition.uncoveredIngredients}
          confidenceScore={nutrition.confidenceScore}
        />
      )}

      {/* Bảng chi tiết vi chất */}
      <NutrientListTable nutrients={nutrition.perServingNutrients} />

      {/* Footer Disclaimer & Ghi chú */}
      <div className="pt-3 border-t border-border/50 flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
        <Info className="w-3.5 h-3.5 shrink-0 text-muted-foreground/80 mt-0.5" />
        <p>{nutrition.disclaimerText}</p>
      </div>

      {/* Modal Lịch sử tính toán */}
      <RecipeNutritionHistoryDialog
        postId={postId}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      {/* Modal Tính toán lại */}
      <Dialog open={recalculateModalOpen} onOpenChange={setRecalculateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Tính toán lại dinh dưỡng</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Hệ thống sẽ phân tích lại toàn bộ nguyên liệu sạch và các bước nấu của phiên bản hiện
              tại.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-muted/40">
              <div className="space-y-0.5 pr-3">
                <Label htmlFor="ai-toggle-recalc" className="text-xs font-semibold cursor-pointer">
                  Cho phép AI ước lượng vi chất còn thiếu
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Gắn nhãn "AI ước lượng" rõ ràng cho các giá trị bổ trợ.
                </p>
              </div>
              <Switch
                id="ai-toggle-recalc"
                checked={useAiFallback}
                onCheckedChange={setUseAiFallback}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRecalculateModalOpen(false)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleRecalculate}
              disabled={recalculateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs inline-flex items-center gap-1.5"
            >
              {recalculateMutation.isPending && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Bắt đầu tính lại</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
