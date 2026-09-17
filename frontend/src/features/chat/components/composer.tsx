'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUp, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { chatComposerSchema, type ChatComposerFormValues } from '../schemas/chat.schema';

/**
 * Khung nhập câu hỏi hiện đại phong cách floating pill:
 * - Textarea tự động mở rộng chiều cao theo nội dung.
 * - Phím tắt Enter để gửi, Shift+Enter để xuống dòng.
 * - Nút Dừng/Gửi tích hợp gọn gàng bên trong.
 */
export function Composer({
  isStreaming,
  onSend,
  onAbort,
  placeholder = 'Hỏi về món chay, dinh dưỡng, thực đơn...',
  className,
}: {
  isStreaming: boolean;
  onSend: (content: string) => void;
  onAbort: () => void;
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const form = useForm<ChatComposerFormValues>({
    resolver: zodResolver(chatComposerSchema),
    defaultValues: { content: '' },
  });

  // Tự động điều chỉnh chiều cao textarea (1 dòng -> tối đa 160px)
  const adjustHeight = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  React.useEffect(() => {
    adjustHeight();
  }, [draft, adjustHeight]);

  const submit = (values: ChatComposerFormValues) => {
    if (isStreaming) return;
    const content = values.content.trim();
    if (!content) return;
    onSend(content);
    form.reset({ content: '' });
    setDraft('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void form.handleSubmit(submit)();
    }
  };

  const canSend = !isStreaming && draft.trim().length > 0;

  return (
    <form
      onSubmit={(e) => void form.handleSubmit(submit)(e)}
      className={cn('relative w-full', className)}
      noValidate
    >
      <div className="relative flex w-full items-end gap-2 rounded-2xl border border-border/80 bg-background/95 p-2 shadow-lg backdrop-blur-md transition-colors focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:bg-card/90">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            aria-label="Nhập câu hỏi cho trợ lý"
            placeholder={placeholder}
            rows={1}
            disabled={isStreaming}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              form.setValue('content', e.target.value, { shouldValidate: false });
            }}
            onKeyDown={handleKeyDown}
            className="w-full resize-none bg-transparent px-3 py-1.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ maxHeight: '160px', minHeight: '36px' }}
          />
        </div>

        {/* Nút gửi / dừng tích hợp */}
        <div className="shrink-0 pb-0.5 pr-0.5">
          {isStreaming ? (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={onAbort}
              className="size-8 rounded-xl shadow-xs transition-transform active:scale-95"
              aria-label="Dừng nhận câu trả lời"
              title="Dừng"
            >
              <Square className="size-4 fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!canSend}
              className={cn(
                'size-8 rounded-xl transition-all duration-200 shadow-xs',
                canSend
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
                  : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
              )}
              aria-label="Gửi câu hỏi"
              title="Gửi (Enter)"
            >
              <ArrowUp className="size-4 stroke-[2.5]" />
            </Button>
          )}
        </div>
      </div>

      {/* Hiển thị lỗi validate nếu có */}
      {form.formState.errors.content && (
        <p className="mt-1.5 px-3 text-xs text-destructive">
          {form.formState.errors.content.message}
        </p>
      )}

      {/* Gợi ý phím tắt */}
      <div className="mt-1.5 hidden items-center justify-between px-3 text-[11px] text-muted-foreground/60 sm:flex">
        <span>
          Nhấn <kbd className="rounded bg-muted px-1 font-mono text-[10px]">Enter</kbd> để gửi
        </span>
        <span>
          <kbd className="rounded bg-muted px-1 font-mono text-[10px]">Shift + Enter</kbd> xuống
          dòng
        </span>
      </div>
    </form>
  );
}
