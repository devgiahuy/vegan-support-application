'use client';

import Link from 'next/link';
import { ChevronRight, FolderTree } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/empty-state';
import type { Category } from '../types/category.model';
import { CategoryType } from '@/common/enums';

const TYPE_OPTIONS: Array<{ value: CategoryType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Tất cả loại' },
  { value: CategoryType.FOOD_TYPE, label: 'Loại thực phẩm' },
  { value: CategoryType.RECIPE_GROUP, label: 'Nhóm công thức' },
  { value: CategoryType.CONTENT_TOPIC, label: 'Chủ đề nội dung' },
];

/**
 * Cây danh mục 2 tầng (cha + con). Component thuần hiển thị:
 * query và filter do parent quản lý qua `type`/`onTypeChange`.
 */
export function CategoryTree({
  tree,
  type,
  onTypeChange,
}: {
  tree: Category[];
  type: CategoryType | 'ALL';
  onTypeChange: (type: CategoryType | 'ALL') => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <FolderTree className="h-4 w-4 text-primary" />
          Danh mục ({tree.length})
        </p>
        <div className="flex items-center gap-2">
          <Label htmlFor="category-type" className="sr-only">
            Lọc theo loại
          </Label>
          <Select value={type} onValueChange={(v) => onTypeChange(v as CategoryType | 'ALL')}>
            <SelectTrigger id="category-type" className="w-48">
              <SelectValue placeholder="Lọc theo loại" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {tree.length === 0 ? (
        <EmptyState
          title="Chưa có danh mục nào."
          description="Hiện chưa có danh mục thuộc loại này. Hãy thử loại khác."
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {tree.map((parent) => (
            <li key={parent.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{parent.name}</p>
                <span className="text-xs text-muted-foreground">{parent.typeLabel}</span>
              </div>
              {parent.children.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {parent.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/categories?type=${parent.type}#${child.slug}`}
                        className="group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">Chưa có danh mục con.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
