'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostDetailView } from '@/features/post/components/post-detail-view';
import { usePostStore } from '@/store/usePostStore';

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const { posts } = usePostStore();

  const post = React.useMemo(() => {
    return posts.find((p) => p.id === id || p.slug === id);
  }, [posts, id]);

  const relatedPosts = React.useMemo(() => {
    if (!post) return [];
    return posts.filter((p) => p.id !== post.id && p.status === 'PUBLISHED');
  }, [posts, post]);

  if (!post) {
    return (
      <div className="mx-auto max-w-xl py-20 px-4 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Không tìm thấy bài viết</h2>
        <p className="text-sm text-muted-foreground">
          Bài viết có thể đã bị gỡ bỏ hoặc bạn đang nhập sai đường dẫn liên kết.
        </p>
        <div className="pt-2">
          <Button asChild className="rounded-full gap-2">
            <Link href="/bai-viet">
              <ArrowLeft className="h-4 w-4" /> Quay lại Cẩm nang
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <PostDetailView post={post} relatedPosts={relatedPosts} />;
}
