'use client';

import React from 'react';
import { Tag as TagIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { UserTagItem } from '../types/custom-meal.model';

interface CustomMealTagFilterBarProps {
  availableTags: UserTagItem[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  totalCount?: number;
}

export const CustomMealTagFilterBar: React.FC<CustomMealTagFilterBarProps> = ({
  availableTags,
  selectedTag,
  onSelectTag,
  totalCount,
}) => {
  if (availableTags.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 pr-1">
        <TagIcon className="w-3.5 h-3.5 text-muted-foreground" />
        <span>Lọc thẻ:</span>
      </div>

      <Badge
        variant={selectedTag === null ? 'default' : 'outline'}
        onClick={() => onSelectTag(null)}
        className="cursor-pointer shrink-0 text-xs px-2.5 py-1 transition-colors hover:opacity-90"
      >
        Tất cả {totalCount !== undefined ? `(${totalCount})` : ''}
      </Badge>

      {availableTags.map((tag) => {
        const isSelected = selectedTag === tag.name;
        return (
          <Badge
            key={tag.name}
            variant={isSelected ? 'default' : 'outline'}
            onClick={() => onSelectTag(isSelected ? null : tag.name)}
            className="cursor-pointer shrink-0 text-xs px-2.5 py-1 transition-colors hover:opacity-90"
          >
            #{tag.name} ({tag.count})
          </Badge>
        );
      })}
    </div>
  );
};
