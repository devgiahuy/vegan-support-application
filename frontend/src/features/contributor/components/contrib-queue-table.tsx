'use client';

import * as React from 'react';
import { Inbox, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ContributorApprovalBasis } from '@/common/enums';
import type { ContributorApplication } from '../types/contributor.model';
import { useContributorQueueQuery } from '../queries/contributor.queries';
import { ReviewApplicationDialog } from './review-application-dialog';
import { InviteContributorDialog } from './invite-contributor-dialog';

/** Hàng chờ duyệt đơn Contributor của Quản trị viên (Phase 14 Parity). */
export function ContribQueueTable() {
  const [status, setStatus] = React.useState('PENDING');
  const [claimedBasis, setClaimedBasis] = React.useState('ALL');
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<ContributorApplication | null>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  const queryStatus = status === 'ALL' ? undefined : status;
  const queryBasis = claimedBasis === 'ALL' ? undefined : claimedBasis;

  const { data, isLoading, isError, refetch } = useContributorQueueQuery({
    status: queryStatus,
    claimedApprovalBasis: queryBasis,
    limit: 50,
  });

  const apps = (data?.items ?? []).filter((app) =>
    query.trim().length === 0
      ? true
      : `${app.applicantName} ${app.applicantEmail} ${app.organizationClaim ?? ''}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Inbox className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email, tổ chức..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44" aria-label="Lọc trạng thái">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="PENDING">Chờ duyệt</SelectItem>
              <SelectItem value="APPROVED">Đã duyệt</SelectItem>
              <SelectItem value="REJECTED">Bị từ chối</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={claimedBasis} onValueChange={setClaimedBasis}>
          <SelectTrigger className="sm:w-56" aria-label="Lọc căn cứ đề xuất">
            <SelectValue placeholder="Căn cứ đề xuất" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">Tất cả căn cứ</SelectItem>
              <SelectItem value={ContributorApprovalBasis.ORGANIZATION_AFFILIATION}>
                Tổ chức đối tác / Viện
              </SelectItem>
              <SelectItem value={ContributorApprovalBasis.PLATFORM_TRACK_RECORD}>
                Thành viên uy tín
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button type="button" onClick={() => setInviteOpen(true)} className="shrink-0 gap-1.5">
          <UserPlus className="size-4" />
          <span>Mời Contributor</span>
        </Button>
      </div>

      {isLoading && <LoadingState message="Đang tải hàng chờ xét duyệt..." />}
      {isError && <ErrorState title="Không tải được hàng chờ." onRetry={() => void refetch()} />}
      {!isLoading && !isError && apps.length === 0 && (
        <EmptyState title="Không có đơn nào" description="Thử đổi từ khóa hoặc bộ lọc." />
      )}
      {!isLoading && !isError && apps.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người nộp</TableHead>
                <TableHead>Căn cứ đề xuất</TableHead>
                <TableHead>Tổ chức / Minh chứng</TableHead>
                <TableHead>Nguồn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <p className="font-medium">{app.applicantName || '—'}</p>
                    <p className="text-xs text-muted-foreground">{app.applicantEmail}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal text-xs">
                      {app.claimedApprovalBasisLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-64">
                    {app.organizationClaim ? (
                      <p className="font-medium text-xs text-foreground truncate">
                        {app.organizationClaim}
                      </p>
                    ) : null}
                    <p className="truncate text-xs text-muted-foreground">
                      {app.experienceShort || app.experience}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{app.sourceLabel}</span>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={app.status !== 'PENDING'}
                      onClick={() => setSelected(app)}
                    >
                      Xét duyệt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ReviewApplicationDialog
        application={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />

      <InviteContributorDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={() => void refetch()}
      />
    </div>
  );
}
