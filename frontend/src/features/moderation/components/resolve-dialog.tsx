'use client';

import { useForm } from 'react-hook-form';
import * as React from 'react';
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
import { ModerationDecision } from '@/common/enums';
import type { ModerationReport } from '../types/moderation.model';
import { useResolveReportMutation } from '../queries/moderation.queries';
import { resolveReportSchema, type ResolveReportFormValues } from '../schemas/moderation.schema';

const DECISION_OPTIONS: Array<{ value: ModerationDecision; label: string }> = [
  { value: ModerationDecision.NO_VIOLATION, label: 'Không vi phạm' },
  { value: ModerationDecision.WARN, label: 'Cảnh cáo' },
  { value: ModerationDecision.HIDE, label: 'Ẩn nội dung' },
  { value: ModerationDecision.RESTORE, label: 'Khôi phục' },
  { value: ModerationDecision.DEMOTE, label: 'Hạ quyền tác giả' },
  { value: ModerationDecision.BAN, label: 'Cấm tài khoản' },
];

/**
 * Dialog resolve toàn bộ báo cáo đang mở của 1 mục tiêu.
 * Quyết định Select enum + lý do bắt buộc (phục vụ kiểm toán).
 */
export function ResolveDialog({
  report,
  open,
  onOpenChange,
}: {
  report: ModerationReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const resolveMutation = useResolveReportMutation();
  const form = useForm<ResolveReportFormValues>({
    resolver: zodResolver(resolveReportSchema),
    defaultValues: { decision: ModerationDecision.NO_VIOLATION, reason: '' },
  });
  // State cục bộ cho Select (tránh form.watch khiến React Compiler bỏ memo).
  const [decision, setDecision] = React.useState<ModerationDecision>(
    ModerationDecision.NO_VIOLATION
  );

  const onSubmit = async (values: ResolveReportFormValues) => {
    if (!report) return;
    try {
      await resolveMutation.mutateAsync({
        id: report.id,
        decision: values.decision,
        reason: values.reason,
      });
      form.reset();
      setDecision(ModerationDecision.NO_VIOLATION);
      onOpenChange(false);
    } catch {
      // Lỗi đã toast ở query layer (xung đột kèm invalidate).
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xử lý báo cáo</DialogTitle>
          <DialogDescription>
            {report
              ? `Mục tiêu: ${report.targetTitle} (${report.openCount} báo cáo đang mở). Quyết định áp dụng cho toàn bộ.`
              : 'Chọn quyết định cho toàn bộ báo cáo đang mở của mục tiêu.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resolve-decision">Quyết định</Label>
            <Select
              value={decision}
              onValueChange={(value) => {
                const next = value as ModerationDecision;
                setDecision(next);
                form.setValue('decision', next, { shouldValidate: true });
              }}
            >
              <SelectTrigger id="resolve-decision">
                <SelectValue placeholder="Chọn quyết định" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {DECISION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {form.formState.errors.decision && (
              <p className="text-xs text-destructive">{form.formState.errors.decision.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resolve-reason">Lý do (bắt buộc, lưu kiểm toán)</Label>
            <Textarea
              id="resolve-reason"
              rows={3}
              placeholder="Ghi rõ căn cứ quyết định..."
              {...form.register('reason')}
            />
            {form.formState.errors.reason && (
              <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={resolveMutation.isPending || !report}>
              {resolveMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
