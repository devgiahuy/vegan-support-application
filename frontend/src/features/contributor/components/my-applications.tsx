import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import type { ContributorApplication } from '../types/contributor.model';

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Lịch sử đơn xét duyệt Contributor của bản thân (Phase 14 Parity). */
export function MyApplications({ apps }: { apps: ContributorApplication[] }) {
  if (apps.length === 0) {
    return (
      <EmptyState
        title="Chưa có hồ sơ nào"
        description="Gửi đơn đầu tiên ở biểu mẫu bên trên để trở thành Người đóng góp cho cộng đồng."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {apps.map((app) => (
        <Card key={app.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{app.claimedApprovalBasisLabel}</CardTitle>
                {app.organizationClaim && (
                  <span className="text-xs text-muted-foreground font-normal">
                    ({app.organizationClaim})
                  </span>
                )}
              </div>
              <Badge
                variant={
                  app.status === 'PENDING'
                    ? 'secondary'
                    : app.status === 'APPROVED'
                      ? 'default'
                      : 'destructive'
                }
              >
                {app.statusLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {app.approvalBasisLabel && (
              <p>
                Căn cứ phê duyệt chính thức: <strong>{app.approvalBasisLabel}</strong>
              </p>
            )}
            {app.invitedBy && (
              <p className="text-muted-foreground">
                Quản trị viên mời: <strong>{app.invitedBy.displayName}</strong>
                {app.invitationReason ? ` — Lý do: ${app.invitationReason}` : ''}
              </p>
            )}
            {app.reviewNote && (
              <p className="text-muted-foreground">
                Ghi chú thẩm định: <span className="text-foreground">{app.reviewNote}</span>
              </p>
            )}
            {app.reviewedBy && (
              <p className="text-muted-foreground text-xs">
                Người duyệt: {app.reviewedBy}
                {app.reviewedAt ? ` · ${formatDate(app.reviewedAt)}` : ''}
              </p>
            )}
            {app.status === 'REJECTED' && app.reapplyEligibleAt && (
              <p className="text-amber-700 dark:text-amber-400 font-medium text-xs">
                Được phép nộp lại hồ sơ từ ngày: {formatDate(app.reapplyEligibleAt)}
              </p>
            )}
            <p className="text-xs text-muted-foreground pt-1 border-t">
              Nộp ngày {formatDate(app.createdAt)} · Nguồn: {app.sourceLabel || app.source}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
