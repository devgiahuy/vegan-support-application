import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { AiArtifact } from '../types/ai-artifact.model';
import { VerificationBadge } from './verification-badge';

export function PublicArtifactCard({
  artifact,
  className,
}: {
  artifact: AiArtifact;
  className?: string;
}) {
  const formattedDate = artifact.createdAt
    ? new Date(artifact.createdAt).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <Card
      className={`flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-sm ${className || ''}`}
    >
      <CardHeader className="space-y-2.5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <Badge variant="outline" className="text-[11px] font-normal">
            {artifact.typeLabel}
          </Badge>
          <VerificationBadge verification={artifact.activeVerification} compact />
        </div>

        <CardTitle className="text-base font-semibold leading-snug tracking-tight">
          <Link
            href={`/assistant/public?share=${artifact.id}`}
            className="hover:text-primary transition-colors line-clamp-2"
          >
            {artifact.title}
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-3 text-xs leading-relaxed text-muted-foreground line-clamp-3">
        {artifact.summary || 'Bản ghi tri thức AI chia sẻ từ cộng đồng ăn chay VeggieConnect.'}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <User className="size-3 text-muted-foreground/70" />
          <span className="truncate max-w-[120px]">{artifact.author.name}</span>
          {formattedDate && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3 text-muted-foreground/70" />
                {formattedDate}
              </span>
            </>
          )}
        </div>

        <Link
          href={`/assistant/public?share=${artifact.id}`}
          className="flex items-center gap-1 text-primary hover:underline font-medium"
        >
          <span>Xem</span>
          <ArrowRight className="size-3" />
        </Link>
      </CardFooter>
    </Card>
  );
}
