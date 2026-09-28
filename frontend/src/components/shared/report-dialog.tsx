'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { ReportReasonCode, ReportTargetKind } from '@/common/enums';
import { useSubmitReportMutation } from '@/features/safety/queries/safety.queries';
import { reportSchema, type ReportFormValues } from '@/features/safety/schemas/safety.schema';

const REASON_OPTIONS: Array<{ value: ReportReasonCode; label: string }> = [
  { value: ReportReasonCode.SPAM, label: 'Spam' },
  { value: ReportReasonCode.HARMFUL_HEALTH, label: 'Gây hại sức khỏe' },
  { value: ReportReasonCode.HARASSMENT, label: 'Quấy rối' },
  { value: ReportReasonCode.MISINFORMATION, label: 'Thông tin sai lệch' },
  { value: ReportReasonCode.COPYRIGHT, label: 'Vi phạm bản quyền' },
  { value: ReportReasonCode.OTHER, label: 'Lý do khác' },
];

/**
 * Dialog gửi báo cáo: Select 6 mã + chi tiết tùy chọn.
 * Giữ draft khi lỗi (chỉ reset khi thành công).
 */
export function ReportDialog({
  targetKind,
  targetId,
  open,
  onOpenChange,
}: {
  targetKind: ReportTargetKind;
  targetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const submitMutation = useSubmitReportMutation();
  const [reasonCode, setReasonCode] = React.useState<ReportReasonCode>(ReportReasonCode.SPAM);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reasonCode: ReportReasonCode.SPAM, details: '', targetId },
  });

  const onSubmit = async (values: ReportFormValues) => {
    try {
      await submitMutation.mutateAsync({
        targetKind,
        targetId: values.targetId,
        reasonCode: values.reasonCode,
        details: values.details,
      });
      form.reset();
      setReasonCode(ReportReasonCode.SPAM);
      onOpenChange(false);
    } catch {
      // Lỗi đã toast ở query layer; draft giữ nguyên.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Báo cáo vi phạm</DialogTitle>
          <DialogDescription>
            Báo cáo của bạn giúp đội kiểm duyệt giữ cộng đồng sạch. Vui lòng chọn đúng lý do.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-reason">Lý do</Label>
            <Select
              value={reasonCode}
              onValueChange={(value) => {
                const next = value as ReportReasonCode;
                setReasonCode(next);
                form.setValue('reasonCode', next, { shouldValidate: true });
              }}
            >
              <SelectTrigger id="report-reason">
                <SelectValue placeholder="Chọn lý do" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {REASON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {form.formState.errors.reasonCode && (
              <p className="text-xs text-destructive">{form.formState.errors.reasonCode.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-details">
              Chi tiết thêm{' '}
              <span className="font-normal text-muted-foreground">
                (tùy chọn, tối thiểu 10 ký tự nếu nhập)
              </span>
            </Label>
            <Textarea
              id="report-details"
              rows={3}
              maxLength={2000}
              placeholder="Mô tả vi phạm bạn thấy (tối thiểu 10 ký tự nếu nhập)..."
              {...form.register('details')}
            />
            {form.formState.errors.details && (
              <p className="text-xs text-destructive">{form.formState.errors.details.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
