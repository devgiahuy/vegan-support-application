import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import type { ContributorApplication } from '../types/contributor.model';

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Lịch sử đơn (presentational): trạng thái, nhóm, ghi chú duyệt, ngày nộp lại. */
export function MyApplications({ apps }: { apps: ContributorApplication[] }) {
  if (apps.length === 0) {
    return (
      <EmptyState
        title="Chưa có đơn nào"
        description="Gửi đơn đầu tiên ở biểu mẫu bên trên để trở thành người đóng góp."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {apps.map((app) => (
        <Card key={app.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{app.requestedTypeLabel}</CardTitle>
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
            {app.approvedTypeLabel && (
              <p>
                Nhóm đã duyệt: <strong>{app.approvedTypeLabel}</strong>
                {app.approvalBasis && (
                  <span className="text-muted-foreground"> — {app.approvalBasis}</span>
                )}
              </p>
            )}
            {app.reviewNote && (
              <p className="text-muted-foreground">Ghi chú duyệt: {app.reviewNote}</p>
            )}
            {app.reviewedBy && (
              <p className="text-muted-foreground">
                Người duyệt: {app.reviewedBy}
                {app.reviewedAt ? ` · ${formatDate(app.reviewedAt)}` : ''}
              </p>
            )}
            {app.status === 'REJECTED' && app.reapplyEligibleAt && (
              <p className="text-muted-foreground">
                Được nộp lại từ ngày {formatDate(app.reapplyEligibleAt)}.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Nộp ngày {formatDate(app.createdAt)} · Nguồn: {app.sourceLabel || app.source}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
