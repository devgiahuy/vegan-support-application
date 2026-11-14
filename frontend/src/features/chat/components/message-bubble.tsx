'use client';

import * as React from 'react';
import { User, Copy, Check, Sparkles, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChatMessageStatus, ChatRole } from '@/common/enums';
import type { ChatMessage } from '../types/chat.model';
import { ChatMarkdown } from './chat-markdown';

/**
 * Bong bóng tin nhắn người dùng / trợ lý:
 * - Trợ lý: render Markdown giàu biểu cảm, avatar VeggieConnect AI, nút copy, feedback like/dislike.
 * - Người dùng: bong bóng màu xanh thương hiệu bo góc tinh xảo.
 * - Hỗ trợ streaming text với con trỏ nhấp nháy mượt mà.
 */
export function MessageBubble({
  message,
  streamingText,
  actions,
}: {
  message: ChatMessage;
  streamingText?: string;
  actions?: (message: ChatMessage) => React.ReactNode;
}) {
  const isUser = message.role === ChatRole.USER;
  const isStreaming = message.status === ChatMessageStatus.STREAMING;
  const text = streamingText !== undefined ? streamingText : message.content;
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!text || copied) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Bỏ qua nếu clipboard bị chặn
    }
  };

  return (
    <div
      className={cn(
        'group flex w-full min-w-0 gap-2 py-2 sm:gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Assistant Avatar */}
      {!isUser && (
        <Avatar className="size-8 shrink-0 border border-emerald-500/20 shadow-xs">
          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white">
            <Sparkles className="size-4" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Content Container */}
      <div
        className={cn(
          'flex min-w-0 flex-col gap-2',
          isUser ? 'max-w-[85%] items-end' : 'w-full flex-1 items-start'
        )}
      >
        {/* Role Label */}
        <div className="flex items-center gap-2 px-1 text-[11px] font-medium text-muted-foreground">
          <span>{isUser ? 'Bạn' : 'Trợ lý Dinh dưỡng VeggieConnect'}</span>
        </div>

        {/* Bubble */}
        <div
          className={cn(
            'relative min-w-0 max-w-full text-sm',
            isUser
              ? 'rounded-2xl rounded-tr-xs bg-primary px-4 py-2.5 text-primary-foreground shadow-xs'
              : 'w-full rounded-2xl rounded-tl-xs border border-border/80 bg-card px-4 py-4 text-card-foreground sm:px-5 sm:py-5'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed [overflow-wrap:anywhere]">
              {text}
            </p>
          ) : (
            <div>
              {text.length > 0 ? (
                <ChatMarkdown content={text} />
              ) : (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles
                    aria-hidden="true"
                    className="size-4 text-emerald-500 motion-safe:animate-spin"
                  />
                  Đang suy nghĩ...
                </span>
              )}

              {/* Streaming Cursor */}
              {isStreaming && (
                <span
                  aria-hidden="true"
                  className="ml-1 inline-block h-4 w-1.5 translate-y-0.5 rounded-full bg-primary motion-safe:animate-pulse"
                />
              )}
            </div>
          )}

          {/* Fallback Notice for Assistant */}
          {!isUser && message.isFallback && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
              <ShieldAlert className="size-4 shrink-0 mt-0.5" />
              <span>
                Ghi chú: Đây là câu trả lời dự phòng do hệ thống AI trực tiếp đang quá tải hoặc gián
                đoạn kết nối.
              </span>
            </div>
          )}
        </div>

        {/* Toolbar under assistant bubble */}
        {!isUser && text.length > 0 && !isStreaming && (
          <div className="flex items-center gap-1.5 px-1 pt-0.5 opacity-90 transition-opacity group-hover:opacity-100">
            {/* Copy Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="size-7 rounded-md text-muted-foreground hover:text-foreground"
              aria-label={copied ? 'Đã sao chép' : 'Sao chép nội dung'}
              title={copied ? 'Đã sao chép' : 'Sao chép'}
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>

            {/* Actions (Feedback Buttons) */}
            {actions?.(message)}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <Avatar className="size-8 shrink-0 border border-primary/20 shadow-xs">
          <AvatarFallback className="bg-primary/10 text-primary">
            <User className="size-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
