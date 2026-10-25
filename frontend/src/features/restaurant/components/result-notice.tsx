'use client';

import { AlertTriangle, ChevronDown, Info, MapPinOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { DiscoveryNotice } from '../types/restaurant.model';

export interface ResultNoticeProps {
  notices: DiscoveryNotice[];
  className?: string;
}

export function ResultNotice({ notices, className }: ResultNoticeProps) {
  const privacy = notices.find((notice) => notice.kind === 'PRIVACY');
  const sourceNotices = notices.filter((notice) => notice.kind !== 'PRIVACY');
  if (notices.length === 0) return null;
  const summary = sourceNotices.find((notice) => notice.tone === 'warning') ?? sourceNotices[0];
  const summaryLabels: Record<DiscoveryNotice['kind'], string> = {
    UNAVAILABLE: 'Một phần dữ liệu bản đồ chưa tải được',
    SUPPRESSED: 'Bộ lọc đang giới hạn nguồn kết quả',
    TRUNCATED: 'Kết quả có giới hạn từ nhà cung cấp',
    ATTRIBUTION: 'Thông tin nguồn dữ liệu và lưu ý',
    STALE: 'Một số thông tin có thể đã thay đổi',
    PRIVACY: 'Thông tin quyền riêng tư',
  };
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {summary && (
        <Collapsible className="group rounded-xl border bg-muted/30">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto min-h-11 w-full justify-between gap-3 whitespace-normal rounded-xl px-3 py-2 text-left"
              aria-label="Thông tin nguồn dữ liệu và lưu ý"
            >
              <span className="flex min-w-0 items-start gap-2">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-xs font-normal leading-relaxed">
                  {summaryLabels[summary.kind]}
                </span>
              </span>
              <ChevronDown
                className="size-4 shrink-0 group-data-[state=open]:rotate-180"
                aria-hidden="true"
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t px-3 py-3">
            <div className="flex flex-col gap-2" role="status">
              {notices.map((notice) => (
                <Alert key={notice.kind} className="rounded-xl border-0 bg-background">
                  {notice.tone === 'warning' ? (
                    <AlertTriangle aria-hidden="true" />
                  ) : (
                    <Info aria-hidden="true" />
                  )}
                  <AlertDescription>{notice.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
      {privacy && !summary && (
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <MapPinOff className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {privacy.message}
        </p>
      )}
    </div>
  );
}
