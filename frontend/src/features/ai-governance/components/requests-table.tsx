import { Badge } from '@/components/ui/badge';
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
import { useAiRequestsQuery } from '../queries/ai-governance.queries';

/**
 * Bảng log che mờ: hash rút gọn + mã chủ đề + provider/mẫu + số liệu.
 * KHÔNG BAO GIỜ render nội dung thô (mapper đã loại bỏ).
 */
export function RequestsTable() {
  const { data, isLoading, isError, refetch } = useAiRequestsQuery({ limit: 20 });
  const logs = data?.items ?? [];

  if (isLoading) return <LoadingState message="Đang tải log..." />;
  if (isError) {
    return <ErrorState title="Không tải được log." onRetry={() => void refetch()} />;
  }
  if (logs.length === 0) {
    return <EmptyState title="Chưa có log nào" description="Thử đổi bộ lọc." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã prompt</TableHead>
            <TableHead>Chủ đề</TableHead>
            <TableHead>Provider / Mẫu</TableHead>
            <TableHead>Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-mono text-xs">{log.promptHash || '—'}</TableCell>
              <TableCell className="max-w-45">
                <p className="truncate text-xs">
                  {log.topicCodes.length > 0 ? log.topicCodes.join(', ') : '—'}
                </p>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {log.provider || '—'} / {log.modelId || '—'}
              </TableCell>
              <TableCell>
                <Badge variant={log.status === 'OK' ? 'secondary' : 'destructive'}>
                  {log.statusLabel}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
