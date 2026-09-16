'use client';

import { Checkbox } from '@/components/ui/checkbox';
import type { Category } from '../types/category.model';

interface CategoryFilterListProps {
  /** Cây danh mục (Model) — component tự render 2 tầng cha/con. */
  items: Category[];
  /** Id các node đang chọn. */
  selectedIds: string[];
  onToggle: (id: string) => void;
}

/**
 * Filter checkbox danh mục 2 tầng cho sidebar.
 * Presentational: chỉ nhận Model, query/loading/error do parent quản lý.
 */
export function CategoryFilterList({ items, selectedIds, onToggle }: CategoryFilterListProps) {
  return (
    <ul className="space-y-2">
      {items.map((parent) => (
        <li key={parent.id}>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={selectedIds.includes(parent.id)}
              onCheckedChange={() => onToggle(parent.id)}
            />
            <span className="font-medium">{parent.name}</span>
          </label>
          {parent.children.length > 0 && (
            <ul className="ml-6 mt-2 space-y-2 border-l border-border pl-3">
              {parent.children.map((child) => (
                <li key={child.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      checked={selectedIds.includes(child.id)}
                      onCheckedChange={() => onToggle(child.id)}
                    />
                    {child.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
