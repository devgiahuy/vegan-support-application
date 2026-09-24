'use client';

import React, { useState } from 'react';
import { X, Tag as TagIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MAX_TAG_LENGTH,
  MAX_TAGS_PER_MEAL,
  isValidUserTag,
  normalizeUserTag,
} from '../utils/tag-normalizer';

interface CustomMealTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export const CustomMealTagInput: React.FC<CustomMealTagInputProps> = ({
  tags,
  onChange,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = (tagToAdd: string) => {
    setError(null);
    const normalized = normalizeUserTag(tagToAdd);

    if (!normalized) return;

    if (!isValidUserTag(normalized)) {
      setError('Thẻ chỉ được chứa chữ cái, số, dấu cách hoặc dấu gạch nối');
      return;
    }

    if (tags.includes(normalized)) {
      setError('Thẻ này đã tồn tại trong món ăn');
      return;
    }

    if (tags.length >= MAX_TAGS_PER_MEAL) {
      setError(`Mỗi món ăn chỉ được gắn tối đa ${MAX_TAGS_PER_MEAL} thẻ`);
      return;
    }

    onChange([...tags, normalized]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (disabled) return;
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1.5 text-foreground">
          <TagIcon className="w-3.5 h-3.5 text-primary" />
          Thẻ phân loại cá nhân (User Tags)
        </Label>
        <span className="text-xs text-muted-foreground">
          {tags.length}/{MAX_TAGS_PER_MEAL} thẻ
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 rounded-lg border bg-background/50 border-input focus-within:ring-2 focus-within:ring-primary/20">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-normal bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
          >
            <span>#{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-destructive focus:outline-none transition-colors"
                aria-label={`Xóa thẻ ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}

        {tags.length < MAX_TAGS_PER_MEAL && !disabled && (
          <Input
            type="text"
            placeholder={
              tags.length === 0 ? 'Nhập thẻ rồi nhấn Enter (vd: món nhanh, shopee)' : 'Thêm thẻ...'
            }
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) {
                handleAddTag(inputValue);
              }
            }}
            maxLength={MAX_TAG_LENGTH}
            disabled={disabled}
            className="border-0 shadow-none focus-visible:ring-0 p-0 h-7 text-xs flex-1 min-w-[140px] bg-transparent"
          />
        )}
      </div>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}

      <p className="text-xs text-muted-foreground">
        * Thẻ được dùng để lọc và tìm kiếm nhanh; các thẻ như <code>shopee</code> chỉ là văn bản ghi
        chú nguồn mua cá nhân.
      </p>
    </div>
  );
};
