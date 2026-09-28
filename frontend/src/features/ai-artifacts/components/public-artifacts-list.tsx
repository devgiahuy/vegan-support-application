'use client';

import * as React from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { AiArtifactType } from '@/common/enums';
import { usePublicAiArtifactsQuery } from '../queries/ai-artifact.queries';
import { PublicArtifactCard } from './public-artifact-card';

const TYPE_TABS: { label: string; value: string; type?: AiArtifactType }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Trợ lý AI', value: 'CHAT', type: AiArtifactType.CHAT_ANSWER },
  {
    label: 'Dinh dưỡng',
    value: 'NUTRITION',
    type: AiArtifactType.RECIPE_NUTRITION,
  },
  {
    label: 'Tủ lạnh',
    value: 'FRIDGE',
    type: AiArtifactType.FRIDGE_RECOGNITION,
  },
  {
    label: 'Hóa đơn',
    value: 'RECEIPT',
    type: AiArtifactType.RECEIPT_EXTRACTION,
  },
];

export function PublicArtifactsList() {
  const [selectedTab, setSelectedTab] = React.useState('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(1);

  const activeTabDef = TYPE_TABS.find((t) => t.value === selectedTab);
  const activeType = activeTabDef?.type;

  const { data, isLoading, isError, refetch } = usePublicAiArtifactsQuery({
    page,
    limit: 20,
    type: activeType,
  });

  const filteredItems = React.useMemo(() => {
    if (!data?.items) return [];
    if (!searchQuery.trim()) return data.items;
    const query = searchQuery.toLowerCase().trim();
    return data.items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) || item.summary.toLowerCase().includes(query)
    );
  }, [data?.items, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm chủ đề hoặc từ khóa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <Tabs
          value={selectedTab}
          onValueChange={(val) => {
            setSelectedTab(val);
            setPage(1);
          }}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-5 h-9">
            {TYPE_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <LoadingState message="Đang tải danh sách tri thức AI..." />
      ) : isError ? (
        <ErrorState
          title="Không thể tải danh sách."
          error="Đã xảy ra lỗi khi lấy dữ liệu từ máy chủ. Vui lòng thử lại."
          onRetry={() => void refetch()}
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="Chưa có bản ghi nào"
          description={
            searchQuery
              ? 'Không tìm thấy tri thức AI phù hợp với từ khóa tìm kiếm.'
              : 'Chưa có tri thức AI nào được chia sẻ trong danh mục này.'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((artifact) => (
            <PublicArtifactCard key={artifact.id} artifact={artifact} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {data && data.metadata && data.metadata.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
          <span>
            Trang {data.metadata.page} / {data.metadata.totalPages} (Tổng số{' '}
            {data.metadata.totalItems} mục)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!data.metadata.hasPrevPage}
            >
              Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.metadata.hasNextPage}
            >
              Trang sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
