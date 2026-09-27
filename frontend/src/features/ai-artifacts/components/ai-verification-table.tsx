'use client';

import * as React from 'react';
import Link from 'next/link';
import { ExternalLink, Shield, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { usePublicAiArtifactsQuery } from '../queries/ai-artifact.queries';
import type { AiVerification } from '../types/ai-verification.model';
import { AdminVerificationDialog } from './admin-verification-dialog';
import { VerificationBadge } from './verification-badge';

export function AiVerificationTable() {
  const { data, isLoading } = usePublicAiArtifactsQuery({ limit: 50 });
  const [selectedVerification, setSelectedVerification] = React.useState<AiVerification | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);

  if (isLoading) {
    return <LoadingState message="Đang tải danh sách kiểm chứng..." />;
  }

  const verifiedArtifacts = data?.items.filter((item) => item.activeVerification !== null) ?? [];

  if (verifiedArtifacts.length === 0) {
    return (
      <EmptyState
        title="Chưa có kiểm chứng nào"
        description="Hiện chưa có bản ghi tri thức AI nào được chuyên gia hoặc quản trị viên thẩm định."
      />
    );
  }

  const handleAction = (verification: AiVerification) => {
    setSelectedVerification(verification);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Tri thức AI</TableHead>
              <TableHead className="text-xs">Loại</TableHead>
              <TableHead className="text-xs">Người thẩm định</TableHead>
              <TableHead className="text-xs">Kết luận</TableHead>
              <TableHead className="text-xs">Trạng thái</TableHead>
              <TableHead className="text-right text-xs">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {verifiedArtifacts.map((art) => {
              const v = art.activeVerification!;
              return (
                <TableRow key={art.id}>
                  <TableCell className="font-medium text-xs max-w-xs truncate">
                    <Link
                      href={`/assistant/public?share=${art.id}`}
                      className="hover:underline flex items-center gap-1.5"
                      target="_blank"
                    >
                      <span className="truncate">{art.title}</span>
                      <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{art.typeLabel}</TableCell>
                  <TableCell className="text-xs">
                    <div>
                      <p className="font-medium">{v.reviewer.name}</p>
                      <p className="text-[10px] text-muted-foreground">{v.reviewer.roleLabel}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <VerificationBadge verification={v} compact />
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className="text-[10px]">
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1 hover:text-destructive"
                      onClick={() => handleAction(v)}
                    >
                      <ShieldAlert className="size-3.5" />
                      <span>Can thiệp</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedVerification && (
        <AdminVerificationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          verification={selectedVerification}
        />
      )}
    </div>
  );
}
