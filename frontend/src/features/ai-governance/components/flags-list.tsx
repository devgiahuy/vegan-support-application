'use client';

import { AlertTriangle, Flag, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { useAiFlagsQuery } from '../queries/ai-governance.queries';

/**
 * FlagsList: Danh sách cờ an toàn kiểm duyệt AI.
 * Đây là các tín hiệu tham khảo để Admin theo dõi — không tự động xử phạt hay xóa cứng nội dung.
 */
export function FlagsList() {
  const { data, isLoading, isError, refetch } = useAiFlagsQuery();
  const flags = data ?? [];

  if (isLoading) return <LoadingState message="Đang tải cờ an toàn AI..." />;
  if (isError) {
    return <ErrorState title="Không tải được danh sách cờ." onRetry={() => void refetch()} />;
  }
  if (flags.length === 0) {
    return (
      <EmptyState
        title="Không có cờ an toàn nào"
        description="Mọi tín hiệu kiểm duyệt AI hiện đều ở mức an toàn hoặc đã được xử lý."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Tín hiệu Cảnh báo An toàn (Safety Flags)</h3>
        <p className="text-xs text-muted-foreground">
          Tín hiệu cảnh báo từ mô hình kiểm duyệt. Dùng làm chỉ báo giám sát tỷ lệ dương tính giả
          (false-positive).
        </p>
      </div>

      <ul className="space-y-2.5">
        {flags.map((flag) => {
          const isHighRisk = flag.riskLevel === 'HIGH';
          return (
            <li
              key={flag.id}
              className="flex items-start justify-between gap-3 rounded-xl border bg-card p-3.5"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-lg p-1.5 ${
                    isHighRisk
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}
                >
                  {isHighRisk ? (
                    <ShieldAlert className="size-4" />
                  ) : (
                    <AlertTriangle className="size-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">
                      Mức rủi ro: {flag.riskLevelLabel} ({flag.riskScorePercent}%)
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {flag.provider}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Mẫu: {flag.model}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Phát hiện lúc:{' '}
                    {flag.createdAt
                      ? flag.createdAt.toLocaleTimeString('vi-VN') +
                        ' ' +
                        flag.createdAt.toLocaleDateString('vi-VN')
                      : '—'}
                  </p>
                </div>
              </div>

              <Badge
                variant={flag.status === 'OPEN' ? 'destructive' : 'secondary'}
                className="shrink-0 text-[11px]"
              >
                {flag.statusLabel}
              </Badge>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
