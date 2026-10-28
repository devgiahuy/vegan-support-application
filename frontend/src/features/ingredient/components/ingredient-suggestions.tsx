'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { useIngredientsQuery } from '../queries/ingredient.queries';
import type { Ingredient } from '../types/ingredient.model';

/** Shared canonical lookup for recipe entry and profile restrictions. */
export function IngredientSuggestions({
  query,
  onSelect,
  excludedIds = [],
}: {
  query: string;
  onSelect: (ingredient: Ingredient) => void;
  excludedIds?: string[];
}) {
  const search = query.trim();
  const debounced = useDebounce(search, 300);
  const [pagination, setPagination] = React.useState({ query: '', page: 1 });
  const page = pagination.query === debounced ? pagination.page : 1;
  const result = useIngredientsQuery({ ...(debounced ? { q: debounced } : {}), page, limit: 20 });
  if (search !== debounced || result.isPending) return <Skeleton className="h-24 w-full" />;
  if (result.isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Không tải được nguyên liệu chuẩn.{' '}
          <Button type="button" variant="link" onClick={() => void result.refetch()}>
            Thử lại
          </Button>
        </AlertDescription>
      </Alert>
    );
  const candidates = result.data?.items.filter((item) => !excludedIds.includes(item.id)) ?? [];
  return (
    <div className="flex flex-col gap-2">
      <div className="max-h-72 overflow-y-auto overscroll-contain rounded-md border bg-background">
        <ul aria-label="Gợi ý nguyên liệu chuẩn" className="flex flex-col gap-1 p-2">
          {candidates.map((item) => (
            <li key={item.id}>
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full flex-col items-start whitespace-normal py-3 text-left"
                onClick={() => onSelect(item)}
              >
                <span>{item.canonicalName}</span>
                {item.aliases.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {item.aliases
                      .map((alias) => alias.alias)
                      .slice(0, 3)
                      .join(', ')}
                  </span>
                )}
              </Button>
            </li>
          ))}
          {!candidates.length && (
            <li className="p-2 text-sm text-muted-foreground">
              {result.data?.items.length
                ? 'Các nguyên liệu ở trang này đã được chọn.'
                : 'Không tìm thấy nguyên liệu chuẩn phù hợp. Thử tên hoặc tên gọi khác.'}
            </li>
          )}
        </ul>
      </div>
      {(result.data?.metadata.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPagination({ query: debounced, page: page - 1 })}
          >
            Trang trước nguyên liệu
          </Button>
          <span className="text-sm">
            {page}/{result.data?.metadata.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= (result.data?.metadata.totalPages ?? 1)}
            onClick={() => setPagination({ query: debounced, page: page + 1 })}
          >
            Trang sau nguyên liệu
          </Button>
        </div>
      )}
    </div>
  );
}
