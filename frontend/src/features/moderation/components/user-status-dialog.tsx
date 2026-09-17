'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TriangleAlert } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MemberStatus } from '@/common/enums';
import type { ModeratedUser } from '../types/moderation.model';
import { useUpdateUserStatusMutation } from '../queries/moderation.queries';
import { userStatusSchema, type UserStatusFormValues } from '../schemas/moderation.schema';

const STATUS_OPTIONS: Array<{ value: MemberStatus; label: string; danger?: boolean }> = [
  { value: MemberStatus.ACTIVE, label: 'Hoạt động (mở khóa/gỡ cấm)' },
  { value: MemberStatus.LOCKED, label: 'Khóa tạm thời' },
  { value: MemberStatus.BANNED, label: 'Cấm tài khoản', danger: true },
  { value: MemberStatus.DELETED, label: 'Xóa tài khoản', danger: true },
];

/**
 * Dialog đổi trạng thái tài khoản: Select đúng luật chuyển đổi + lý do bắt buộc.
 * BANNED/DELETED có cảnh báo riêng trước khi xác nhận.
 */
export function UserStatusDialog({
  account,
  open,
  onOpenChange,
}: {
  account: ModeratedUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useUpdateUserStatusMutation();
  const form = useForm<UserStatusFormValues>({
    resolver: zodResolver(userStatusSchema),
    defaultValues: { status: MemberStatus.LOCKED, reason: '' },
  });
  const [status, setStatus] = React.useState<MemberStatus>(MemberStatus.LOCKED);
  const dangerous = status === MemberStatus.BANNED || status === MemberStatus.DELETED;

  const onSubmit = async (values: UserStatusFormValues) => {
    if (!account) return;
    try {
      await updateMutation.mutateAsync({
        id: account.id,
        status: values.status,
        reason: values.reason,
      });
      form.reset();
      setStatus(MemberStatus.LOCKED);
      onOpenChange(false);
    } catch {
      // Lỗi đã toast ở query layer (xung đột kèm invalidate).
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi trạng thái tài khoản</DialogTitle>
          <DialogDescription>
            {account
              ? `${account.displayName} (${account.email}) — hiện: ${account.statusLabel}.`
              : ''}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-status">Trạng thái mới</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                const next = value as MemberStatus;
                setStatus(next);
                form.setValue('status', next, { shouldValidate: true });
              }}
            >
              <SelectTrigger id="user-status">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {form.formState.errors.status && (
              <p className="text-xs text-destructive">{form.formState.errors.status.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-status-reason">Lý do (bắt buộc, lưu kiểm toán)</Label>
            <Textarea
              id="user-status-reason"
              rows={3}
              placeholder="Ghi rõ căn cứ xử lý..."
              {...form.register('reason')}
            />
            {form.formState.errors.reason && (
              <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </div>
          {dangerous && (
            <p className="flex items-start gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              Thao tác nặng: hãy chắc chắn đã xem kỹ lịch sử vi phạm trước khi xác nhận.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant={dangerous ? 'destructive' : 'default'}
              disabled={updateMutation.isPending || !account}
            >
              {updateMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
