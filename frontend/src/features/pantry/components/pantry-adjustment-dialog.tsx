import React, { useEffect } from 'react';
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
import {
  pantryAdjustmentFormSchema,
  type PantryAdjustmentFormData,
} from '../schemas/pantry.schema';
import type { PantryItem } from '../types/pantry.model';
import { pantryMapper } from '../mappers/pantry.mapper';
import { useCreatePantryAdjustmentMutation } from '../queries/pantry.queries';

interface PantryAdjustmentDialogProps {
  item: PantryItem | null;
  initialType?: 'CONSUME' | 'RESTORE' | 'ADJUST';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PantryAdjustmentDialog({
  item,
  initialType = 'CONSUME',
  open,
  onOpenChange,
}: PantryAdjustmentDialogProps) {
  const adjustmentMutation = useCreatePantryAdjustmentMutation();

  const form = useForm<PantryAdjustmentFormData>({
    resolver: zodResolver(pantryAdjustmentFormSchema) as any,
    defaultValues: {
      type: initialType,
      quantity: 1,
      unit: item?.unit || 'g',
      expectedVersion: item?.version || 1,
      reason: '',
    },
  });

  const selectedType = form.watch('type');

  useEffect(() => {
    if (item && open) {
      if (initialType === 'ADJUST') {
        form.reset({
          type: 'ADJUST',
          deltaQuantity: 0,
          unit: item.unit,
          expectedVersion: item.version,
          reason: '',
        });
      } else {
        form.reset({
          type: initialType,
          quantity: 1,
          unit: item.unit,
          expectedVersion: item.version,
          reason: '',
        });
      }
    }
  }, [item, initialType, open, form]);

  const onSubmit = form.handleSubmit(async (data) => {
    if (!item) return;

    // Phía client chặn tiêu hao quá tồn kho
    if (data.type === 'CONSUME' && data.quantity > item.quantity) {
      form.setError('quantity', {
        type: 'manual',
        message: `Không thể tiêu hao quá tồn kho hiện có (${item.formattedQuantity})`,
      });
      return;
    }

    const idempotencyKey = `pantry-adj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const payload = pantryMapper.toAdjustmentCreateDto(data, idempotencyKey);
    await adjustmentMutation.mutateAsync({ id: item.id, payload });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Điều chỉnh số lượng: {item?.displayName}</DialogTitle>
          <DialogDescription>
            Tồn kho hiện tại:{' '}
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {item?.formattedQuantity}
            </span>
            . Mọi điều chỉnh đều được ghi vào sổ cái bất biến để đối soát.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Hình thức điều chỉnh</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  form.reset({
                    type: 'CONSUME',
                    quantity: 1,
                    unit: item?.unit || 'g',
                    expectedVersion: item?.version || 1,
                    reason: '',
                  });
                }}
                className={`flex flex-col items-center justify-center rounded-lg border-2 p-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === 'CONSUME'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-500 dark:text-emerald-500 shadow-xs'
                    : 'border-muted bg-popover text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                Tiêu hao
              </button>

              <button
                type="button"
                onClick={() => {
                  form.reset({
                    type: 'RESTORE',
                    quantity: 1,
                    unit: item?.unit || 'g',
                    expectedVersion: item?.version || 1,
                    reason: '',
                  });
                }}
                className={`flex flex-col items-center justify-center rounded-lg border-2 p-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === 'RESTORE'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-500 dark:text-emerald-300 shadow-xs'
                    : 'border-muted bg-popover text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                Hoàn trả
              </button>

              <button
                type="button"
                onClick={() => {
                  form.reset({
                    type: 'ADJUST',
                    deltaQuantity: 0,
                    unit: item?.unit || 'g',
                    expectedVersion: item?.version || 1,
                    reason: '',
                  });
                }}
                className={`flex flex-col items-center justify-center rounded-lg border-2 p-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === 'ADJUST'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-500 dark:text-emerald-300 shadow-xs'
                    : 'border-muted bg-popover text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                Bù sai lệch
              </button>
            </div>
          </div>

          {selectedType === 'ADJUST' ? (
            <div className="space-y-1.5">
              <Label htmlFor="deltaQuantity" className="text-xs">
                Số lượng sai lệch (+ tăng / - giảm) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="deltaQuantity"
                type="number"
                step="any"
                placeholder="Ví dụ: -50 hoặc 100"
                {...form.register('deltaQuantity', { valueAsNumber: true })}
              />
              {form.formState.errors && 'deltaQuantity' in form.formState.errors && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.deltaQuantity?.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-xs">
                Số lượng {selectedType === 'CONSUME' ? 'tiêu hao' : 'hoàn trả'}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                min="0.01"
                {...form.register('quantity', { valueAsNumber: true })}
              />

              {form.formState.errors && 'quantity' in form.formState.errors && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.quantity?.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs">
              Lý do ghi nhận{' '}
              {selectedType === 'ADJUST' && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="reason"
              placeholder={
                selectedType === 'CONSUME'
                  ? 'Ví dụ: Nấu canh chua tối nay...'
                  : selectedType === 'RESTORE'
                    ? 'Ví dụ: Thừa sau khi chế biến...'
                    : 'Lý do bắt buộc: Cân lại thực tế, hao hụt tự nhiên...'
              }
              rows={2}
              {...form.register('reason')}
            />
            {form.formState.errors && 'reason' in form.formState.errors && (
              <p className="text-xs text-destructive">{form.formState.errors.reason?.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={adjustmentMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={adjustmentMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {adjustmentMutation.isPending ? 'Đang ghi nhận...' : 'Xác nhận điều chỉnh'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
