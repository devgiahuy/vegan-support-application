'use client';

import * as React from 'react';
import { Search, RotateCcw, X, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { flattenCategories } from '@/features/category/utils/flatten-categories';
import { CatalogStatus } from '@/common/enums';
import {
  ADMIN_CONTENT_ALL_OPTION,
  ADMIN_CONTENT_FILTER_DISABLED_REASON,
  ADMIN_CONTENT_STATUS_OPTIONS,
  ADMIN_CONTENT_TYPE_OPTIONS,
} from '../types/admin-content.options';
import type { AdminContentListParams } from '../api/admin-content.api';
import type { AdminContentSource } from '../types/admin-content.model';

const ALL_VALUE = ADMIN_CONTENT_ALL_OPTION.value;

export interface AdminContentFilterState {
  type: string;
  categoryId: string;
  status: string;
  q: string;
}

export const INITIAL_FILTER_STATE: AdminContentFilterState = {
  type: ALL_VALUE,
  categoryId: ALL_VALUE,
  status: ALL_VALUE,
  q: '',
};

export function buildListParams(
  filters: AdminContentFilterState,
  page: number,
  limit: number
): AdminContentListParams {
  return {
    page,
    limit,
    type: filters.type !== ALL_VALUE ? (filters.type as AdminContentListParams['type']) : undefined,
    categoryId: filters.categoryId !== ALL_VALUE ? filters.categoryId : undefined,
    q: filters.q.trim() || undefined,
  };
}

export function hasActiveFilter(filters: AdminContentFilterState): boolean {
  return (
    filters.type !== ALL_VALUE ||
    filters.categoryId !== ALL_VALUE ||
    filters.status !== ALL_VALUE ||
    filters.q.trim().length > 0
  );
}

interface AdminContentFiltersProps {
  filters: AdminContentFilterState;
  onChange: (next: AdminContentFilterState) => void;
  onReset: () => void;
  /** `published-only` cho tới khi CG-01 `READY`; `admin-list` sau đó. */
  source: AdminContentSource;
}

/**
 * Bộ lọc của khu vực Quản lý nội dung.
 *
 * Chỉ render bộ lọc THỰC SỰ hoạt động. Ba bộ lọc Trạng thái / Tác giả /
 * Khoảng thời gian hiển thị ở trạng thái vô hiệu hoá **kèm lý do tiếng Việt** —
 * không được ẩn đi im lặng, và không được giả vờ lọc đang chạy (FR-003).
 */
export function AdminContentFilters({
  filters,
  onChange,
  onReset,
  source,
}: AdminContentFiltersProps) {
  const [keyword, setKeyword] = React.useState(filters.q);
  const debouncedKeyword = useDebounce(keyword, 400);
  const treeQuery = useCategoryTreeQuery();
  const categories = React.useMemo(() => flattenCategories(treeQuery.data ?? []), [treeQuery.data]);
  const isAdminList = source === 'admin-list';

  React.useEffect(() => {
    if (debouncedKeyword !== filters.q) {
      onChange({ ...filters, q: debouncedKeyword });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword]);

  // Đồng bộ lại khi filters.q bên ngoài thay đổi (ví dụ reset)
  React.useEffect(() => {
    setKeyword(filters.q);
  }, [filters.q]);

  const activeCount = [
    filters.type !== ALL_VALUE,
    filters.categoryId !== ALL_VALUE,
    filters.status !== ALL_VALUE,
    filters.q.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3.5 rounded-xl border border-border/70 bg-card/60 p-4 shadow-2xs backdrop-blur-xs">
      {/* Hàng bộ lọc chính: Tìm kiếm, Loại, Chuyên mục, Trạng thái */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Từ khoá */}
        <div className="space-y-1.5">
          <Label
            htmlFor="admin-content-keyword"
            className="text-xs font-semibold text-foreground/80"
          >
            Từ khoá
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="admin-content-keyword"
              className="pl-9 pr-8 text-sm"
              placeholder="Tên bài, slug, công thức..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            {keyword && (
              <button
                type="button"
                onClick={() => {
                  setKeyword('');
                  onChange({ ...filters, q: '' });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Xoá từ khoá tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Loại nội dung */}
        <div className="space-y-1.5">
          <Label htmlFor="admin-content-type" className="text-xs font-semibold text-foreground/80">
            Loại nội dung
          </Label>
          <Select
            value={filters.type}
            onValueChange={(value) => onChange({ ...filters, type: value })}
          >
            <SelectTrigger id="admin-content-type" className="text-sm">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tất cả loại</SelectItem>
              {ADMIN_CONTENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chuyên mục */}
        <div className="space-y-1.5">
          <Label
            htmlFor="admin-content-category"
            className="text-xs font-semibold text-foreground/80"
          >
            Chuyên mục
          </Label>
          <Select
            value={filters.categoryId}
            onValueChange={(value) => onChange({ ...filters, categoryId: value })}
          >
            <SelectTrigger id="admin-content-category" className="text-sm">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tất cả chuyên mục</SelectItem>
              {categories
                .filter((category) => category.status === CatalogStatus.ACTIVE)
                .map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Trạng thái (chỉ hoạt động khi admin-list READY theo FR-003) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="admin-content-status"
              className="text-xs font-semibold text-foreground/80"
            >
              Trạng thái
            </Label>
            {!isAdminList && (
              <span className="text-[10px] text-muted-foreground font-medium">Chờ CG-01</span>
            )}
          </div>
          <Select
            value={filters.status}
            onValueChange={(value) => onChange({ ...filters, status: value })}
            disabled={!isAdminList}
          >
            <SelectTrigger id="admin-content-status" className="text-sm disabled:opacity-60">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tất cả trạng thái</SelectItem>
              {ADMIN_CONTENT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hàng bộ lọc nâng cao (Tác giả, Khoảng thời gian) - tuân thủ FR-003 */}
      <div className="pt-2 border-t border-border/40">
        <fieldset
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 items-end"
          disabled={!isAdminList}
          aria-describedby={isAdminList ? undefined : 'admin-content-filter-pending'}
        >
          <legend className="sr-only">Bộ lọc nâng cao</legend>

          <div className="space-y-1.5">
            <Label htmlFor="admin-content-author" className="text-xs text-muted-foreground">
              Tác giả <span className="text-[10px]">(Chưa hỗ trợ)</span>
            </Label>
            <Input
              id="admin-content-author"
              placeholder="Chưa hỗ trợ"
              disabled
              readOnly
              className="text-xs disabled:opacity-50 h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-content-updated" className="text-xs text-muted-foreground">
              Cập nhật trong khoảng <span className="text-[10px]">(Chưa hỗ trợ)</span>
            </Label>
            <Input
              id="admin-content-updated"
              placeholder="Chưa hỗ trợ"
              disabled
              readOnly
              className="text-xs disabled:opacity-50 h-9"
            />
          </div>

          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setKeyword('');
                onReset();
              }}
              disabled={!hasActiveFilter(filters)}
              className="h-9 w-full sm:w-auto"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Xoá bộ lọc
              {activeCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                  {activeCount}
                </span>
              )}
            </Button>
          </div>
        </fieldset>

        {!isAdminList && (
          <p
            id="admin-content-filter-pending"
            className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground/80"
          >
            <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {ADMIN_CONTENT_FILTER_DISABLED_REASON}
          </p>
        )}
      </div>
    </div>
  );
}
