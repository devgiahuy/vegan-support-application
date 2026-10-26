'use client';

import * as React from 'react';
import { Sparkles, Users, Clock, Flame, Check, AlertCircle, Bot, Layers } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RecipeDifficulty } from '@/common/enums';
import type { RecipeDraftSuggestion } from '../types/recipe-draft.model';

export interface RecipeDraftPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: RecipeDraftSuggestion | null;
  onApply: () => void;
  isApplying?: boolean;
}

export function RecipeDraftPreviewDialog({
  open,
  onOpenChange,
  suggestion,
  onApply,
  isApplying = false,
}: RecipeDraftPreviewDialogProps) {
  if (!suggestion) return null;

  const difficultyLabel =
    suggestion.difficulty === RecipeDifficulty.EASY
      ? 'Dễ làm'
      : suggestion.difficulty === RecipeDifficulty.HARD
        ? 'Nâng cao'
        : 'Trung bình';

  const confidencePercent = Math.round(suggestion.confidence * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl">
        {/* Fixed Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/60 shrink-0 space-y-2.5 bg-background pr-14">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Gợi ý từ Trợ lý AI
            </div>
            <Badge
              variant="outline"
              className="rounded-full text-xs font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 gap-1"
            >
              <Bot className="h-3 w-3" /> Độ tin cậy: {confidencePercent}%
            </Badge>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            {suggestion.title}
          </DialogTitle>

          <DialogDescription className="sr-only">
            Bản nháp gợi ý công thức thuần chay từ trợ lý AI
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 modal-scroll">
          {/* Quick specs banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/30 p-3">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <div className="text-xs">
                <p className="text-muted-foreground">Khẩu phần</p>
                <p className="font-bold text-foreground">{suggestion.servings} người</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/30 p-3">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="text-xs">
                <p className="text-muted-foreground">Sơ chế</p>
                <p className="font-bold text-foreground">{suggestion.prepTimeMinutes} phút</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/30 p-3">
              <Flame className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <div className="text-xs">
                <p className="text-muted-foreground">Nấu chín</p>
                <p className="font-bold text-foreground">{suggestion.cookTimeMinutes} phút</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/30 p-3">
              <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="text-xs">
                <p className="text-muted-foreground">Độ khó</p>
                <p className="font-bold text-foreground">{difficultyLabel}</p>
              </div>
            </div>
          </div>

          {/* Ingredients section */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                1
              </span>
              Định lượng nguyên liệu gợi ý ({suggestion.ingredients.length})
            </h4>
            <div className="rounded-2xl border border-border/80 divide-y divide-border/60 overflow-hidden bg-card">
              {suggestion.ingredients.map((ing, idx) => (
                <div
                  key={`${ing.name}-${idx}`}
                  className="flex items-center justify-between p-3 text-xs sm:text-sm hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{ing.name}</span>
                    {ing.optional && (
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-1.5 text-muted-foreground"
                      >
                        Tùy chọn
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">
                      {ing.amount} {ing.unit}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({Math.round(ing.confidence * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Steps section */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                2
              </span>
              Các bước thực hiện tuần tự ({suggestion.steps.length})
            </h4>
            <div className="space-y-2.5">
              {suggestion.steps.map((st) => (
                <div
                  key={st.stepNumber}
                  className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-3.5 text-xs sm:text-sm"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold mt-0.5">
                    {st.stepNumber}
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="text-foreground leading-relaxed">{st.instruction}</p>
                    {st.durationMinutes && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> Khoảng {st.durationMinutes} phút
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assumptions & Notes */}
          {suggestion.assumptions.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-muted-foreground space-y-1.5">
              <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Lưu ý &amp; Giả định từ Trợ lý AI:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-foreground/80">
                {suggestion.assumptions.map((assump, idx) => (
                  <li key={idx}>{assump}</li>
                ))}
              </ul>
              <p className="text-[11px] text-muted-foreground pt-1 border-t border-amber-500/20">
                * Đây là định lượng gợi ý ban đầu. Sau khi áp dụng vào biểu mẫu, bạn có thể chỉnh
                sửa lại bất kỳ thông tin nào để vừa vặn nhất với khẩu vị.
              </p>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="p-4 sm:p-5 border-t border-border/60 bg-muted/20 shrink-0 flex flex-col sm:flex-row gap-2.5">
          <Button
            type="button"
            variant="outline"
            className="rounded-full flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            Đóng
          </Button>
          <Button
            type="button"
            className="rounded-full flex-1 gap-1.5 shadow-sm"
            onClick={onApply}
            disabled={isApplying}
          >
            <Check className="h-4 w-4" /> Áp dụng vào công thức
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
