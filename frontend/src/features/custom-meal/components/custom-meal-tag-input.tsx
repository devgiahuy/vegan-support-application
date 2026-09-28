'use client';

import React, { useState } from 'react';
import { X, Tag as TagIcon, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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

  const handleAddTag = (rawInput: string) => {
    setError(null);
    if (!rawInput.trim()) return;

    // Tách các thẻ nếu người dùng nhập dấu phẩy, chấm phẩy hoặc xuống dòng
    const tokens = rawInput
      .split(/[,;\n]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (tokens.length === 0) return;

    const newTags = [...tags];
    let errorMessage: string | null = null;

    for (const token of tokens) {
      const normalized = normalizeUserTag(token);
      if (!normalized) continue;

      if (!isValidUserTag(normalized)) {
        errorMessage =
          'Thẻ chỉ được chứa chữ cái, số, dấu cách, dấu gạch nối (-) hoặc gạch dưới (_)';
        continue;
      }

      if (newTags.includes(normalized)) {
        errorMessage = `Thẻ "${normalized}" đã tồn tại`;
        continue;
      }

      if (newTags.length >= MAX_TAGS_PER_MEAL) {
        errorMessage = `Mỗi món ăn chỉ được gắn tối đa ${MAX_TAGS_PER_MEAL} thẻ`;
        break;
      }

      newTags.push(normalized);
    }

    if (newTags.length !== tags.length) {
      onChange(newTags);
      setInputValue('');
    }

    if (errorMessage) {
      setError(errorMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent.isComposing) return;
      handleAddTag(inputValue);
    } else if (e.key === ',') {
      e.preventDefault();
      e.stopPropagation();
      handleAddTag(inputValue);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (disabled) return;
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const isFull = tags.length >= MAX_TAGS_PER_MEAL;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <TagIcon className="w-4 h-4 text-primary" />
          Thẻ phân loại cá nhân (User Tags)
        </Label>
        <span className="text-xs font-medium text-muted-foreground">
          {tags.length}/{MAX_TAGS_PER_MEAL} thẻ
        </span>
      </div>

      {/* Dòng nhập thẻ và nút Thêm */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder={
              isFull
                ? `Đã đạt giới hạn ${MAX_TAGS_PER_MEAL} thẻ`
                : 'Nhập thẻ (vd: bua_trua, nhanh_gon, shopee)...'
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
            disabled={disabled || isFull}
            className="h-10 text-sm bg-background"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="default"
          onClick={() => handleAddTag(inputValue)}
          disabled={disabled || !inputValue.trim() || isFull}
          className="h-10 text-sm gap-1.5 px-4 shrink-0 font-medium"
        >
          <Plus className="w-4 h-4" />
          Thêm thẻ
        </Button>
      </div>

      {/* Danh sách các thẻ đã thêm */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-normal bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
            >
              <span>#{tag}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-destructive focus:outline-none transition-colors ml-0.5 rounded-full p-0.5"
                  aria-label={`Xóa thẻ ${tag}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-destructive mt-1 font-medium">{error}</p>}

      <p className="text-xs text-muted-foreground leading-relaxed">
        * Thẻ được dùng để lọc và tìm kiếm nhanh; có thể nhấn <strong>Enter</strong>, dấu phẩy{' '}
        <strong>(,)</strong> hoặc bấm nút <strong>Thêm thẻ</strong>. Các thẻ như <code>shopee</code>{' '}
        chỉ là văn bản ghi chú nguồn mua cá nhân.
      </p>
    </div>
  );
};
