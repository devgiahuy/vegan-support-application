'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserCheck } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useInviteContributorAdminMutation } from '../queries/contributor.queries';
import {
  inviteContributorSchema,
  type InviteContributorFormValues,
} from '../schemas/contributor.schema';

export interface InviteContributorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultUserId?: string;
  defaultUserName?: string;
  onSuccess?: () => void;
}

/**
 * Hộp thoại Admin trực tiếp mời một Member trở thành Contributor (`ADMIN_INVITED`).
 */
export function InviteContributorDialog({
  open,
  onOpenChange,
  defaultUserId = '',
  defaultUserName = '',
  onSuccess,
}: InviteContributorDialogProps) {
  const inviteMutation = useInviteContributorAdminMutation();

  const form = useForm<InviteContributorFormValues>({
    resolver: zodResolver(inviteContributorSchema),
    defaultValues: {
      userId: defaultUserId,
      reason: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        userId: defaultUserId,
        reason: '',
      });
    }
  }, [open, defaultUserId, form]);

  const onSubmit = async (values: InviteContributorFormValues) => {
    try {
      await inviteMutation.mutateAsync({
        userId: values.userId,
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
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="size-5 text-primary" />
            <span>Mời thành viên làm Contributor</span>
          </DialogTitle>
          <DialogDescription>
            {defaultUserName
              ? `Gửi lời mời trực tiếp cho thành viên: ${defaultUserName}`
              : 'Nâng quyền Contributor trực tiếp cho thành viên tiêu biểu với căn cứ ADMIN_INVITED.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-user-id">
              Mã định danh thành viên (User ID) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="invite-user-id"
              placeholder="Nhập UUID của thành viên..."
              disabled={Boolean(defaultUserId)}
              {...form.register('userId')}
            />
            {form.formState.errors.userId && (
              <p className="text-xs text-destructive">{form.formState.errors.userId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-reason">
              Lý do mời trực tiếp (Audit Reason) <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="invite-reason"
              rows={3}
              placeholder="Nêu rõ căn cứ đề cử hoặc thành tích đóng góp tiêu biểu của thành viên (tối thiểu 10 ký tự)..."
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
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Đang gửi lời mời...' : 'Gửi lời mời Contributor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
