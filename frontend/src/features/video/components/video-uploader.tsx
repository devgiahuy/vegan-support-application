'use client';

import * as React from 'react';
import { UploadCloud, Video, Film, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { VideoSource } from '@/common/enums';
import { validateVideoFile } from '@/features/post/utils/media-validator';
import { uploadApi, toUploadedMeta, type UploadedMediaMeta } from '@/features/post/api/upload.api';
import { VideoPlayer } from './video-player';

interface VideoUploaderProps {
  value?: string;
  source?: VideoSource | string;
  onChange: (url: string, source: VideoSource, meta?: UploadedMediaMeta | null) => void;
  disabled?: boolean;
  className?: string;
}

export function VideoUploader({
  value = '',
  source = VideoSource.CLOUDINARY,
  onChange,
  disabled = false,
  className,
}: VideoUploaderProps) {
  const [activeTab, setActiveTab] = React.useState<string>(
    source === VideoSource.YOUTUBE || (value && value.includes('youtu')) ? 'youtube' : 'file'
  );
  const [youtubeInput, setYoutubeInput] = React.useState<string>(
    source === VideoSource.YOUTUBE ? value : ''
  );
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [uploadPercent, setUploadPercent] = React.useState<number>(0);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (file: File) => {
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      toast.error('Tệp video không hợp lệ', {
        description: validation.error,
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadPercent(0);

      const signatureData = await uploadApi.getUploadSignature({
        resourceType: 'video',
      });

      const res = await uploadApi.uploadToCloudinary(file, signatureData, (pct) => {
        setUploadPercent(pct);
      });

      onChange(res.secure_url || res.url, VideoSource.CLOUDINARY, toUploadedMeta(res, file.type));
      toast.success('Đã tải video lên thành công!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải video lên';
      toast.error('Lỗi khi tải video', {
        description: msg,
      });
    } finally {
      setIsUploading(false);
      setUploadPercent(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleYoutubeApply = () => {
    const trimmed = youtubeInput.trim();
    if (!trimmed) {
      toast.error('Vui lòng nhập đường dẫn video YouTube');
      return;
    }
    if (!trimmed.includes('youtube.com') && !trimmed.includes('youtu.be')) {
      toast.error('Đường dẫn không hợp lệ. Vui lòng nhập link YouTube chuẩn.');
      return;
    }
    onChange(trimmed, VideoSource.YOUTUBE);
    toast.success('Đã liên kết video YouTube thành công!');
  };

  const handleRemove = () => {
    onChange('', VideoSource.CLOUDINARY, null);
    setYoutubeInput('');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {value ? (
        <div className="space-y-3">
          <VideoPlayer videoUrl={value} videoSource={source} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground truncate max-w-md">
              Nguồn: {source === VideoSource.YOUTUBE ? 'YouTube' : 'Video máy chủ (Cloudinary)'} •{' '}
              {value}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={disabled || isUploading}
              className="rounded-xl gap-1.5 text-xs text-destructive hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" /> Gỡ bỏ video
            </Button>
          </div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="file" className="gap-2 text-xs">
              <Film className="h-4 w-4" /> Tải tệp video (MP4)
            </TabsTrigger>
            <TabsTrigger value="youtube" className="gap-2 text-xs">
              <Video className="h-4 w-4" /> Dán link YouTube
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="pt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              disabled={disabled || isUploading}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  void handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div
              onClick={() => {
                if (!disabled && !isUploading) fileInputRef.current?.click();
              }}
              className={cn(
                'flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-colors text-center border-border/80 hover:border-primary/50 hover:bg-muted/30',
                (disabled || isUploading) && 'pointer-events-none opacity-60'
              )}
            >
              {isUploading ? (
                <div className="w-full max-w-xs space-y-3 py-4">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs font-semibold text-foreground">
                    Đang xử lý tải video lên... {uploadPercent}%
                  </p>
                  <Progress value={uploadPercent} className="h-2" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Bấm vào đây để chọn tệp video từ máy
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Định dạng hỗ trợ: MP4, WebM • Dung lượng tối đa: 100MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="youtube" className="pt-3 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Dán đường dẫn YouTube (ví dụ: https://www.youtube.com/watch?v=...)"
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                disabled={disabled}
                className="h-11 rounded-xl"
              />
              <Button
                type="button"
                onClick={handleYoutubeApply}
                disabled={disabled || !youtubeInput.trim()}
                className="h-11 rounded-xl px-5"
              >
                Nhúng video
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Video YouTube sẽ được phát trong chế độ tối ưu bảo mật và hiển thị trực tiếp trên
              VeggieConnect.
            </p>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
