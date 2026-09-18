'use client';

import * as React from 'react';
import Link from 'next/link';
import { Home, ChevronRight, PenSquare, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostEditorForm } from '@/features/post/components/post-editor-form';
import { AuthGuard } from '@/components/shared/auth-guard';

export default function CreatePostPage() {
  return (
    <AuthGuard>
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
            Tin tức &amp; Chia sẻ
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-primary">Tạo bài viết mới</span>
        </nav>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
              <PenSquare className="h-7 w-7 text-primary" /> Soạn Thảo Bài Viết Chia Sẻ
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Chia sẻ kinh nghiệm ăn chay, mẹo nấu nướng hoặc kiến thức dinh dưỡng với cộng đồng
              VeggieConnect.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Link href="/articles">
              <ArrowLeft className="h-4 w-4" /> Huỷ bỏ &amp; Quay lại
            </Link>
          </Button>
        </div>

        {/* Editor Form */}
        <PostEditorForm isEditing={false} />
      </div>
    </AuthGuard>
  );
}
