'use client';

import * as React from 'react';
import { User, Copy, Check, Sparkles, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChatMessageStatus, ChatRole } from '@/common/enums';
import type { ChatMessage } from '../types/chat.model';
import { ChatMarkdown } from './chat-markdown';
import { AssistantThinking } from './assistant-thinking';

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
    <div className={cn('group flex w-full gap-3 py-2', isUser ? 'justify-end' : 'justify-start')}>
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
          'flex flex-col gap-1.5 max-w-[88%] sm:max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Role Label */}
        <div className="flex items-center gap-2 px-1 text-[11px] font-medium text-muted-foreground">
          <span>{isUser ? 'Bạn' : 'Trợ lý Dinh dưỡng VeggieConnect'}</span>
        </div>

        {/* Bubble */}
        <div
          className={cn(
            'relative text-sm transition-colors duration-200',
            isUser
              ? 'rounded-2xl rounded-tr-xs bg-primary px-4 py-2.5 text-primary-foreground shadow-xs'
              : cn(
                  'rounded-2xl rounded-tl-xs border px-4 py-3.5 text-card-foreground shadow-xs',
                  text.length === 0
                    ? 'border-emerald-500/25 bg-gradient-to-br from-card via-card to-emerald-500/5 dark:bg-muted/30 dark:to-emerald-950/20'
                    : 'border-border/80 bg-card/80 dark:bg-muted/40'
                )
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
          ) : (
            <div>
              {text.length > 0 ? (
                <div className="relative">
                  <ChatMarkdown content={text} />
                  {/* Streaming Cursor */}
                  {isStreaming && (
                    <span
                      aria-hidden="true"
                      className="ml-1 inline-block h-3.5 w-1.5 -translate-y-0.5 animate-pulse rounded-full bg-emerald-500 align-middle shadow-[0_0_8px_rgba(16,185,129,0.5)] motion-reduce:animate-none"
                    />
                  )}
                </div>
              ) : (
                <AssistantThinking />
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
