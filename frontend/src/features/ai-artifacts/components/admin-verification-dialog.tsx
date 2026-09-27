'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { AiVerificationAdminActionType, AiVerificationConclusion } from '@/common/enums';
import { useAdminAiVerificationActionMutation } from '../queries/ai-verification.queries';
import {
  adminAiVerificationActionSchema,
  type AdminAiVerificationActionFormData,
} from '../schemas/ai-verification.schema';
import type { AiVerification } from '../types/ai-verification.model';

export function AdminVerificationDialog({
  open,
  onOpenChange,
  verification,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verification: AiVerification;
}) {
  const adminMutation = useAdminAiVerificationActionMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdminAiVerificationActionFormData>({
    resolver: zodResolver(adminAiVerificationActionSchema),
    defaultValues: {
      action: AiVerificationAdminActionType.OVERRIDE,
      expectedVersion: verification.version,
      reason: '',
      conclusion: verification.conclusion,
      scope: verification.scope,
      evidenceNote: verification.evidenceNote,
      correction: verification.correction || '',
    },
  });

  const selectedAction = watch('action');
  const selectedConclusion = watch('conclusion');

  React.useEffect(() => {
    if (open) {
      reset({
        action: AiVerificationAdminActionType.OVERRIDE,
        expectedVersion: verification.version,
        reason: '',
        conclusion: verification.conclusion,
        scope: verification.scope,
        evidenceNote: verification.evidenceNote,
        correction: verification.correction || '',
      });
    }
  }, [open, verification, reset]);

  const onSubmit = async (values: AdminAiVerificationActionFormData) => {
    try {
      await adminMutation.mutateAsync({
        verificationId: verification.id,
        data: values,
      });
      onOpenChange(false);
    } catch {
      // Toast error handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Shield className="size-4" />
            </div>
            <DialogTitle>Can thiệp Quản trị Kiểm chứng</DialogTitle>
          </div>
          <DialogDescription>
            Quản trị viên có quyền Ghi đè (thay thế kết luận) hoặc Thu hồi bản kiểm chứng này. Toàn
            bộ hành động đều được lưu vết kiểm toán bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Loại hành động can thiệp</Label>
            <RadioGroup
              value={selectedAction}
              onValueChange={(val) =>
                setValue('action', val as AiVerificationAdminActionType, { shouldValidate: true })
              }
              className="grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2 space-y-0 rounded-md border p-2.5">
                <RadioGroupItem
                  value={AiVerificationAdminActionType.OVERRIDE}
                  id="action-override"
                />
                <Label htmlFor="action-override" className="text-xs font-normal cursor-pointer">
                  Ghi đè (Thay thế mới)
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-y-0 rounded-md border p-2.5">
                <RadioGroupItem value={AiVerificationAdminActionType.REVOKE} id="action-revoke" />
                <Label
                  htmlFor="action-revoke"
                  className="text-xs font-normal cursor-pointer text-destructive"
                >
                  Thu hồi (Hủy hiệu lực)
                </Label>
              </div>
            </RadioGroup>
            {errors.action?.message && (
              <p className="text-xs text-destructive">{errors.action.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-reason">Lý do can thiệp kiểm toán (Bắt buộc)</Label>
            <Textarea
              id="admin-reason"
              placeholder="Nêu rõ căn cứ can thiệp, lý do sai lệch hoặc vi phạm tiêu chuẩn cộng đồng..."
              rows={2}
              {...register('reason')}
            />
            {errors.reason?.message && (
              <p className="text-xs text-destructive">{errors.reason.message}</p>
            )}
          </div>

          {selectedAction === AiVerificationAdminActionType.OVERRIDE && (
            <div className="space-y-3 rounded-md border p-3 bg-muted/20">
              <div className="space-y-1.5">
                <Label className="text-xs">Kết luận mới</Label>
                <RadioGroup
                  value={selectedConclusion}
                  onValueChange={(val) =>
                    setValue('conclusion', val as AiVerificationConclusion, {
                      shouldValidate: true,
                    })
                  }
                  className="grid grid-cols-3 gap-2"
                >
                  <div className="flex items-center space-x-2 space-y-0 rounded-md border bg-background p-2">
                    <RadioGroupItem
                      value={AiVerificationConclusion.VERIFIED}
                      id="admin-conclusion-verified"
                    />
                    <Label
                      htmlFor="admin-conclusion-verified"
                      className="text-[11px] font-normal cursor-pointer"
                    >
                      Chính xác
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 space-y-0 rounded-md border bg-background p-2">
                    <RadioGroupItem
                      value={AiVerificationConclusion.CORRECTION_NEEDED}
                      id="admin-conclusion-correction"
                    />
                    <Label
                      htmlFor="admin-conclusion-correction"
                      className="text-[11px] font-normal cursor-pointer"
                    >
                      Cần chỉnh lý
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 space-y-0 rounded-md border bg-background p-2">
                    <RadioGroupItem
                      value={AiVerificationConclusion.REJECTED}
                      id="admin-conclusion-rejected"
                    />
                    <Label
                      htmlFor="admin-conclusion-rejected"
                      className="text-[11px] font-normal cursor-pointer"
                    >
                      Không chuẩn
                    </Label>
                  </div>
                </RadioGroup>
                {errors.conclusion?.message && (
                  <p className="text-xs text-destructive">{errors.conclusion.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-scope" className="text-xs">
                  Phạm vi thẩm định mới
                </Label>
                <Input
                  id="admin-scope"
                  className="h-8 text-xs bg-background"
                  {...register('scope')}
                />
                {errors.scope?.message && (
                  <p className="text-xs text-destructive">{errors.scope.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-evidence" className="text-xs">
                  Ghi chú bằng chứng mới
                </Label>
                <Textarea
                  id="admin-evidence"
                  className="text-xs bg-background"
                  rows={2}
                  {...register('evidenceNote')}
                />
                {errors.evidenceNote?.message && (
                  <p className="text-xs text-destructive">{errors.evidenceNote.message}</p>
                )}
              </div>

              {selectedConclusion === AiVerificationConclusion.CORRECTION_NEEDED && (
                <div className="space-y-1.5">
                  <Label htmlFor="admin-correction" className="text-xs">
                    Nội dung chỉnh lý mới
                  </Label>
                  <Textarea
                    id="admin-correction"
                    className="text-xs bg-background"
                    rows={2}
                    {...register('correction')}
                  />
                  {errors.correction?.message && (
                    <p className="text-xs text-destructive">{errors.correction.message}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={adminMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant={
                selectedAction === AiVerificationAdminActionType.REVOKE ? 'destructive' : 'default'
              }
              disabled={adminMutation.isPending}
            >
              {adminMutation.isPending
                ? 'Đang xử lý...'
                : selectedAction === AiVerificationAdminActionType.REVOKE
                  ? 'Xác nhận thu hồi'
                  : 'Xác nhận ghi đè'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
