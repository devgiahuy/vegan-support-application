'use client';

import React from 'react';
import { Edit2, Trash2, RotateCcw, Sparkles, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ReceiptCandidate } from '../types/receipt.model';

interface ReceiptCandidateRowProps {
  candidate: ReceiptCandidate;
  onEdit: (candidate: ReceiptCandidate) => void;
  onToggleReject: (candidate: ReceiptCandidate) => void;
  disabled?: boolean;
}

export function ReceiptCandidateRow({
  candidate,
  onEdit,
  onToggleReject,
  disabled = false,
}: ReceiptCandidateRowProps) {
  const {
    name,
    lineText,
    ingredientSuggestion,
    quantity,
    pricing,
    confidencePercent,
    confidenceTier,
    uncertaintyNote,
    isRejected,
    isEdited,
    statusLabel,
  } = candidate;

  return (
    <div
      className={`group relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
        isRejected
          ? 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/30 opacity-60'
          : 'border-neutral-200 dark:border-neutral-800 bg-card hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Thông tin tên & dòng chữ gốc */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={`text-base font-semibold truncate ${
                isRejected
                  ? 'line-through text-muted-foreground'
                  : 'text-neutral-900 dark:text-neutral-100'
              }`}
            >
              {name || 'Mặt hàng chưa đặt tên'}
            </h4>

            {isEdited && !isRejected && (
              <Badge
                variant="outline"
                className="text-[11px] text-blue-600 dark:text-blue-400 border-blue-200"
              >
                Đã chỉnh sửa
              </Badge>
            )}

            {isRejected && (
              <Badge
                variant="destructive"
                className="text-[11px] bg-destructive/10 text-destructive border-destructive/20"
              >
                Đã loại bỏ
              </Badge>
            )}

            {/* Huy hiệu nguyên liệu chuẩn */}
            {ingredientSuggestion && !isRejected && (
              <Badge
                variant="secondary"
                className="text-[11px] font-normal bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
              >
                <Check className="h-3 w-3 mr-1 text-emerald-600" />
                Khớp: {ingredientSuggestion.name}
              </Badge>
            )}
          </div>

          {/* Dòng chữ thô trên hóa đơn */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground uppercase">
              OCR
            </span>
            <span className="truncate">{lineText || '(Không có dòng chữ gốc)'}</span>
          </div>

          {/* Ghi chú không chắc chắn */}
          {uncertaintyNote && !isRejected && (
            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{uncertaintyNote}</span>
            </div>
          )}
        </div>

        {/* Số lượng & Giá cả */}
        <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
          <div className="text-right">
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {quantity.formatted || '—'}
            </div>
            <div className="text-xs text-muted-foreground">
              {pricing.formattedLineTotal !== 'Chưa có giá' ? (
                <>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {pricing.formattedLineTotal}
                  </span>
                  {pricing.unitPrice && (
                    <span className="text-[11px] text-muted-foreground ml-1">
                      ({pricing.formattedUnitPrice}/{quantity.unit || 'đv'})
                    </span>
                  )}
                </>
              ) : (
                'Chưa có giá'
              )}
            </div>
          </div>

          {/* Độ tin cậy OCR */}
          <div className="hidden md:flex flex-col items-end gap-1 w-20">
            <span className="text-[11px] text-muted-foreground">Độ tin cậy</span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-12 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    confidenceTier === 'high'
                      ? 'bg-emerald-500'
                      : confidenceTier === 'medium'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                  }`}
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>
              <span className="text-xs font-mono font-medium">{confidencePercent}%</span>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center gap-1">
            {!isRejected && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                onClick={() => onEdit(candidate)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                title="Chỉnh sửa dòng hàng"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => onToggleReject(candidate)}
              className={`h-8 w-8 rounded-lg ${
                isRejected
                  ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                  : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
              }`}
              title={isRejected ? 'Khôi phục dòng hàng' : 'Loại bỏ mặt hàng phi thực phẩm'}
            >
              {isRejected ? (
                <RotateCcw className="h-3.5 w-3.5" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
