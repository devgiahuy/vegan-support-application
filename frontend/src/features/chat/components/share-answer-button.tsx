'use client';

import * as React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessageStatus, ChatRole } from '@/common/enums';
import type { ChatMessage } from '../types/chat.model';
import { ShareDialog } from './share-dialog';

/**
 * Nút Chia sẻ câu trả lời: chỉ message ASSISTANT + COMPLETE.
 * Thu hồi thực hiện trong dialog sau khi đã chia sẻ (giữ 1 nút duy nhất).
 */
export function ShareAnswerButton({ message }: { message: ChatMessage }) {
  const [open, setOpen] = React.useState(false);

  if (message.role !== ChatRole.ASSISTANT || message.status !== ChatMessageStatus.COMPLETE) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Chia sẻ câu trả lời công khai"
        onClick={() => setOpen(true)}
      >
        <Share2 className="size-4" />
      </Button>
      <ShareDialog message={message} open={open} onOpenChange={setOpen} />
    </>
  );
}
