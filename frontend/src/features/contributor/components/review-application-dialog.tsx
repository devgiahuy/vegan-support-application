'use client';

import * as React from 'react';
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
import { ContributorType } from '@/common/enums';
import type { ContributorApplication } from '../types/contributor.model';
import { useReviewApplicationMutation } from '../queries/contributor.queries';
import { reviewApplicationSchema } from '../schemas/contributor.schema';

const DECISION_OPTIONS = [
  { value: 'APPROVE', label: 'Duyệt' },
  { value: 'REJECT', label: 'Từ chối' },
] as const;

const TYPE_OPTIONS = [
  { value: ContributorType.EXPERIENCED_PRACTITIONER, label: 'Người ăn chay kinh nghiệm' },
  { value: ContributorType.NUTRITION_EXPERT, label: 'Chuyên gia dinh dưỡng' },
] as const;

/**
 * Dialog duyệt/từ chối đơn: oneOf APPROVE (đủ 4 trường) / REJECT (note bắt buộc).
 * Validate bằng `reviewApplicationSchema.safeParse` lúc xác nhận (không RHF
 * vì discriminated union không tương thích `setValue` theo path).
 */
export function ReviewApplicationDialog({
  application,
  open,
  onOpenChange,
}: {
  application: ContributorApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const reviewMutation = useReviewApplicationMutation();
  const [decision, setDecision] = React.useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [contributorType, setContributorType] = React.useState<ContributorType>(
    ContributorType.EXPERIENCED_PRACTITIONER
  );
  const [approvalBasis, setApprovalBasis] = React.useState('');
  const [reviewNote, setReviewNote] = React.useState('');
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  const reset = React.useCallback(() => {
    setDecision('APPROVE');
    setContributorType(application?.requestedType ?? ContributorType.EXPERIENCED_PRACTITIONER);
    setApprovalBasis('');
    setReviewNote('');
    setFieldError(null);
  }, [application?.requestedType]);

  React.useEffect(() => {
    if (open && application) {
      setDecision('APPROVE');
      setContributorType(application.requestedType);
      setApprovalBasis('');
      setReviewNote('');
      setFieldError(null);
    }
  }, [open, application]);

  const handleConfirm = async () => {
    if (!application) return;
    const parsed =
      decision === 'APPROVE'
        ? reviewApplicationSchema.safeParse({
            decision,
            contributorType,
            approvalBasis,
            reviewNote,
          })
        : reviewApplicationSchema.safeParse({ decision, reviewNote });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Vui lòng kiểm tra lại các trường.');
      return;
    }
    setFieldError(null);
    try {
      await reviewMutation.mutateAsync({ id: application.id, input: parsed.data });
      reset();
      onOpenChange(false);
    } catch {
      // Lỗi đã toast ở query layer.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duyệt đơn đóng góp</DialogTitle>
          <DialogDescription>
            {application
              ? `${application.applicantName} — muốn làm ${application.requestedTypeLabel}.`
              : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="review-decision">Quyết định</Label>
            <Select
              value={decision}
              onValueChange={(value) => setDecision(value as 'APPROVE' | 'REJECT')}
            >
              <SelectTrigger id="review-decision">
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
          </div>

          {decision === 'APPROVE' && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="review-type">Nhóm chính thức</Label>
                <Select
                  value={contributorType}
                  onValueChange={(value) => setContributorType(value as ContributorType)}
                >
                  <SelectTrigger id="review-type">
                    <SelectValue placeholder="Chọn nhóm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="review-basis">
                  Cơ sở phê duyệt{' '}
                  <span className="font-normal text-muted-foreground">(tối thiểu 20 ký tự)</span>
                </Label>
                <Textarea
                  id="review-basis"
                  rows={2}
                  value={approvalBasis}
                  onChange={(e) => setApprovalBasis(e.target.value)}
                  placeholder="Nhập lý do, căn cứ phê duyệt hồ sơ..."
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="review-note">
              Ghi chú{' '}
              {decision === 'REJECT' ? '(bắt buộc, tối thiểu 10 ký tự)' : '(tối thiểu 10 ký tự)'}
            </Label>
            <Textarea
              id="review-note"
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder={
                decision === 'REJECT'
                  ? 'Nêu rõ lý do từ chối để người dùng hoàn thiện hồ sơ...'
                  : 'Ghi chú gửi kèm quyết định phê duyệt...'
              }
            />
          </div>

          {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={reviewMutation.isPending || !application}
          >
            {reviewMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
