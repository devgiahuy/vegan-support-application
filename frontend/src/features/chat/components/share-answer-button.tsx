'use client';

import * as React from 'react';
import { AiArtifactType, ChatMessageStatus, ChatRole } from '@/common/enums';
import { SaveArtifactButton } from '@/features/ai-artifacts';
import type { ChatMessage } from '../types/chat.model';

/**
 * Nút Lưu & Chia sẻ câu trả lời từ Trợ lý Chat sang AI Artifacts (Phase 23).
 * Chỉ hiển thị với tin nhắn ASSISTANT đã hoàn tất (COMPLETE).
 */
export function ShareAnswerButton({ message }: { message: ChatMessage }) {
  if (message.role !== ChatRole.ASSISTANT || message.status !== ChatMessageStatus.COMPLETE) {
    return null;
  }

  return (
    <SaveArtifactButton
      type={AiArtifactType.CHAT_ANSWER}
      sourceId={message.id}
      defaultTitle="Câu trả lời từ Trợ lý VeggieConnect"
      defaultSummary={message.content.slice(0, 150)}
      showLabel={false}
      size="icon"
      className="size-7 rounded-md text-muted-foreground hover:text-foreground"
    />
  );
}
