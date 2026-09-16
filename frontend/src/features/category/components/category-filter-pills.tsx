'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Category } from '../types/category.model';
import { flattenCategories } from '../utils/flatten-categories';

interface CategoryFilterPillsProps {
  /** Cây danh mục (Model) — component tự trải phẳng cha + con. */
  items: Category[];
  /** Id đang chọn, `null` = tất cả. */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  allLabel?: string;
  className?: string;
}

/**
 * Filter pills danh mục chọn đơn cho trang listing.
 * Presentational: chỉ nhận Model, query/loading/error do parent quản lý.
 */
export function CategoryFilterPills({
  items,
  selectedId,
  onSelect,
  allLabel = 'Tất cả',
  className,
}: CategoryFilterPillsProps) {
  const flat = flattenCategories(items);

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <Badge
        variant={selectedId === null ? 'default' : 'secondary'}
        onClick={() => onSelect(null)}
        className="cursor-pointer rounded-lg px-2.5 py-1 text-xs transition-all"
      >
        {allLabel}
      </Badge>
      {flat.map((c) => (
        <Badge
          key={c.id}
          variant={selectedId === c.id ? 'default' : 'secondary'}
          onClick={() => onSelect(c.id)}
          title={c.typeLabel}
          className="cursor-pointer rounded-lg px-2.5 py-1 text-xs transition-all"
        >
          {c.name}
        </Badge>
      ))}
    </div>
  );
}
