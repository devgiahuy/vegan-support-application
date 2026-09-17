import { cn } from '@/lib/utils';
import type { AppNotification } from '../types/notification.model';

/** 1 mục thông báo: loại + tóm tắt + thời gian + trạng thái đọc. */
export function NotificationItem({
  item,
  onOpen,
}: {
  item: AppNotification;
  onOpen: (item: AppNotification) => void;
}) {
  const content = (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted',
        !item.read && 'bg-primary/5'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-primary">{item.typeLabel}</span>
        {!item.read && <span className="size-1.5 rounded-full bg-primary" aria-label="Chưa đọc" />}
        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{item.timeAgo}</span>
      </div>
      <p className={cn('text-sm', !item.read ? 'font-semibold' : 'font-medium')}>{item.title}</p>
      {item.summary && <p className="line-clamp-2 text-xs text-muted-foreground">{item.summary}</p>}
    </div>
  );

  if (!item.link) return content;

  return (
    <button type="button" onClick={() => onOpen(item)} className="block w-full">
      {content}
    </button>
  );
}
