'use client';

import * as React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationsQuery, useUnreadCount } from '../queries/notification.queries';
import { NotificationPanel } from './notification-panel';

/**
 * Chuông header: badge capped + dropdown panel. Chỉ member (guest trả null,
 * không bắn request — query đã gate `enabled: isAuthenticated`).
 */
export function NotificationBell() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [open, setOpen] = React.useState(false);
  const { isLoading } = useNotificationsQuery();
  const unread = useUnreadCount();

  if (!isAuthenticated) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={unread.count > 0 ? `Thông báo (${unread.count} chưa đọc)` : 'Thông báo'}
          className="relative hidden sm:inline-flex"
        >
          <Bell className="size-5" />
          {isLoading ? (
            <Skeleton className="absolute right-1 top-1 size-4 rounded-full" />
          ) : (
            unread.capped && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unread.capped}
              </span>
            )
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-90 p-3">
        <NotificationPanel onNavigate={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
