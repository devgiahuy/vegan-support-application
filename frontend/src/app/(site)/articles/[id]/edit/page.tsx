'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  ChevronRight,
  Pencil,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AuthGuard } from '@/components/shared/auth-guard';
import { PostEditorForm } from '@/features/post/components/post-editor-form';
import { useArticleDetailQuery } from '@/features/post/queries/post.queries';

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  // Chỉ đọc Article chuẩn từ Query layer (DTO → Mapper → Model).
  // Không đọc Zustand ở đây: server-state do TanStack Query quản lý.
  const {
    data: article,
    isLoading: isQueryLoading,
    isError: isQueryError,
    refetch: refetchArticle,
  } = useArticleDetailQuery(id);

  return (
    <AuthGuard>
      {isQueryLoading ? (
        <div className="mx-auto max-w-6xl px-4 py-20 text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu bài viết...</p>
        </div>
      ) : isQueryError || !article ? (
        <div className="mx-auto max-w-xl py-20 px-4 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Không tìm thấy bài viết để chỉnh sửa
          </h2>
          <p className="text-sm text-muted-foreground">
            Bài viết có thể đã bị xoá hoặc bạn không có quyền truy cập.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button asChild className="rounded-full gap-2">
              <Link href="/articles">
                <ArrowLeft className="h-4 w-4" /> Quay lại Tin tức
              </Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => void refetchArticle()}
            >
              Thử lại
            </Button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6 space-y-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/"
              className="inline-flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Home className="h-4 w-4" /> Trang chủ
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/articles" className="hover:text-primary transition-colors">
              Tin tức
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href={`/articles/${article.id}`}
              className="hover:text-primary transition-colors truncate max-w-xs"
            >
              {article.title}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-primary">Chỉnh sửa</span>
          </nav>

          {/* Page Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
                <Pencil className="h-7 w-7 text-primary" /> Chỉnh Sửa Bài Viết
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Cập nhật nội dung, tiêu đề hoặc hình ảnh cho bài viết của bạn.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <Link href={`/articles/${article.id}`}>
                <ArrowLeft className="h-4 w-4" /> Huỷ &amp; Xem bài viết
              </Link>
            </Button>
          </div>

          {/* Revision Notice Alert */}
          <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="font-semibold text-sm">Lưu ý kiểm duyệt nội dung</AlertTitle>
            <AlertDescription className="text-xs leading-relaxed mt-1">
              Bài viết đã xuất bản nếu chỉnh sửa nội dung sẽ được chuyển sang trạng thái chờ Chuyên
              gia Dinh dưỡng duyệt lại trước khi cập nhật công khai.
            </AlertDescription>
          </Alert>

          {/* Editor Form */}
          <PostEditorForm initialPost={article} isEditing={true} />
        </div>
      )}
    </AuthGuard>
  );
}
