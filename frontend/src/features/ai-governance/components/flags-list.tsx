import { Flag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { useAiFlagsQuery } from '../queries/ai-governance.queries';

/** Danh sách cờ kiểm tra theo trạng thái. */
export function FlagsList() {
  const { data, isLoading, isError, refetch } = useAiFlagsQuery();
  const flags = data ?? [];

  if (isLoading) return <LoadingState message="Đang tải cờ kiểm tra..." />;
  if (isError) {
    return <ErrorState title="Không tải được danh sách cờ." onRetry={() => void refetch()} />;
  }
  if (flags.length === 0) {
    return <EmptyState title="Không có cờ nào" description="Mọi tín hiệu đều đã được xem xét." />;
  }

  return (
    <ul className="space-y-2">
      {flags.map((flag) => (
        <li key={flag.id} className="flex items-center gap-3 rounded-xl border p-3">
          <Flag className="size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{flag.kind}</p>
            <p className="truncate text-xs text-muted-foreground">{flag.target}</p>
          </div>
          <Badge variant={flag.status === 'OPEN' ? 'destructive' : 'secondary'}>
            {flag.statusLabel}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
