'use client';

import * as React from 'react';
import { Search, RotateCcw } from 'lucide-react';
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

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="admin-content-type">Loại nội dung</Label>
          <Select
            value={filters.type}
            onValueChange={(value) => onChange({ ...filters, type: value })}
          >
            <SelectTrigger id="admin-content-type">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tất cả</SelectItem>
              {ADMIN_CONTENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-content-category">Chuyên mục</Label>
          <Select
            value={filters.categoryId}
            onValueChange={(value) => onChange({ ...filters, categoryId: value })}
          >
            <SelectTrigger id="admin-content-category">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tất cả</SelectItem>
              {/* Chỉ chuyên mục đang hoạt động mới được dùng để gán cho nội dung. */}
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

        <div className="space-y-1.5">
          <Label htmlFor="admin-content-keyword">Từ khoá</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="admin-content-keyword"
              className="pl-9"
              placeholder="Không phân biệt dấu tiếng Việt"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
        </div>
      </div>

      <fieldset
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        disabled={!isAdminList}
        aria-describedby={isAdminList ? undefined : 'admin-content-filter-pending'}
      >
        <legend className="sr-only">Bộ lọc nâng cao</legend>
        <div className="space-y-1.5">
          <Label htmlFor="admin-content-status">Trạng thái</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => onChange({ ...filters, status: value })}
          >
            <SelectTrigger id="admin-content-status">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tất cả</SelectItem>
              {ADMIN_CONTENT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-content-author">Tác giả</Label>
          <Input id="admin-content-author" placeholder="Chưa hỗ trợ" disabled readOnly />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-content-updated">Cập nhật trong khoảng</Label>
          <Input id="admin-content-updated" placeholder="Chưa hỗ trợ" disabled readOnly />
        </div>
      </fieldset>

      {!isAdminList && (
        <p id="admin-content-filter-pending" className="text-xs text-muted-foreground">
          {ADMIN_CONTENT_FILTER_DISABLED_REASON}
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setKeyword('');
          onReset();
        }}
        disabled={!hasActiveFilter(filters)}
      >
        <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
        Xoá bộ lọc
      </Button>
    </div>
  );
}
