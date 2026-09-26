'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Settings, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import {
  useAdminStoragePoliciesQuery,
  useUpdateStoragePolicyMutation,
} from '../queries/storage.queries';
import type { StoragePolicy } from '../types/storage.model';
import { formatBytes } from '../utils/format-bytes';

const GB_BYTES = 1024 * 1024 * 1024;
const MB_BYTES = 1024 * 1024;

export function StoragePolicyForm() {
  const { data, isLoading, isError, error, refetch } = useAdminStoragePoliciesQuery();

  const policies = data?.items ?? [];
  const activePolicy = policies.find((p) => p.active) || policies[0];

  return (
    <div className="space-y-6 max-w-3xl">
      {isLoading && <LoadingState message="Đang tải cấu hình chính sách lưu trữ..." />}
      {isError && (
        <ErrorState
          error={error}
          title="Không thể tải chính sách lưu trữ"
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && policies.length === 0 && (
        <EmptyState
          title="Chưa có chính sách lưu trữ nào"
          description="Hệ thống chưa khởi tạo chính sách lưu trữ mặc định."
        />
      )}

      {!isLoading && !isError && activePolicy && (
        <PolicyEditorCard policy={activePolicy} onUpdated={() => void refetch()} />
      )}
    </div>
  );
}

function PolicyEditorCard({ policy, onUpdated }: { policy: StoragePolicy; onUpdated: () => void }) {
  const updateMutation = useUpdateStoragePolicyMutation();

  // Convert bytes to GB or MB for display/editing
  const initialQuotaGb = (policy.quotaBytes / GB_BYTES).toFixed(2);
  const [quotaGbInput, setQuotaGbInput] = React.useState(initialQuotaGb);
  const [ttlSeconds, setTtlSeconds] = React.useState(policy.reservationTtlSeconds.toString());
  const [warningPercent, setWarningPercent] = React.useState(policy.warningPercent.toString());

  // Reset form when policy prop updates (e.g. after refetch with new version)
  React.useEffect(() => {
    setQuotaGbInput((policy.quotaBytes / GB_BYTES).toFixed(2));
    setTtlSeconds(policy.reservationTtlSeconds.toString());
    setWarningPercent(policy.warningPercent.toString());
  }, [policy]);

  const parsedGb = parseFloat(quotaGbInput);
  const calculatedQuotaBytes =
    !isNaN(parsedGb) && parsedGb > 0 ? Math.round(parsedGb * GB_BYTES) : 0;

  const parsedTtl = parseInt(ttlSeconds, 10);
  const parsedWarning = parseInt(warningPercent, 10);

  const isValidQuota = calculatedQuotaBytes >= 100 * MB_BYTES; // Min 100MB
  const isValidTtl = !isNaN(parsedTtl) && parsedTtl >= 60 && parsedTtl <= 86400; // 1 min to 24 hrs
  const isValidWarning = !isNaN(parsedWarning) && parsedWarning >= 50 && parsedWarning <= 99;

  const hasChanges =
    calculatedQuotaBytes !== policy.quotaBytes ||
    parsedTtl !== policy.reservationTtlSeconds ||
    parsedWarning !== policy.warningPercent;

  const canSave =
    isValidQuota && isValidTtl && isValidWarning && hasChanges && !updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    try {
      await updateMutation.mutateAsync({
        policyId: policy.id,
        payload: {
          quotaBytes: calculatedQuotaBytes,
          reservationTtlSeconds: parsedTtl,
          warningPercent: parsedWarning,
          expectedVersion: policy.version,
        },
      });

      toast.success('Đã cập nhật chính sách lưu trữ thành công.');
      onUpdated();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Cập nhật chính sách thất bại. Có thể phiên bản chính sách đã thay đổi.';
      toast.error(message);
    }
  };

  return (
    <Card className="rounded-2xl border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              {policy.name || 'Chính sách lưu trữ người dùng'}
            </CardTitle>
            {policy.active && (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px]">
                Đang áp dụng
              </Badge>
            )}
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            Phiên bản: v{policy.version}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Cấu hình hạn ngạch mặc định và cơ chế reservation áp dụng cho toàn bộ thành viên hệ thống.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Hạn ngạch mặc định */}
          <div className="space-y-2">
            <Label htmlFor="policy-quota" className="text-xs font-semibold">
              Hạn mức dung lượng mỗi người dùng (GiB)
            </Label>
            <div className="flex gap-2 items-center max-w-sm">
              <Input
                id="policy-quota"
                type="number"
                step="0.1"
                min="0.1"
                value={quotaGbInput}
                onChange={(e) => setQuotaGbInput(e.target.value)}
                className="h-9 text-sm"
              />
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                GiB (~{formatBytes(calculatedQuotaBytes)})
              </span>
            </div>
            {!isValidQuota && (
              <p className="text-[11px] text-destructive">
                Hạn mức tối thiểu phải từ 0.1 GiB (100 MB) trở lên.
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Dung lượng lưu trữ tối đa cấp phát mặc định cho mỗi tài khoản thành viên khi đăng ký.
            </p>
          </div>

          {/* Reservation TTL */}
          <div className="space-y-2">
            <Label htmlFor="policy-ttl" className="text-xs font-semibold">
              Thời gian giữ chỗ Reservation (giây)
            </Label>
            <div className="flex gap-2 items-center max-w-sm">
              <Input
                id="policy-ttl"
                type="number"
                min="60"
                max="86400"
                step="30"
                value={ttlSeconds}
                onChange={(e) => setTtlSeconds(e.target.value)}
                className="h-9 text-sm"
              />
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                giây ({Math.round(parsedTtl / 60)} phút)
              </span>
            </div>
            {!isValidTtl && (
              <p className="text-[11px] text-destructive">
                Thời gian giữ chỗ phải từ 60 giây (1 phút) đến 86400 giây (24 giờ).
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Khoảng thời gian dung lượng tạm giữ trước khi upload hoàn tất. Sau thời gian này
              reservation chưa commit sẽ tự động hết hạn.
            </p>
          </div>

          {/* Ngưỡng cảnh báo */}
          <div className="space-y-2">
            <Label htmlFor="policy-warning" className="text-xs font-semibold">
              Ngưỡng cảnh báo đầy bộ nhớ (%)
            </Label>
            <div className="flex gap-2 items-center max-w-sm">
              <Input
                id="policy-warning"
                type="number"
                min="50"
                max="99"
                value={warningPercent}
                onChange={(e) => setWarningPercent(e.target.value)}
                className="h-9 text-sm"
              />
              <span className="text-xs font-medium text-muted-foreground">%</span>
            </div>
            {!isValidWarning && (
              <p className="text-[11px] text-destructive">
                Ngưỡng cảnh báo phải nằm trong khoảng từ 50% đến 99%.
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Khi dung lượng đã dùng vượt qua tỷ lệ này, giao diện người dùng sẽ đổi sang trạng thái
              cảnh báo màu cam.
            </p>
          </div>

          <div className="rounded-xl border bg-muted/30 p-3 text-xs flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="text-muted-foreground leading-relaxed">
              Mọi thay đổi chính sách được bảo vệ bởi cơ chế{' '}
              <strong className="text-foreground">Optimistic Concurrency Control</strong>{' '}
              (expectedVersion = {policy.version}). Nếu có quản trị viên khác vừa cập nhật chính
              sách, thao tác sẽ bị từ chối để tránh ghi đè dữ liệu.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="submit" disabled={!canSave} className="gap-2">
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Lưu thay đổi chính sách
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
