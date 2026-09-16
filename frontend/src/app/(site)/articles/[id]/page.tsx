'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostDetailView } from '@/features/post/components/post-detail-view';
import { useArticleDetailQuery, useArticlesQuery } from '@/features/post/queries/post.queries';

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  const {
    data: article,
    isLoading: isArticleLoading,
    isError: isArticleError,
    refetch: refetchArticle,
  } = useArticleDetailQuery(id);

  const { data: articlesPagination } = useArticlesQuery({ limit: 4 });
  const relatedArticles = React.useMemo(() => {
    return (articlesPagination?.items || []).filter((a) => a.id !== id);
  }, [articlesPagination?.items, id]);

  if (isArticleLoading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-5xl flex-col items-center justify-center px-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Đang tải nội dung bài viết...</p>
      </div>
    );
  }

  if (isArticleError || !article) {
    return (
      <div className="mx-auto max-w-xl py-20 px-4 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Không tìm thấy bài viết</h2>
        <p className="text-sm text-muted-foreground">
          Bài viết có thể đã bị gỡ bỏ hoặc bạn đang nhập sai đường dẫn liên kết.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button asChild variant="outline" className="rounded-xl gap-2">
            <Link href="/articles">
              <ArrowLeft className="h-4 w-4" /> Quay lại Cẩm nang
            </Link>
          </Button>
          <Button onClick={() => void refetchArticle()} className="rounded-xl">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return <PostDetailView post={article} relatedPosts={relatedArticles} />;
}
