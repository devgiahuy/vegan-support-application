'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, Check } from 'lucide-react';
import { useIngredientsQuery } from '@/features/ingredient/queries/ingredient.queries';
import {
  updateReceiptCandidateSchema,
  type UpdateReceiptCandidateFormValues,
} from '../schemas/receipt.schema';
import { useUpdateReceiptCandidateMutation } from '../queries/receipt.queries';
import type { ReceiptCandidate } from '../types/receipt.model';

interface ReceiptCandidateEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: ReceiptCandidate | null;
  jobId: string;
}

const COMMON_UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'quả',
  'củ',
  'gói',
  'hộp',
  'bó',
  'chai',
  'lon',
  'bịch',
  'túi',
  'miếng',
  'khay',
  'phần',
];

export function ReceiptCandidateEditDialog({
  open,
  onOpenChange,
  candidate,
  jobId,
}: ReceiptCandidateEditDialogProps) {
  const [isCanonical, setIsCanonical] = useState(true);
  const [ingredientSearch, setIngredientSearch] = useState('');

  const { data: ingredientsData } = useIngredientsQuery(
    ingredientSearch ? { q: ingredientSearch, limit: 20 } : { limit: 50 }
  );

  const updateMutation = useUpdateReceiptCandidateMutation(jobId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateReceiptCandidateFormValues>({
    resolver: zodResolver(updateReceiptCandidateSchema),
    defaultValues: {
      expectedVersion: candidate?.version ?? 1,
      detectedName: candidate?.name ?? '',
      ingredientId: candidate?.ingredientSuggestion?.id ?? null,
      quantity: candidate?.quantity.value ?? null,
      unit: candidate?.quantity.unit ?? '',
      unitPrice: candidate?.pricing.unitPrice ?? null,
      lineTotal: candidate?.pricing.lineTotal ?? null,
      uncertaintyNote: candidate?.uncertaintyNote ?? '',
      decision: 'KEEP',
    },
  });

  const selectedIngredientId = watch('ingredientId');
  const currentUnit = watch('unit');

  useEffect(() => {
    if (candidate) {
      const hasCanonical = Boolean(candidate.ingredientSuggestion?.id);
      setIsCanonical(hasCanonical);

      reset({
        expectedVersion: candidate.version,
        detectedName: candidate.name,
        ingredientId: candidate.ingredientSuggestion?.id ?? null,
        quantity: candidate.quantity.value,
        unit: candidate.quantity.unit ?? '',
        unitPrice: candidate.pricing.unitPrice,
        lineTotal: candidate.pricing.lineTotal,
        uncertaintyNote: candidate.uncertaintyNote ?? '',
        decision: 'KEEP',
      });
    }
  }, [candidate, reset]);

  const onSubmit = async (values: UpdateReceiptCandidateFormValues) => {
    if (!candidate) return;

    try {
      await updateMutation.mutateAsync({
        candidateId: candidate.id,
        input: {
          expectedVersion: values.expectedVersion,
          detectedName: values.detectedName,
          ingredientId: isCanonical ? values.ingredientId : null,
          quantity: values.quantity ?? null,
          unit: values.unit ? values.unit.trim() : null,
          unitPrice: values.unitPrice ?? null,
          lineTotal: values.lineTotal ?? null,
          uncertaintyNote: values.uncertaintyNote ? values.uncertaintyNote.trim() : null,
          decision: 'KEEP',
        },
      });

      onOpenChange(false);
    } catch {
      // Error handled by mutation onError toast
    }
  };

  const canonicalIngredients = ingredientsData?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Chỉnh sửa dòng sản phẩm</DialogTitle>
          <DialogDescription className="text-sm">
            Dòng gốc hóa đơn:{' '}
            <span className="font-mono font-medium text-foreground">
              {candidate?.lineText || '—'}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          {/* Tên mặt hàng phát hiện */}
          <div className="space-y-1.5">
            <Label htmlFor="detectedName">Tên mặt hàng</Label>
            <Input
              id="detectedName"
              {...register('detectedName')}
              placeholder="Ví dụ: Đậu hũ trắng, Nấm rơm..."
              className="rounded-xl"
            />
            {errors.detectedName && (
              <p className="text-xs text-destructive">{errors.detectedName.message}</p>
            )}
          </div>

          {/* Công tắc chọn nguyên liệu chuẩn từ từ điển */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Khớp với từ điển nguyên liệu chuẩn</Label>
                <p className="text-xs text-muted-foreground">
                  Gắn với nguyên liệu hệ thống để hỗ trợ phân tích dinh dưỡng và quản lý tủ bếp
                </p>
              </div>
              <Switch
                checked={isCanonical}
                onCheckedChange={(checked) => {
                  setIsCanonical(checked);
                  if (!checked) {
                    setValue('ingredientId', null);
                  }
                }}
              />
            </div>

            {isCanonical && (
              <div className="space-y-2 pt-1">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm tên nguyên liệu chuẩn..."
                    value={ingredientSearch}
                    onChange={(e) => setIngredientSearch(e.target.value)}
                    className="pl-9 rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-card divide-y divide-neutral-100 dark:divide-neutral-800">
                  {canonicalIngredients.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      Không tìm thấy nguyên liệu phù hợp
                    </div>
                  ) : (
                    canonicalIngredients.map((ing) => {
                      const isSelected = selectedIngredientId === ing.id;
                      return (
                        <button
                          key={ing.id}
                          type="button"
                          onClick={() => {
                            setValue('ingredientId', ing.id);
                            if (!watch('detectedName')) {
                              setValue('detectedName', ing.canonicalName);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-2.5 text-left text-xs transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 font-medium text-emerald-700 dark:text-emerald-300'
                              : ''
                          }`}
                        >
                          <span>{ing.canonicalName}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Số lượng & Đơn vị */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Số lượng</Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                {...register('quantity', {
                  setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                })}
                placeholder="Ví dụ: 300, 2..."
                className="rounded-xl"
              />
              {errors.quantity && (
                <p className="text-xs text-destructive">{errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unit">Đơn vị đo</Label>
              <div className="flex gap-2">
                <Input
                  id="unit"
                  {...register('unit')}
                  placeholder="g, kg, hộp..."
                  className="rounded-xl flex-1"
                />
                <Select
                  value={
                    COMMON_UNITS.includes(currentUnit || '') ? currentUnit || undefined : undefined
                  }
                  onValueChange={(val) => setValue('unit', val)}
                >
                  <SelectTrigger className="w-16 rounded-xl shrink-0" aria-label="Gợi ý đơn vị">
                    <SelectValue placeholder="Đơn vị" />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {COMMON_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
            </div>
          </div>

          {/* Đơn giá & Thành tiền */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="unitPrice">Đơn giá (₫)</Label>
              <Input
                id="unitPrice"
                type="number"
                step="any"
                {...register('unitPrice', {
                  setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                })}
                placeholder="Ví dụ: 15000"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lineTotal">Thành tiền (₫)</Label>
              <Input
                id="lineTotal"
                type="number"
                step="any"
                {...register('lineTotal', {
                  setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                })}
                placeholder="Ví dụ: 30000"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Ghi chú không chắc chắn */}
          <div className="space-y-1.5">
            <Label htmlFor="uncertaintyNote">Ghi chú bổ sung</Label>
            <Textarea
              id="uncertaintyNote"
              {...register('uncertaintyNote')}
              placeholder="Ghi chú về nguồn gốc, loại sản phẩm..."
              rows={2}
              className="rounded-xl resize-none text-xs"
            />
          </div>

          <DialogFooter className="pt-3 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
