'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AiArtifactType } from '@/common/enums';
import { useAuthStore } from '@/store/useAuthStore';
import { SaveArtifactDialog } from './save-artifact-dialog';
import { ShareArtifactDialog } from './share-artifact-dialog';
import type { AiArtifact } from '../types/ai-artifact.model';

export function SaveArtifactButton({
  type,
  sourceId,
  defaultTitle,
  defaultSummary,
  variant = 'ghost',
  size = 'sm',
  className,
  showLabel = true,
}: {
  type: AiArtifactType;
  sourceId: string;
  defaultTitle?: string;
  defaultSummary?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
  showLabel?: boolean;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [savedArtifact, setSavedArtifact] = React.useState<AiArtifact | null>(null);

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để lưu và chia sẻ tri thức AI.');
      router.push('/login');
      return;
    }
    setSaveOpen(true);
  };

  const handleSaved = (artifact: AiArtifact) => {
    setSavedArtifact(artifact);
    setShareOpen(true);
  };

  return (
    <>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={variant}
              size={size}
              className={`gap-1.5 ${className || ''}`}
              onClick={handleClick}
              aria-label="Lưu thành Tri thức AI"
            >
              <Bookmark className="size-4 text-primary" />
              {showLabel && <span>Lưu tri thức AI</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Lưu bản chụp bất biến để xem lại hoặc chia sẻ cho cộng đồng</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <SaveArtifactDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        type={type}
        sourceId={sourceId}
        defaultTitle={defaultTitle}
        defaultSummary={defaultSummary}
        onSuccessSaved={handleSaved}
      />

      {savedArtifact && (
        <ShareArtifactDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          artifact={savedArtifact}
        />
      )}
    </>
  );
}
