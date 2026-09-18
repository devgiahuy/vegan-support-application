'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Clock,
  Eye,
  Bookmark,
  Share2,
  BadgeCheck,
  Sparkles,
  Home,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Tag,
  Lightbulb,
  AlertTriangle,
  Pencil,
  Trash2,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VoteControl } from '@/components/shared/vote-control';
import { SafeImage } from '@/components/shared/safe-image';
import { CommentSection } from '@/components/shared/comment-section';
import { CommunitySummary } from '@/features/community/components/community-summary';
import { VoteButton } from '@/features/community/components/vote-button';
import { ReportButton } from '@/components/shared/report-button';
import { ReportTargetKind } from '@/common/enums';
import { PostCard } from './post-card';
import { DeletePostDialog } from './delete-post-dialog';
import type { Post, Article } from '../types/post.model';

interface PostDetailViewProps {
  post: Post | Article;
  relatedPosts: (Post | Article)[];
}

export function PostDetailView({ post, relatedPosts }: PostDetailViewProps) {
  const router = useRouter();
  // Tương tác vote/lưu giữ ở state local của component (API vote/bookmark chưa có).
  // Không dùng store toàn cục để tránh nhầm dữ liệu mẫu với dữ liệu thật.
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState<boolean>(
    ('saved' in post ? post.saved : false) ?? false
  );

  const ARTICLE_FALLBACK_COVER =
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop&q=80';
  const coverImage =
    ('coverImageUrl' in post ? post.coverImageUrl : post.coverImage) || ARTICLE_FALLBACK_COVER;
  const categoryName =
    typeof post.category === 'string'
      ? post.category
      : post.category?.name || 'Dinh dưỡng & Sức khỏe';
  const readingMinutes =
    ('readingTimeMinutes' in post ? post.readingTimeMinutes : post.readingMinutes) || 5;
  const publishedDate =
    ('formattedPublishedAt' in post ? post.formattedPublishedAt : post.publishedAt) || '';
  const summary = ('excerpt' in post ? post.excerpt : post.summary) || '';
  const contentMarkdown = ('content' in post ? post.content : post.contentMarkdown) || '';
  const authorAvatar = ('avatar' in post.author ? post.author.avatar : post.author.avatarUrl) || '';
  const authorRoleTitle =
    ('roleTitle' in post.author ? post.author.roleTitle : undefined) || 'Tác giả';
  const score = 'stats' in post ? post.stats.likes : post.score;
  const views = 'stats' in post ? post.stats.views : post.views;
  const isExpert = 'role' in post.author && post.author.role === 'NUTRITION_EXPERT';

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
    toast.success(
      !isSaved ? 'Đã lưu bài viết vào danh sách của bạn!' : 'Đã bỏ lưu bài viết khỏi danh sách.'
    );
  };

  const handleVoteChange = () => {
    toast.success('Đã ghi nhận đánh giá của bạn!');
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết bài viết vào bộ nhớ tạm!');
    }
  };

  const dietSchool = 'dietSchool' in post ? post.dietSchool : undefined;
  const dietSchoolLabel =
    dietSchool === 'PHAT_GIAO'
      ? 'Chay Phật giáo'
      : dietSchool === 'DAO_GIAO'
        ? 'Chay Đạo giáo'
        : 'Thuần chay';

  // Render markdown cơ bản thành các block UI bắt mắt
  const renderMarkdownContent = (md: string) => {
    return md.split('\n\n').map((block, idx) => {
      const trimmed = block.trim();
      if (trimmed.startsWith('## ')) {
        return (
          <h2
            key={idx}
            className="text-xl sm:text-2xl font-bold text-foreground mt-8 mb-3 scroll-mt-20 flex items-center gap-2"
          >
            <span className="h-2 w-2 rounded-full bg-primary" />
            {trimmed.replace(/^## /, '')}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-lg sm:text-xl font-semibold text-foreground mt-6 mb-2">
            {trimmed.replace(/^### /, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('> [!TIP]')) {
        return (
          <div
            key={idx}
            className="my-5 rounded-2xl border-l-4 border-emerald-500 bg-emerald-500/10 p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-1.5">
              <Lightbulb className="h-5 w-5" /> Lời Khuyên Dinh Dưỡng Từ Chuyên Gia
            </div>
            <p className="text-sm sm:text-base text-foreground leading-relaxed">
              {trimmed.replace(/^> \[!TIP\]\s*/, '').replace(/^> /gm, '')}
            </p>
          </div>
        );
      }
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote
            key={idx}
            className="my-6 border-l-4 border-primary pl-5 italic text-muted-foreground bg-primary/5 py-4 rounded-r-2xl font-medium text-base sm:text-lg"
          >
            {trimmed.replace(/^> /gm, '')}
          </blockquote>
        );
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n');
        return (
          <ul
            key={idx}
            className="list-disc list-inside space-y-2 my-4 text-base leading-relaxed text-muted-foreground pl-2"
          >
            {items.map((it, i) => {
              const text = it.replace(/^[-*]\s*/, '');
              // Hỗ trợ in đậm **...**
              const parts = text.split(/(\*\*.*?\*\*)/g);
              return (
                <li key={i}>
                  {parts.map((part, pIdx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return (
                        <strong key={pIdx} className="font-semibold text-foreground">
                          {part.slice(2, -2)}
                        </strong>
                      );
                    }
                    return part;
                  })}
                </li>
              );
            })}
          </ul>
        );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split('\n');
        return (
          <ol
            key={idx}
            className="list-decimal list-inside space-y-2 my-4 text-base leading-relaxed text-muted-foreground pl-2"
          >
            {items.map((it, i) => {
              const text = it.replace(/^\d+\.\s*/, '');
              const parts = text.split(/(\*\*.*?\*\*)/g);
              return (
                <li key={i}>
                  {parts.map((part, pIdx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return (
                        <strong key={pIdx} className="font-semibold text-foreground">
                          {part.slice(2, -2)}
                        </strong>
                      );
                    }
                    return part;
                  })}
                </li>
              );
            })}
          </ol>
        );
      }

      // Format bold text trong đoạn văn
      const parts = trimmed.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className="text-base sm:text-lg leading-relaxed text-muted-foreground my-4">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-foreground">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6 space-y-8">
      {/* Breadcrumbs Navigation */}
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/"
          className="inline-flex items-center gap-1 hover:text-primary transition-colors"
        >
          <Home className="h-4 w-4" /> Trang chủ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/articles" className="hover:text-primary transition-colors">
          Tin tức & Chia sẻ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground truncate max-w-xs sm:max-w-md">
          {post.title}
        </span>
      </nav>

      {/* Moderation Alert Banner if not PUBLISHED */}
      {post.status === 'PENDING' && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm space-y-0.5">
            <p className="font-bold">Bài viết đang chờ Chuyên gia Dinh dưỡng kiểm duyệt</p>
            <p className="text-xs opacity-90 leading-relaxed">
              Theo quy định kiểm chứng nội dung (SRS UC-02 & UC-11), bài viết của thành viên sẽ được
              Chuyên gia Dinh dưỡng xác thực vi chất và tính an toàn trước khi hiển thị công khai
              trên toàn hệ thống.
            </p>
          </div>
        </div>
      )}

      {post.status === 'FLAGGED' && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm space-y-0.5">
            <p className="font-bold">Bài viết cần chỉnh sửa theo yêu cầu của Chuyên gia</p>
            <p className="text-xs opacity-90 leading-relaxed">
              Lý do:{' '}
              {('moderationReason' in post ? post.moderationReason : undefined) ||
                'Vui lòng bổ sung đầy đủ định lượng và nguồn gốc thông tin.'}
            </p>
          </div>
        </div>
      )}

      {/* Article Header & Hero */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1">
            {categoryName}
          </Badge>
          <Badge variant="outline" className="border-primary/40 text-primary font-medium">
            {dietSchoolLabel}
          </Badge>
          {isExpert && (
            <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Đã kiểm chứng bởi Chuyên gia
            </Badge>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
          {post.title}
        </h1>

        <p className="text-base sm:text-xl text-muted-foreground leading-relaxed font-normal">
          {summary}
        </p>

        {/* Author Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/70">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={authorAvatar} alt={post.author.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {post.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-foreground">
                  {post.author.name}
                </span>
                {isExpert ? (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 text-[10px]"
                  >
                    <BadgeCheck className="h-3 w-3" /> {authorRoleTitle}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                    {authorRoleTitle}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                {publishedDate && (
                  <>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {publishedDate}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {readingMinutes} phút đọc
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> {views.toLocaleString()} lượt xem
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons (Bookmark, Share, Edit if author) */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleSave}
              className={cn(
                'rounded-full gap-1.5',
                isSaved && 'text-primary border-primary bg-primary/5'
              )}
            >
              <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current text-primary')} />
              <span>{isSaved ? 'Đã lưu' : 'Lưu bài'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="rounded-full gap-1.5"
            >
              <Share2 className="h-4 w-4" /> Chia sẻ
            </Button>

            <Button asChild variant="secondary" size="sm" className="rounded-full gap-1.5">
              <Link href={`/articles/${post.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" /> Sửa bài
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="rounded-full gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            >
              <Trash2 className="h-3.5 w-3.5" /> Xoá bài
            </Button>
          </div>
        </div>
      </header>

      {/* Featured Cover Image */}
      <div className="relative aspect-video sm:aspect-[21/9] w-full rounded-3xl overflow-hidden shadow-md border bg-muted">
        <SafeImage
          src={coverImage}
          fallbackSrc={ARTICLE_FALLBACK_COVER}
          alt={post.title}
          fill
          sizes="100vw"
          priority
          className="h-full w-full object-cover"
        />
      </div>

      {/* Main Body Layout (Content + Sticky Vote Control) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* LEFT COLUMN: Floating Vote Control on Desktop */}
        <div className="hidden lg:flex lg:col-span-1 flex-col items-center">
          <div className="sticky top-24 p-3 rounded-2xl border bg-card/80 backdrop-blur shadow-sm space-y-4 flex flex-col items-center">
            <VoteControl
              initialScore={score}
              orientation="vertical"
              size="lg"
              itemTitle={post.title}
              onVoteChange={handleVoteChange}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleSave}
              aria-label="Lưu bài viết"
              className={cn('h-10 w-10 rounded-full', isSaved && 'text-primary')}
            >
              <Bookmark className={cn('h-5 w-5', isSaved && 'fill-current')} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              aria-label="Chia sẻ bài viết"
              className="h-10 w-10 rounded-full"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* MIDDLE & MAIN CONTENT */}
        <article className="lg:col-span-11 space-y-6">
          {/* Mobile VoteControl banner */}
          <div className="flex lg:hidden items-center justify-between p-3 rounded-xl border bg-card">
            <span className="text-xs font-semibold text-muted-foreground">
              Đánh giá độ hữu ích:
            </span>
            <VoteControl
              initialScore={score}
              orientation="horizontal"
              size="sm"
              onVoteChange={handleVoteChange}
            />
          </div>

          {/* Article Markdown Body */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {renderMarkdownContent(contentMarkdown)}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="pt-6 border-t border-border/70 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> Chủ đề liên quan:
              </span>
              {post.tags.map((tag) => (
                <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                  <Badge
                    variant="secondary"
                    className="hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer rounded-lg"
                  >
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Author Box Card */}
          <Card className="rounded-3xl border-border/80 bg-gradient-to-br from-card to-primary/5 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-primary/30">
                <AvatarImage src={authorAvatar} alt={post.author.name} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {post.author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-bold text-foreground">{post.author.name}</h4>
                  <Badge className="bg-primary/10 text-primary text-xs">{authorRoleTitle}</Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {isExpert
                    ? 'Chuyên gia phụ trách thẩm định các bài viết dinh dưỡng, hướng dẫn ăn chay khoa học và kiểm soát nguy cơ thiếu vi chất theo khuyến nghị Viện Dinh Dưỡng.'
                    : 'Thành viên tâm huyết chia sẻ kinh nghiệm nấu món chay ngon, dinh dưỡng và gìn giữ văn hoá ẩm thực chay truyền thống.'}
                </p>
              </div>
            </div>
          </Card>

          {/* UC-03: Comment Section */}
          <div className="space-y-3 pt-8">
            <div className="flex flex-wrap items-center gap-2">
              <CommunitySummary postId={post.id} />
              <VoteButton postId={post.id} />
              <ReportButton
                targetKind={ReportTargetKind.POST}
                targetId={post.id}
                authorId={post.author.id}
              />
            </div>
            <CommentSection postId={post.id} itemType="bài viết" />
          </div>
        </article>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="pt-12 border-t border-border/80 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                Bài viết tin tức liên quan
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Khám phá thêm kiến thức dinh dưỡng và kinh nghiệm ăn chay cùng chuyên mục
              </p>
            </div>
            <Button asChild variant="ghost" className="gap-1 text-primary">
              <Link href="/articles">
                Xem tất cả <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.slice(0, 3).map((item) => (
              <PostCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      )}
      {/* Soft Delete Confirmation Modal */}
      <DeletePostDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        postId={post.id}
        postTitle={post.title}
        expectedVersion={
          'version' in post && typeof post.version === 'number' ? post.version : undefined
        }
        onSuccess={() => router.push('/articles')}
      />
    </div>
  );
}
