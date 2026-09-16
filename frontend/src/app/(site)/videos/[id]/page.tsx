'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoDetailView } from '@/features/video/components/video-detail-view';
import { useVideoDetailQuery, useVideosQuery } from '@/features/video/queries/video.queries';

export default function VideoDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  const {
    data: video,
    isLoading: isVideoLoading,
    isError: isVideoError,
    refetch: refetchVideo,
  } = useVideoDetailQuery(id);

  const { data: videosPagination } = useVideosQuery({ limit: 4 });
  const relatedVideos = React.useMemo(() => {
    return (videosPagination?.items || []).filter((v) => v.id !== id);
  }, [videosPagination?.items, id]);

  if (isVideoLoading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-7xl flex-col items-center justify-center px-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Đang tải video hướng dẫn nấu chay...</p>
      </div>
    );
  }

  if (isVideoError || !video) {
    return (
      <div className="mx-auto max-w-xl py-20 px-4 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Không tìm thấy video</h2>
        <p className="text-sm text-muted-foreground">
          Video bạn đang tìm kiếm có thể đã bị gỡ bỏ hoặc bạn đang nhập sai đường dẫn.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button asChild variant="outline" className="rounded-xl gap-2">
            <Link href="/videos">
              <ArrowLeft className="h-4 w-4" /> Quay lại Kho Video
            </Link>
          </Button>
          <Button onClick={() => void refetchVideo()} className="rounded-xl">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return <VideoDetailView video={video} relatedVideos={relatedVideos} />;
}
