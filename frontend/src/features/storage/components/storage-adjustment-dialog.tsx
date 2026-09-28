'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Minus, HardDrive } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { StorageAccount } from '../types/storage.model';
import { useCreateStorageAdjustmentMutation } from '../queries/storage.queries';
import { formatBytes, formatDeltaBytes } from '../utils/format-bytes';

interface StorageAdjustmentDialogProps {
  account: StorageAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MB_BYTES = 1024 * 1024;
const GB_BYTES = 1024 * 1024 * 1024;

export function StorageAdjustmentDialog({
  account,
  open,
  onOpenChange,
}: StorageAdjustmentDialogProps) {
  const [operation, setOperation] = React.useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [amount, setAmount] = React.useState<string>('500');
  const [unit, setUnit] = React.useState<'MB' | 'GB'>('MB');
  const [reason, setReason] = React.useState('');
  const [errorText, setErrorText] = React.useState<string | null>(null);

  const mutation = useCreateStorageAdjustmentMutation();

  // Reset state on open
  React.useEffect(() => {
    if (open) {
      setOperation('INCREASE');
      setAmount('500');
      setUnit('MB');
      setReason('');
      setErrorText(null);
    }
  }, [open]);

  if (!account) return null;

  const numericAmount = parseFloat(amount);
  const isValidAmount = !isNaN(numericAmount) && numericAmount > 0;
  const unitMultiplier = unit === 'GB' ? GB_BYTES : MB_BYTES;
  const rawBytes = isValidAmount ? Math.round(numericAmount * unitMultiplier) : 0;
  const deltaBytes = operation === 'INCREASE' ? rawBytes : -rawBytes;

  const currentQuota = account.limitBytes;
  const projectedQuota = Math.max(0, currentQuota + deltaBytes);

  const trimmedReason = reason.trim();
  const isReasonValid = trimmedReason.length >= 10 && trimmedReason.length <= 1000;
  const canSubmit = isValidAmount && deltaBytes !== 0 && isReasonValid && !mutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (trimmedReason.length < 10) {
      setErrorText('Lý do giải trình phải có ít nhất 10 ký tự.');
      return;
    }

    try {
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `adj-${Date.now()}`;
      await mutation.mutateAsync({
        userId: account.userId,
        payload: {
          deltaBytes,
          reason: trimmedReason,
          idempotencyKey,
        },
      });

      toast.success(
        `Đã ${deltaBytes > 0 ? 'tăng' : 'giảm'} ${formatBytes(Math.abs(deltaBytes))} cho tài khoản ${account.userEmail || account.userDisplayName || account.userId}`
      );
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Không thể điều chỉnh dung lượng. Vui lòng thử lại.';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            Điều chỉnh hạn mức lưu trữ
          </DialogTitle>
          <DialogDescription>
            Tăng hoặc giảm hạn mức lưu trữ người dùng kèm lý do kiểm toán bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Thông tin tài khoản */}
          <div className="rounded-xl border bg-muted/40 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Người dùng:</span>
              <span className="font-semibold text-foreground">
                {account.userDisplayName || account.userEmail || account.userId}
              </span>
            </div>
            {account.userEmail && account.userDisplayName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="text-foreground">{account.userEmail}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Đã sử dụng:</span>
              <span>
                {account.usedFormatted || formatBytes(account.usedBytes)} ({account.percentUsed}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hạn ngạch hiện tại:</span>
              <span className="font-medium">
                {account.limitFormatted || formatBytes(account.limitBytes)}
              </span>
            </div>
          </div>

          {/* Loại điều chỉnh: Tăng hoặc Giảm */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Hình thức điều chỉnh</Label>
            <RadioGroup
              value={operation}
              onValueChange={(val) => setOperation(val as 'INCREASE' | 'DECREASE')}
              className="grid grid-cols-2 gap-2"
            >
              <Label
                htmlFor="op-increase"
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-colors ${
                  operation === 'INCREASE'
                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <RadioGroupItem value="INCREASE" id="op-increase" className="sr-only" />
                <Plus className="h-4 w-4" />
                Cộng thêm (+)
              </Label>
              <Label
                htmlFor="op-decrease"
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-colors ${
                  operation === 'DECREASE'
                    ? 'border-rose-600 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <RadioGroupItem value="DECREASE" id="op-decrease" className="sr-only" />
                <Minus className="h-4 w-4" />
                Giảm bớt (-)
              </Label>
            </RadioGroup>
          </div>

          {/* Số lượng và đơn vị */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="adj-amount" className="text-xs font-semibold">
                Dung lượng thay đổi
              </Label>
              <Input
                id="adj-amount"
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Đơn vị</Label>
              <div className="flex h-9 rounded-xl border p-0.5 bg-muted/40">
                <button
                  type="button"
                  onClick={() => setUnit('MB')}
                  className={`flex-1 rounded-lg text-xs font-medium transition-colors ${
                    unit === 'MB'
                      ? 'bg-background shadow-xs font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  MB
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('GB')}
                  className={`flex-1 rounded-lg text-xs font-medium transition-colors ${
                    unit === 'GB'
                      ? 'bg-background shadow-xs font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  GB
                </button>
              </div>
            </div>
          </div>

          {/* Xem trước kết quả */}
          {isValidAmount && (
            <div className="rounded-xl border border-dashed p-2.5 text-xs space-y-1 bg-background/50">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mức điều chỉnh:</span>
                <span
                  className={`font-semibold ${deltaBytes > 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {formatDeltaBytes(deltaBytes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hạn ngạch sau điều chỉnh:</span>
                <span className="font-semibold">{formatBytes(projectedQuota)}</span>
              </div>
            </div>
          )}

          {/* Lý do giải trình (Bắt buộc 10 - 1000 ký tự) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="adj-reason" className="text-xs font-semibold">
                Lý do điều chỉnh <span className="text-destructive">*</span>
              </Label>
              <span
                className={`text-[11px] ${
                  trimmedReason.length < 10
                    ? 'text-muted-foreground'
                    : trimmedReason.length > 1000
                      ? 'text-destructive font-semibold'
                      : 'text-emerald-600'
                }`}
              >
                {trimmedReason.length}/1000 (tối thiểu 10)
              </span>
            </div>
            <Textarea
              id="adj-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorText) setErrorText(null);
              }}
              placeholder="Ví dụ: Nâng cấp tài khoản Contributor theo phê duyệt số 2026-09..."
              className="resize-none text-xs"
            />
            {errorText && <p className="text-[11px] text-destructive">{errorText}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" size="sm" disabled={!canSubmit}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận điều chỉnh
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
