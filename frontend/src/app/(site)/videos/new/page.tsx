'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Home, ChevronRight, Video, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuthGuard } from '@/components/shared/auth-guard';
import { CategoryType, VideoSource } from '@/common/enums';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { flattenCategories } from '@/features/category/utils/flatten-categories';
import { VideoUploader } from '@/features/video/components/video-uploader';
import { ImageUploader } from '@/features/post/components/image-uploader';
import { useCreateVideoMutation } from '@/features/video/queries/video.queries';
import { videoFormSchema, type VideoFormValues } from '@/features/video/schemas/video-form.schema';

export default function UploadVideoPage() {
  const router = useRouter();
  const createVideoMutation = useCreateVideoMutation();
  const { data: categoryTree = [] } = useCategoryTreeQuery(CategoryType.CONTENT_TOPIC);
  const flatCategories = React.useMemo(() => flattenCategories(categoryTree), [categoryTree]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VideoFormValues>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      title: '',
      categoryId: '',
      coverImageUrl: '',
      coverMedia: null,
      videoUrl: '',
      videoSource: VideoSource.CLOUDINARY,
      videoMedia: null,
      durationSeconds: 0,
      description: '',
    },
  });

  const videoUrl = watch('videoUrl');
  const videoSource = watch('videoSource');

  const onSubmit = async (values: VideoFormValues) => {
    try {
      const created = await createVideoMutation.mutateAsync({
        title: values.title,
        category: { id: values.categoryId, name: '' },
        coverImageUrl: values.coverImageUrl || '',
        coverMedia: values.coverMedia ?? null,
        videoUrl: values.videoUrl,
        videoSource: values.videoSource,
        videoMedia: values.videoMedia ?? null,
        durationSeconds: values.durationSeconds ?? 0,
        description: values.description ?? '',
      });
      if (created?.id) {
        router.push(`/videos/${created.id}`);
      } else {
        router.push('/videos');
      }
    } catch {
      // Toast lỗi đã xử lý trong mutation onError
    }
  };

  return (
    <AuthGuard>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/"
            className="inline-flex items-center gap-1 transition-colors hover:text-primary"
          >
            <Home className="h-4 w-4" /> Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/videos" className="transition-colors hover:text-primary">
            Video nấu ăn
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-primary">Đăng video mới</span>
        </nav>

        <div className="flex flex-col justify-between gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-foreground sm:text-3xl">
              <Video className="h-7 w-7 text-primary" /> Đăng Video Hướng Dẫn Nấu Chay
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tải lên tệp MP4/WebM tối đa 100MB hoặc nhúng link YouTube. Video của thành viên sẽ vào
              hàng chờ duyệt trước khi xuất bản.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Link href="/videos">
              <ArrowLeft className="h-4 w-4" /> Huỷ bỏ &amp; Quay lại
            </Link>
          </Button>
        </div>

        <form onSubmit={void handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold text-foreground">
                Tệp video (MP4 / WebM, tối đa 100MB)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-5">
              <Controller
                control={control}
                name="videoUrl"
                render={() => (
                  <VideoUploader
                    value={videoUrl}
                    source={videoSource}
                    disabled={createVideoMutation.isPending}
                    onChange={(url, source, meta) => {
                      setValue('videoUrl', url, { shouldValidate: true });
                      setValue('videoSource', source, { shouldValidate: true });
                      setValue(
                        'videoMedia',
                        meta?.publicId && meta?.mimeType && meta?.bytes
                          ? { publicId: meta.publicId, mimeType: meta.mimeType, bytes: meta.bytes }
                          : null,
                        { shouldValidate: true }
                      );
                      if (typeof meta?.durationSeconds === 'number') {
                        setValue('durationSeconds', meta.durationSeconds, { shouldValidate: true });
                      }
                    }}
                  />
                )}
              />
              {errors.videoUrl && (
                <p className="text-xs font-medium text-destructive">{errors.videoUrl.message}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold text-foreground">
                Thông tin video &amp; món ăn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="font-semibold">
                  Tiêu đề video *
                </Label>
                <Input
                  id="title"
                  placeholder="Ví dụ: Bí quyết nấu bún bò Huế chay nước dùng thanh ngọt..."
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-xs font-medium text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Danh mục *</Label>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn danh mục cho video" />
                      </SelectTrigger>
                      <SelectContent>
                        {flatCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id} className="text-xs">
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Ảnh bìa video</Label>
                <Controller
                  control={control}
                  name="coverImageUrl"
                  render={({ field }) => (
                    <ImageUploader
                      value={field.value || null}
                      disabled={createVideoMutation.isPending}
                      onChange={(url, meta) => {
                        setValue('coverImageUrl', url, { shouldValidate: true });
                        setValue(
                          'coverMedia',
                          meta?.publicId && meta?.mimeType && meta?.bytes
                            ? {
                                publicId: meta.publicId,
                                mimeType: meta.mimeType,
                                bytes: meta.bytes,
                              }
                            : null,
                          { shouldValidate: true }
                        );
                      }}
                    />
                  )}
                />
                {errors.coverImageUrl && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.coverImageUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="font-semibold">
                  Mô tả &amp; hướng dẫn sơ lược
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Giới thiệu món ăn, mẹo nấu hoặc nguyên liệu đặc biệt..."
                  className="resize-none"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <Button
                  type="submit"
                  disabled={createVideoMutation.isPending}
                  className="w-full gap-2 text-sm font-semibold shadow-md"
                >
                  {createVideoMutation.isPending ? 'Đang gửi video...' : 'Đăng tải video'}
                </Button>
                <p className="mt-2 text-center text-[11px] italic text-muted-foreground">
                  Video sau khi đăng sẽ tuân thủ quy tắc kiểm duyệt nội dung cộng đồng.
                </p>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AuthGuard>
  );
}
