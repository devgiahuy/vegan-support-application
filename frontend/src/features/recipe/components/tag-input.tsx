'use client';

import * as React from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  className?: string;
  quickSuggestions?: string[];
  id?: string;
  'aria-describedby'?: string;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Nhập tên nguyên liệu rồi nhấn Enter...',
  maxTags = 50,
  disabled = false,
  className,
  quickSuggestions,
  id,
  'aria-describedby': ariaDescribedBy,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addTag = (tagText: string) => {
    const trimmed = tagText.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) return;
    if (value.length >= maxTags) return;

    onChange([...value, trimmed]);
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    if (disabled) return;
    onChange(value.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      e.preventDefault();
      removeTag(value.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex min-h-12 w-full flex-wrap items-center gap-2 rounded-xl border border-input bg-background p-2.5 text-sm ring-offset-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        {value.map((tag, index) => (
          <Badge
            key={`${tag}-${index}`}
            variant="secondary"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-foreground bg-secondary/80 hover:bg-secondary transition-colors"
          >
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={`Xóa ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}

        {value.length < maxTags && (
          <input
            ref={inputRef}
            id={id}
            aria-describedby={ariaDescribedBy}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) {
                addTag(inputValue);
              }
            }}
            placeholder={value.length === 0 ? placeholder : 'Thêm tiếp...'}
            disabled={disabled}
            className="flex-1 min-w-[140px] bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
          />
        )}
      </div>

      {/* Quick suggestions pills */}
      {quickSuggestions && quickSuggestions.length > 0 && !disabled && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">Gợi ý nhanh:</span>
          {quickSuggestions
            .filter((s) => !value.includes(s))
            .slice(0, 8)
            .map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => addTag(item)}
                className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <Plus className="h-3 w-3" /> {item}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
