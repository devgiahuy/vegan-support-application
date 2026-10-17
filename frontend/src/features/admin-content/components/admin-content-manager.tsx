'use client';

import * as React from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PostType } from '@/common/enums';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Pagination } from '@/components/shared/pagination';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useAdminContentListQuery,
  useSubmitAdminContentMutation,
} from '../queries/admin-content.queries';
import { adminContentMapper } from '../mappers/admin-content.mapper';
import { ADMIN_CONTENT_PUBLISHED_ONLY_NOTE } from '../types/admin-content.options';
import {
  AdminContentFilters,
  INITIAL_FILTER_STATE,
  buildListParams,
  hasActiveFilter,
  type AdminContentFilterState,
} from './admin-content-filters';
import { AdminContentTable } from './admin-content-table';
import { AdminContentEditorDialog } from './admin-content-editor-dialog';
import { AdminContentDeleteDialog } from './admin-content-delete-dialog';
import { AdminContentHistoryDialog } from './admin-content-history-dialog';
import { AdminContentSelfReviewNotice } from './admin-content-self-review-notice';
import type { AdminContentRow } from '../types/admin-content.model';

const PAGE_SIZE = 12;

/**
 * Khu vực Quản lý nội dung trong dashboard quản trị.
 *
 * Bốn trạng thái hiển thị được tách bạch (FR-006, FR-007, SC-007):
 * đang tải → skeleton; lỗi → thông báo + nút "Thử lại"; rỗng → hướng dẫn + nút hành động;
 * thành công → bảng. Trạng thái rỗng **không** được dùng để che lỗi.
 *
 * Thành phần tự sở hữu các hộp thoại tạo / sửa / xoá / lịch sử — cùng khuôn mẫu với
 * `CategoryManager`, để trang dashboard chỉ cần render một lần.
 */
export function AdminContentManager() {
  const sessionUserId = useAuthStore((state) => state.user?.id ?? '');
  const [filters, setFilters] = React.useState<AdminContentFilterState>(INITIAL_FILTER_STATE);
  const [page, setPage] = React.useState(1);

  const [editorState, setEditorState] = React.useState<{
    open: boolean;
    type: PostType | null;
    mode: 'create' | 'edit';
    row: AdminContentRow | null;
  }>({ open: false, type: null, mode: 'create', row: null });
  const [deleteTarget, setDeleteTarget] = React.useState<AdminContentRow | null>(null);
  const [historyTarget, setHistoryTarget] = React.useState<AdminContentRow | null>(null);

  const listQuery = useAdminContentListQuery(
    buildListParams(filters, page, PAGE_SIZE),
    sessionUserId
  );
  const submitMutation = useSubmitAdminContentMutation();

  const result = listQuery.data;
  const rows = result?.rows ?? [];
  const source = result?.source ?? 'published-only';
  const totalItems = result?.totalItems ?? 0;
  const totalPages = result?.totalPages ?? 1;

  const handleFilterChange = React.useCallback((next: AdminContentFilterState) => {
    setFilters(next);
    setPage(1);
  }, []);

  const handleReset = React.useCallback(() => {
    setFilters(INITIAL_FILTER_STATE);
    setPage(1);
  }, []);

  const handleSubmitForReview = React.useCallback(
    (row: AdminContentRow) => {
      submitMutation.mutate(
        { id: row.id, input: { revisionId: row.revisionId, expectedVersion: row.version } },
        {
          onError: (error) => {
            toast.error(adminContentMapper.mapErrorObject(error));
          },
        }
      );
    },
    [submitMutation]
  );

  const busy = submitMutation.isPending;
  const isLoading = listQuery.isLoading;
  const isError = listQuery.isError;
  const isEmpty = !isLoading && !isError && rows.length === 0;

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      {/* Header khu vực quản lý nội dung - canh lề chuẩn xác, responsive */}
      <div className="flex flex-col gap-4 border-b border-border/80 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 bg-card">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Quản lý nội dung
            </h2>
            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
              {totalItems.toLocaleString('vi-VN')} bản ghi
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Quản lý công thức, bài viết và video do bạn đăng tải
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setEditorState({ open: true, type: null, mode: 'create', row: null })}
          disabled={busy}
          className="w-full sm:w-auto shrink-0 shadow-xs"
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Tạo nội dung
        </Button>
      </div>

      <CardContent className="space-y-4 p-4 sm:p-6">
        <AdminContentSelfReviewNotice visible={sessionUserId.length > 0} />

        {source === 'published-only' && (
          <Alert
            role="status"
            className="border-sky-500/30 bg-sky-500/10 text-sky-950 dark:text-sky-200 [&>svg]:text-sky-600 dark:[&>svg]:text-sky-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <AlertDescription className="text-xs sm:text-sm font-medium">
              {ADMIN_CONTENT_PUBLISHED_ONLY_NOTE}
            </AlertDescription>
          </Alert>
        )}

        <AdminContentFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
          source={source}
        />

        {isLoading && (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            <span className="sr-only">Đang tải danh sách nội dung...</span>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <ErrorState
            title="Không tải được danh sách nội dung."
            onRetry={() => void listQuery.refetch()}
          />
        )}

        {isEmpty && (
          <EmptyState
            title={
              hasActiveFilter(filters) ? 'Không có nội dung khớp bộ lọc.' : 'Chưa có nội dung nào.'
            }
            description={
              hasActiveFilter(filters)
                ? 'Thử xoá bộ lọc để xem toàn bộ nội dung đã xuất bản.'
                : 'Tạo công thức, bài viết hoặc video đầu tiên của bạn.'
            }
            action={
              hasActiveFilter(filters) ? (
                <Button type="button" variant="outline" onClick={handleReset}>
                  Xoá bộ lọc
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() =>
                    setEditorState({ open: true, type: null, mode: 'create', row: null })
                  }
                >
                  Tạo nội dung
                </Button>
              )
            }
          />
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <>
            <AdminContentTable
              rows={rows}
              sessionUserId={sessionUserId}
              onEdit={(row) => setEditorState({ open: true, type: row.type, mode: 'edit', row })}
              onDelete={setDeleteTarget}
              onSubmit={handleSubmitForReview}
              onShowHistory={setHistoryTarget}
              busy={busy}
            />
            <div className="pt-2">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </CardContent>

      <AdminContentEditorDialog
        open={editorState.open}
        type={editorState.type}
        mode={editorState.mode}
        initial={editorState.row}
        onOpenChange={(open) => setEditorState((state) => ({ ...state, open }))}
        onTypeChange={(type) => setEditorState((state) => ({ ...state, type }))}
      />
      <AdminContentDeleteDialog
        row={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
      <AdminContentHistoryDialog
        row={historyTarget}
        onOpenChange={(open) => !open && setHistoryTarget(null)}
      />
    </Card>
  );
}
