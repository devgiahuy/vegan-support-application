'use client';

import React from 'react';
import { Edit3, Trash2, RotateCcw, Sparkles, Info, Layers, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RecognitionCandidate } from '../types/ingredient-recognition.model';

interface CandidateCardProps {
  candidate: RecognitionCandidate;
  onEdit: (candidate: RecognitionCandidate) => void;
  onReject: (candidate: RecognitionCandidate) => void;
  onRestore?: (candidate: RecognitionCandidate) => void;
  onViewEvidence?: (candidate: RecognitionCandidate) => void;
  disabled?: boolean;
}

export function CandidateCard({
  candidate,
  onEdit,
  onReject,
  onRestore,
  onViewEvidence,
  disabled = false,
}: CandidateCardProps) {
  const {
    name,
    quantity,
    ingredientSuggestion,
    freshnessObservation,
    confidencePercent,
    confidenceTier,
    uncertaintyNote,
    isRejected,
    isEdited,
    evidence,
  } = candidate;

  // Cấu hình màu cho thanh độ tin cậy
  const tierConfig = {
    high: {
      badgeClass:
        'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      barColor: 'bg-emerald-500',
      label: 'Độ tin cậy cao',
    },
    medium: {
      badgeClass:
        'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      barColor: 'bg-amber-500',
      label: 'Độ tin cậy vừa',
    },
    low: {
      badgeClass:
        'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700',
      barColor: 'bg-neutral-400',
      label: 'Độ tin cậy thấp',
    },
  }[confidenceTier];

  return (
    <div
      className={`relative rounded-2xl border transition-all p-4 sm:p-5 flex flex-col justify-between gap-4 ${
        isRejected
          ? 'bg-neutral-50/60 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60'
          : 'bg-card border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800/60'
      }`}
    >
      <div className="space-y-3">
        {/* Hàng tiêu đề & Badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`font-semibold text-base sm:text-lg truncate ${
                  isRejected
                    ? 'line-through text-muted-foreground'
                    : 'text-neutral-900 dark:text-neutral-100'
                }`}
              >
                {name}
              </h4>
              {isEdited && !isRejected && (
                <Badge
                  variant="outline"
                  className="text-[11px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                >
                  Đã chỉnh sửa
                </Badge>
              )}
            </div>

            {/* Gợi ý nguyên liệu chuẩn nếu có */}
            {ingredientSuggestion && !isRejected && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Khớp chuẩn: {ingredientSuggestion.name}</span>
              </div>
            )}
          </div>

          {/* Badge độ tin cậy */}
          <div
            className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 border ${tierConfig.badgeClass}`}
            title={tierConfig.label}
          >
            {confidencePercent}%
          </div>
        </div>

        {/* Thông tin số lượng */}
        <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <span className="font-medium">Số lượng ước tính:</span>
          <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold">
            {quantity.formatted}
          </span>
        </div>

        {/* Quan sát độ tươi sơ bộ */}
        {freshnessObservation && (
          <div className="text-xs text-muted-foreground bg-neutral-50 dark:bg-neutral-900 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              Quan sát thị giác:
            </span>{' '}
            {freshnessObservation}
          </div>
        )}

        {/* Bằng chứng / Ảnh phát hiện */}
        {evidence.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <button
              type="button"
              onClick={() => onViewEvidence?.(candidate)}
              className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Phát hiện từ {evidence.length} góc ảnh</span>
            </button>
            {uncertaintyNote && (
              <span
                className="text-[11px] text-muted-foreground/80 flex items-center gap-1"
                title={uncertaintyNote}
              >
                <Info className="h-3 w-3" />
                <span>Đã gộp trùng lặp</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Nút hành động */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
        {isRejected ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRestore?.(candidate)}
            disabled={disabled}
            className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Khôi phục</span>
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onReject(candidate)}
              disabled={disabled}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Bỏ qua</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(candidate)}
              disabled={disabled}
              className="flex items-center gap-1.5 text-xs hover:border-emerald-500 hover:text-emerald-600"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Chỉnh sửa</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
