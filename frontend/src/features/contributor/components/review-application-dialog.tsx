'use client';

import * as React from 'react';
import { ExternalLink, ShieldAlert } from 'lucide-react';
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
import { ContributorApprovalBasis } from '@/common/enums';
import { useAuthStore } from '@/store/useAuthStore';
import type { ContributorApplication } from '../types/contributor.model';
import { useReviewApplicationMutation } from '../queries/contributor.queries';
import { reviewApplicationSchema } from '../schemas/contributor.schema';
import { APPROVAL_BASIS_LABELS } from '../mappers/contributor.mapper';

const DECISION_OPTIONS = [
  { value: 'APPROVE', label: 'Phê duyệt' },
  { value: 'REJECT', label: 'Từ chối' },
] as const;

const APPROVAL_BASIS_SELECT_OPTIONS = [
  {
    value: ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
    label: APPROVAL_BASIS_LABELS[ContributorApprovalBasis.ORGANIZATION_AFFILIATION],
  },
  {
    value: ContributorApprovalBasis.PLATFORM_TRACK_RECORD,
    label: APPROVAL_BASIS_LABELS[ContributorApprovalBasis.PLATFORM_TRACK_RECORD],
  },
  {
    value: ContributorApprovalBasis.ADMIN_INVITED,
    label: APPROVAL_BASIS_LABELS[ContributorApprovalBasis.ADMIN_INVITED],
  },
] as const;

/**
 * Dialog xét duyệt đơn Contributor:
 * APPROVE (kèm căn cứ duyệt chính thức và ghi chú) / REJECT (ghi chú lý do bắt buộc).
 * Có kiểm tra chống tự phê duyệt (Self-approval prohibition).
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
  const { user } = useAuthStore();
  const reviewMutation = useReviewApplicationMutation();

  const [decision, setDecision] = React.useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [approvalBasis, setApprovalBasis] = React.useState<ContributorApprovalBasis>(
    ContributorApprovalBasis.PLATFORM_TRACK_RECORD
  );
  const [reviewNote, setReviewNote] = React.useState('');
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  // Tự xét duyệt đơn của chính mình bị cấm tuyệt đối
  const isSelfReview = Boolean(
    user?.id && application?.applicantId && user.id === application.applicantId
  );

  const reset = React.useCallback(() => {
    setDecision('APPROVE');
    setApprovalBasis(
      application?.claimedApprovalBasis ?? ContributorApprovalBasis.PLATFORM_TRACK_RECORD
    );
    setReviewNote('');
    setFieldError(null);
  }, [application?.claimedApprovalBasis]);

  React.useEffect(() => {
    if (open && application) {
      setDecision('APPROVE');
      setApprovalBasis(application.claimedApprovalBasis);
      setReviewNote('');
      setFieldError(null);
    }
  }, [open, application]);

  const handleConfirm = async () => {
    if (!application || isSelfReview) return;

    const parsed =
      decision === 'APPROVE'
        ? reviewApplicationSchema.safeParse({
            decision,
            approvalBasis,
            reviewNote,
          })
        : reviewApplicationSchema.safeParse({ decision, reviewNote });

    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Vui lòng kiểm tra lại thông tin.');
      return;
    }

    setFieldError(null);
    try {
      await reviewMutation.mutateAsync({ id: application.id, input: parsed.data });
      reset();
      onOpenChange(false);
    } catch {
      // Lỗi đã được toast ở query layer
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thẩm định đơn đăng ký Contributor</DialogTitle>
          <DialogDescription>
            {application
              ? `${application.applicantName} (${application.applicantEmail})`
              : 'Chi tiết hồ sơ đăng ký'}
          </DialogDescription>
        </DialogHeader>

        {isSelfReview && (
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <p>
              Quy tắc kiểm toán độc lập: Bạn không thể tự phê duyệt hoặc từ chối đơn do chính mình
              tạo ra.
            </p>
          </div>
        )}

        {application && (
          <div className="rounded-xl border bg-muted/40 p-3 text-sm space-y-2">
            <div>
              <span className="font-semibold text-foreground">Căn cứ đề xuất: </span>
              <span className="text-muted-foreground">{application.claimedApprovalBasisLabel}</span>
            </div>
            {application.organizationClaim && (
              <div>
                <span className="font-semibold text-foreground">Tổ chức liên kết: </span>
                <span className="text-muted-foreground">{application.organizationClaim}</span>
              </div>
            )}
            <div>
              <span className="font-semibold text-foreground">Mô tả kinh nghiệm: </span>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed bg-background/50 p-2.5 rounded-lg border">
                {application.experience}
              </p>
            </div>
            {application.referenceLinks.length > 0 && (
              <div>
                <span className="font-semibold text-foreground">Liên kết minh chứng: </span>
                <ul className="mt-1 space-y-1">
                  {application.referenceLinks.map((link, idx) => (
                    <li key={idx}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        <span className="break-all">{link}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="review-decision">Quyết định thẩm định</Label>
            <Select
              value={decision}
              onValueChange={(value) => setDecision(value as 'APPROVE' | 'REJECT')}
              disabled={isSelfReview}
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="review-basis">Căn cứ phê duyệt chính thức (Audit Basis)</Label>
              <Select
                value={approvalBasis}
                onValueChange={(value) => setApprovalBasis(value as ContributorApprovalBasis)}
                disabled={isSelfReview}
              >
                <SelectTrigger id="review-basis">
                  <SelectValue placeholder="Chọn căn cứ phê duyệt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {APPROVAL_BASIS_SELECT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="review-note">
              Ghi chú thẩm định{' '}
              {decision === 'REJECT'
                ? '(Bắt buộc nêu lý do từ chối, tối thiểu 10 ký tự)'
                : '(Tối thiểu 5 ký tự)'}
            </Label>
            <Textarea
              id="review-note"
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              disabled={isSelfReview}
              placeholder={
                decision === 'REJECT'
                  ? 'Nêu rõ lý do từ chối để thành viên cải thiện hồ sơ nộp lại...'
                  : 'Ghi chú thẩm định đối soát bằng chứng hồ sơ...'
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
            disabled={reviewMutation.isPending || !application || isSelfReview}
          >
            {reviewMutation.isPending ? 'Đang xử lý...' : 'Xác nhận thẩm định'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
