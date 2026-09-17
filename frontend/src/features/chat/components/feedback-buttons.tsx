'use client';

import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChatMessageStatus, ChatRole, FeedbackValue } from '@/common/enums';
import type { ChatMessage } from '../types/chat.model';
import { useChatFeedbackMutation } from '../queries/chat.queries';

/**
 * Nút đánh giá hữu ích/không hữu ích cho câu trả lời đã hoàn tất.
 * Upsert — bấm lại để đổi lựa chọn.
 */
export function FeedbackButtons({
  message,
  sessionId,
}: {
  message: ChatMessage;
  sessionId: string;
}) {
  const feedbackMutation = useChatFeedbackMutation();

  if (message.role !== ChatRole.ASSISTANT || message.status !== ChatMessageStatus.COMPLETE) {
    return null;
  }

  const send = (value: FeedbackValue) => {
    if (feedbackMutation.isPending) return;
    feedbackMutation.mutate({ messageId: message.id, sessionId, value });
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Câu trả lời hữu ích"
        aria-pressed={message.feedback === FeedbackValue.UP}
        onClick={() => send(FeedbackValue.UP)}
        className={cn(message.feedback === FeedbackValue.UP && 'text-primary')}
      >
        <ThumbsUp className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Câu trả lời chưa hữu ích"
        aria-pressed={message.feedback === FeedbackValue.DOWN}
        onClick={() => send(FeedbackValue.DOWN)}
        className={cn(message.feedback === FeedbackValue.DOWN && 'text-primary')}
      >
        <ThumbsDown className="size-4" />
      </Button>
    </div>
  );
}
