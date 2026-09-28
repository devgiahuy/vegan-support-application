'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRevokeContributorAdminMutation } from '../queries/contributor.queries';
import {
  revokeContributorSchema,
  type RevokeContributorFormValues,
} from '../schemas/contributor.schema';

export interface RevokeContributorDialogProps {
  user: { id: string; displayName: string; email?: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Hộp thoại Admin thu hồi tư cách Contributor của người dùng (Phase 14).
 * Bắt buộc nhập lý do phục vụ kiểm toán và cảnh báo hạ cấp tài khoản về MEMBER.
 */
export function RevokeContributorDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: RevokeContributorDialogProps) {
  const revokeMutation = useRevokeContributorAdminMutation();

  const form = useForm<RevokeContributorFormValues>({
    resolver: zodResolver(revokeContributorSchema),
    defaultValues: {
      reason: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({ reason: '' });
    }
  }, [open, form]);

  const onSubmit = async (values: RevokeContributorFormValues) => {
    if (!user) return;
    try {
      await revokeMutation.mutateAsync({
        userId: user.id,
        reason: values.reason,
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Đã toast lỗi ở query layer
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <UserX className="size-5" />
            <span>Thu hồi quyền Contributor</span>
          </DialogTitle>
          <DialogDescription>
            {user ? `${user.displayName} (${user.email || user.id})` : 'Xác nhận thu hồi quyền'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p className="leading-relaxed">
            <strong>Cảnh báo:</strong> Thao tác này sẽ hạ cấp tài khoản về{' '}
            <strong>Thành viên (MEMBER)</strong>. Quyền đóng góp và xác thực nội dung của người dùng
            sẽ bị chấm dứt ngay lập tức.
          </p>
        </div>

        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="flex flex-col gap-4 mt-2"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="revoke-reason">
              Lý do thu hồi quyền (Audit Reason) <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="revoke-reason"
              rows={3}
              placeholder="Nêu rõ lý do vi phạm hoặc căn cứ thu hồi quyền (tối thiểu 10 ký tự)..."
              {...form.register('reason')}
            />
            {form.formState.errors.reason && (
              <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={revokeMutation.isPending || !user}
            >
              {revokeMutation.isPending ? 'Đang thu hồi...' : 'Xác nhận thu hồi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
