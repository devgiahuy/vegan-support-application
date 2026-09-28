'use client';

import React from 'react';
import { Trash2, RotateCcw, AlertCircle, Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ReceiptCandidatePricing } from '../types/receipt.model';

export interface EditableReceiptCandidateItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  isRejected: boolean;
  version: number;
  ingredientId: string | null;
  ingredientName?: string;
  confidencePercent: number;
  confidenceTier: 'high' | 'medium' | 'low';
  uncertaintyNote: string | null;
  lineText: string;
  pricing: ReceiptCandidatePricing;
  initialName: string;
  initialQuantity: string;
  initialUnit: string;
  initialIsRejected: boolean;
}

export const COMMON_UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'quả',
  'trái',
  'củ',
  'bó',
  'gói',
  'hộp',
  'chai',
  'lon',
  'bịch',
  'túi',
  'miếng',
  'khay',
  'phần',
];

interface ReceiptCandidateRowProps {
  item: EditableReceiptCandidateItem;
  onUpdate: (updates: Partial<EditableReceiptCandidateItem>) => void;
  onOpenAdvancedEdit: () => void;
  disabled?: boolean;
}

export function ReceiptCandidateRow({
  item,
  onUpdate,
  onOpenAdvancedEdit,
  disabled = false,
}: ReceiptCandidateRowProps) {
  const {
    id,
    name,
    quantity,
    unit,
    isRejected,
    lineText,
    ingredientName,
    pricing,
    confidencePercent,
    uncertaintyNote,
    initialName,
    initialQuantity,
    initialUnit,
  } = item;

  const isEdited =
    name.trim() !== initialName.trim() ||
    quantity.trim() !== initialQuantity.trim() ||
    unit.trim() !== initialUnit.trim();

  return (
    <div
      className={`group relative rounded-2xl border p-4 transition-all duration-200 ${
        isRejected
          ? 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/30 opacity-60'
          : 'border-neutral-200 dark:border-neutral-800 bg-card hover:border-emerald-500/40 hover:shadow-xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Cột thông tin tên & nhận diện */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              disabled={isRejected || disabled}
              placeholder="Tên mặt hàng..."
              className={`h-9 font-semibold text-sm sm:text-base border-transparent hover:border-input focus:border-ring bg-transparent px-2 -ml-2 rounded-lg transition-colors ${
                isRejected ? 'line-through text-muted-foreground' : 'text-foreground'
              }`}
            />
            {isRejected && (
              <Badge
                variant="destructive"
                className="text-[11px] bg-destructive/10 text-destructive border-destructive/20 shrink-0"
              >
                Đã loại bỏ
              </Badge>
            )}
            {isEdited && !isRejected && (
              <Badge
                variant="outline"
                className="text-[11px] text-blue-600 dark:text-blue-400 border-blue-200 shrink-0"
              >
                Đã sửa
              </Badge>
            )}
          </div>

          {/* Dòng chữ thô trên hóa đơn */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono pl-0.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/70 text-muted-foreground uppercase font-bold">
              OCR
            </span>
            <span className="truncate">{lineText || '(Không có dòng chữ gốc)'}</span>
          </div>

          {/* Metadata: Gợi ý nguyên liệu chuẩn & Giá & Độ tin cậy */}
          <div className="flex flex-wrap items-center gap-2 text-xs pl-0.5 pt-0.5">
            {ingredientName && !isRejected && (
              <Badge
                variant="secondary"
                className="text-[11px] font-normal bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
              >
                <Check className="h-3 w-3 mr-1 text-emerald-600" />
                Khớp: {ingredientName}
              </Badge>
            )}

            {pricing.formattedLineTotal !== 'Chưa có giá' && (
              <span className="inline-flex items-center text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/50">
                {pricing.formattedLineTotal}
                {pricing.unitPrice && (
                  <span className="text-[11px] text-muted-foreground ml-1 font-normal">
                    ({pricing.formattedUnitPrice}/{unit || 'đv'})
                  </span>
                )}
              </span>
            )}

            <span className="text-[11px] text-muted-foreground">
              Độ tin cậy: {confidencePercent}%
            </span>

            {uncertaintyNote && !isRejected && (
              <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{uncertaintyNote}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cột nhập Trọng lượng, Đơn vị và Nút thao tác */}
        <div className="flex items-end gap-2.5 shrink-0 pt-2 sm:pt-0">
          {/* Ô nhập trọng lượng */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground block text-left">
              Trọng lượng
            </Label>
            <Input
              type="number"
              step="any"
              min="0"
              value={quantity}
              onChange={(e) => onUpdate({ quantity: e.target.value })}
              disabled={isRejected || disabled}
              placeholder="VD: 500"
              className="h-9 w-20 sm:w-24 text-center font-medium text-sm"
            />
          </div>

          {/* Ô nhập đơn vị */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground block text-left">
              Đơn vị
            </Label>
            <div className="relative w-24 sm:w-28">
              <Input
                value={unit}
                onChange={(e) => onUpdate({ unit: e.target.value })}
                disabled={isRejected || disabled}
                placeholder="g, kg..."
                list={`receipt-units-${id}`}
                className="h-9 text-sm px-2.5"
              />
              <datalist id={`receipt-units-${id}`}>
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center gap-1">
            {/* Nút sửa nâng cao */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onOpenAdvancedEdit}
              disabled={disabled}
              className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
              title="Chỉnh sửa nâng cao (liên kết từ điển nguyên liệu)"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {/* Nút loại bỏ / khôi phục */}
            {isRejected ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onUpdate({ isRejected: false })}
                disabled={disabled}
                className="h-9 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                title="Khôi phục mặt hàng này"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Khôi phục
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onUpdate({ isRejected: true })}
                disabled={disabled}
                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                title="Loại bỏ mặt hàng phi thực phẩm"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
