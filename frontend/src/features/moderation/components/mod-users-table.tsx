'use client';

import * as React from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useAuthStore } from '@/store/useAuthStore';
import type { ModeratedUser } from '../types/moderation.model';
import { useModeratedUsersQuery } from '../queries/moderation.queries';
import { UserStatusDialog } from './user-status-dialog';

/** Bảng quản trị tài khoản: tìm/lọc + đổi trạng thái đúng luật, chặn tự sửa/bảo vệ. */
export function ModUsersTable() {
  const { user: me } = useAuthStore();
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [selected, setSelected] = React.useState<ModeratedUser | null>(null);
  const { data, isLoading, isError, refetch } = useModeratedUsersQuery({
    q: query || undefined,
    status: status || undefined,
    limit: 20,
  });
  const users = data?.items ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2" role="group" aria-label="Lọc trạng thái">
          {[
            { value: '', label: 'Tất cả' },
            { value: 'ACTIVE', label: 'Hoạt động' },
            { value: 'LOCKED', label: 'Đã khóa' },
            { value: 'BANNED', label: 'Đã cấm' },
          ].map((option) => (
            <Button
              key={option.value}
              variant={status === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading && <LoadingState message="Đang tải danh sách tài khoản..." />}
      {isError && <ErrorState title="Không tải được danh sách." onRetry={() => void refetch()} />}
      {!isLoading && !isError && users.length === 0 && (
        <EmptyState title="Không có tài khoản nào" description="Thử đổi từ khóa hoặc bộ lọc." />
      )}
      {!isLoading && !isError && users.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tài khoản</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Báo cáo</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((account) => {
                const isSelf = Boolean(me && account.id === me.id);
                const locked = isSelf || account.isProtectedAdmin;
                return (
                  <TableRow key={account.id}>
                    <TableCell>
                      <p className="font-medium">{account.displayName}</p>
                      <p className="text-xs text-muted-foreground">{account.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-full">
                        {account.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{account.reportCount}</TableCell>
                    <TableCell>
                      <Badge variant={account.status === 'ACTIVE' ? 'secondary' : 'destructive'}>
                        {account.statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={locked}
                        title={
                          isSelf
                            ? 'Không thể tự đổi trạng thái tài khoản của chính mình'
                            : account.isProtectedAdmin
                              ? 'Tài khoản admin được bảo vệ'
                              : 'Đổi trạng thái'
                        }
                        onClick={() => setSelected(account)}
                      >
                        {(isSelf || account.isProtectedAdmin) && (
                          <ShieldAlert data-icon="inline-start" />
                        )}
                        Đổi trạng thái
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <UserStatusDialog
        account={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
