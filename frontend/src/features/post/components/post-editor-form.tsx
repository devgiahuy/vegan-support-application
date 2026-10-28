'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  Edit3,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  Send,
  Save,
  Tag,
  X,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SafeImage } from '@/components/shared/safe-image';
import { CategoryType, PostStatus, UserRole } from '@/common/enums';
import { useAuthStore } from '@/store/useAuthStore';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { flattenCategories } from '@/features/category/utils/flatten-categories';
import { ImageUploader } from './image-uploader';
import type { Post, DietSchool, Article } from '../types/post.model';
import { useCreateArticleMutation, useUpdateArticleMutation } from '../queries/post.queries';
import { addTrackedUserPost } from '../utils/user-posts-tracker';

const CATEGORIES = [
  'Sức khỏe & Dinh dưỡng',
  'Kinh nghiệm ăn chay',
  'Mẹo nhà bếp',
  'Lối sống xanh',
  'Văn hóa & Tinh thần',
];

const DIET_SCHOOLS: { value: DietSchool; label: string; desc: string }[] = [
  {
    value: 'THUAN_CHAY',
    label: 'Thuần chay (Vegan)',
    desc: '100% thực vật, không trứng sữa mật ong',
  },
  {
    value: 'PHAT_GIAO',
    label: 'Chay Phật giáo',
    desc: 'Kiêng Ngũ vị tân (hành, tỏi, kiệu, hẹ, nén)',
  },
  {
    value: 'DAO_GIAO',
    label: 'Chay Đạo giáo / Cao Đài',
    desc: 'Kiêng Ngũ vị tân và một số loại thực phẩm nhất định',
  },
  {
    value: 'ALL',
    label: 'Áp dụng cho mọi trường phái',
    desc: 'Thực đơn phù hợp cho tất cả người ăn chay',
  },
];

const COVER_PRESETS = [
  {
    label: 'Mâm cơm thuần chay thanh đạm',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  },
  {
    label: 'Rau củ quả tươi giàu vi chất',
    url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
  },
  {
    label: 'Bát súp nấm ấm cúng',
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  },
  {
    label: 'Hạt dinh dưỡng & ngũ cốc nguyên cám',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  },
  {
    label: 'Nghệ thuật trà đạo & hoa sen',
    url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80',
  },
  {
    label: 'Lối sống xanh & Thiền định',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  },
];

interface PostEditorFormProps {
  initialPost?: Post | Article;
  isEditing?: boolean;
}

export function PostEditorForm({ initialPost, isEditing = false }: PostEditorFormProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createArticleMutation = useCreateArticleMutation();
  const updateArticleMutation = useUpdateArticleMutation();

  const { data: categoryTree = [] } = useCategoryTreeQuery(CategoryType.CONTENT_TOPIC);
  const flatCategories = React.useMemo(() => flattenCategories(categoryTree), [categoryTree]);

  const [title, setTitle] = React.useState(initialPost?.title || '');
  const [summary, setSummary] = React.useState(() => {
    if (!initialPost) return '';
    if ('summary' in initialPost && initialPost.summary) return initialPost.summary;
    if ('excerpt' in initialPost && initialPost.excerpt) return initialPost.excerpt;
    return '';
  });
  const [category, setCategory] = React.useState(() => {
    if (!initialPost) return flatCategories[0]?.name || CATEGORIES[0];
    if ('category' in initialPost) {
      if (typeof initialPost.category === 'string') return initialPost.category;
      return initialPost.category?.name || CATEGORIES[0];
    }
    return CATEGORIES[0];
  });
  const [dietSchool, setDietSchool] = React.useState<DietSchool>(() => {
    if (initialPost && 'dietSchool' in initialPost && initialPost.dietSchool) {
      return initialPost.dietSchool;
    }
    return 'THUAN_CHAY';
  });
  const [coverImage, setCoverImage] = React.useState(() => {
    if (!initialPost) return COVER_PRESETS[0].url;
    if ('coverImage' in initialPost && initialPost.coverImage) return initialPost.coverImage;
    if ('coverImageUrl' in initialPost && initialPost.coverImageUrl)
      return initialPost.coverImageUrl;
    return COVER_PRESETS[0].url;
  });
  const [coverMedia, setCoverMedia] = React.useState<{
    assetId?: string;
    publicId?: string;
    mimeType?: string;
    bytes?: number;
  } | null>(() => {
    if (initialPost && 'coverMedia' in initialPost) return initialPost.coverMedia ?? null;
    return null;
  });
  const [content, setContent] = React.useState(() => {
    if (!initialPost) return '';
    if ('content' in initialPost && initialPost.content) return initialPost.content;
    if ('contentMarkdown' in initialPost && initialPost.contentMarkdown)
      return initialPost.contentMarkdown;
    return '';
  });
  const [tags, setTags] = React.useState<string[]>(initialPost?.tags || []);
  const [newTagInput, setNewTagInput] = React.useState('');

  // Quyền xuất bản lấy từ phiên đăng nhập thật:
  // Người đóng góp / Quản trị viên được xuất bản ngay, Thành viên phải chờ duyệt.
  const sessionUser = useAuthStore((s) => s.user);
  const canPublishDirectly =
    sessionUser?.role === UserRole.CONTRIBUTOR || sessionUser?.role === UserRole.ADMIN;

  // Tên tác giả hiển thị ở xem trước
  const previewAuthorName =
    (isEditing &&
      initialPost &&
      'author' in initialPost &&
      'name' in initialPost.author &&
      initialPost.author.name) ||
    sessionUser?.displayName ||
    'Tác giả VeggieConnect';

  const [activeTab, setActiveTab] = React.useState<'edit' | 'preview'>('edit');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Đếm từ & tính thời gian đọc ước tính
  const wordCount = React.useMemo(() => {
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  const readingMinutes = React.useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 160));
  }, [wordCount]);

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (actionType: 'DRAFT' | 'SUBMIT') => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('Vui lòng nhập tiêu đề bài viết!');
      return;
    }
    if (trimmedTitle.length < 5) {
      toast.error('Tiêu đề bài viết quá ngắn!', {
        description: 'Tiêu đề cần có ít nhất 5 ký tự.',
      });
      return;
    }
    if (trimmedTitle.length > 200) {
      toast.error('Tiêu đề bài viết quá dài!', {
        description: 'Tiêu đề không được vượt quá 200 ký tự.',
      });
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast.error('Vui lòng nhập nội dung bài viết!');
      return;
    }
    if (trimmedContent.length < 100) {
      toast.error('Nội dung bài viết quá ngắn!', {
        description: `Nội dung cần có ít nhất 100 ký tự để chia sẻ kiến thức hữu ích (hiện có ${trimmedContent.length}/100 ký tự). Hãy bổ sung thêm chi tiết chia sẻ nhé!`,
      });
      textareaRef.current?.focus();
      return;
    }

    let postStatus: PostStatus = PostStatus.PENDING_REVIEW;
    if (actionType === 'DRAFT') {
      postStatus = PostStatus.DRAFT;
    } else {
      postStatus = canPublishDirectly ? PostStatus.PUBLISHED : PostStatus.PENDING_REVIEW;
    }

    setIsSubmitting(true);
    try {
      const categoryId = flatCategories.find((c) => c.name === category)?.id || '';
      if (isEditing && initialPost) {
        await updateArticleMutation.mutateAsync({
          id: initialPost.id,
          article: {
            title: trimmedTitle,
            category: { id: categoryId, name: category },
            excerpt: summary.trim() || trimmedTitle,
            content: trimmedContent,
            coverImageUrl: coverImage,
            coverMedia,
            tags,
            status: postStatus,
            version:
              'version' in initialPost && typeof initialPost.version === 'number'
                ? initialPost.version
                : 1,
          },
        });

        toast.success(
          actionType === 'DRAFT'
            ? 'Đã cập nhật bản nháp bài viết!'
            : postStatus === 'PUBLISHED'
              ? 'Đã cập nhật và xuất bản bài viết thành công!'
              : 'Đã gửi cập nhật tới Chuyên gia Dinh dưỡng để kiểm duyệt!'
        );
        if (initialPost?.id && user?.id) {
          addTrackedUserPost(user.id, {
            id: initialPost.id,
            type: 'BLOG',
            title: trimmedTitle,
            createdAt: new Date().toISOString(),
          });
        }
        router.push(`/articles/${initialPost.id}`);
      } else {
        const res = await createArticleMutation.mutateAsync({
          title: trimmedTitle,
          category: { id: categoryId, name: category },
          excerpt: summary.trim() || trimmedTitle,
          content: trimmedContent,
          coverImageUrl: coverImage,
          coverMedia,
          tags,
          status: postStatus,
        });

        toast.success(
          actionType === 'DRAFT'
            ? 'Đã lưu bài viết vào Bản nháp!'
            : postStatus === 'PUBLISHED'
              ? '🎉 Bài viết đã được xuất bản công khai!'
              : '🎉 Bài viết đã gửi thành công! Đang chờ Chuyên gia Dinh dưỡng kiểm duyệt.'
        );

        const targetId = res?.id;
        if (targetId && user?.id) {
          addTrackedUserPost(user.id, {
            id: targetId,
            type: 'BLOG',
            title: trimmedTitle,
            createdAt: new Date().toISOString(),
          });
        }
        if (postStatus === 'PUBLISHED' && targetId) {
          router.push(`/articles/${targetId}`);
        } else {
          router.push('/articles');
        }
      }
    } catch {
      // Error handled by mutation toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile quick action bar (chỉ hiển thị trên màn hình nhỏ < lg) */}
      <div className="flex lg:hidden items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="secondary" className="text-[11px] rounded-full shrink-0">
            {sessionUser?.role === UserRole.ADMIN
              ? 'Admin'
              : sessionUser?.role === UserRole.CONTRIBUTOR
                ? 'Đóng góp'
                : 'Thành viên'}
          </Badge>
          <span className="text-xs text-muted-foreground truncate">
            {canPublishDirectly ? 'Xuất bản trực tiếp' : 'Chờ duyệt'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={() => handleSubmit('DRAFT')}
            className="h-8 text-xs rounded-xl px-2.5"
          >
            <Save className="h-3.5 w-3.5 mr-1" /> Lưu nháp
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSubmitting}
            onClick={() => handleSubmit('SUBMIT')}
            className="h-8 text-xs rounded-xl px-3 font-semibold shadow-xs"
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            {canPublishDirectly ? 'Xuất bản' : 'Gửi duyệt'}
          </Button>
        </div>
      </div>

      {/* Thông tin quyền xuất bản */}
      <Card className="border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-2xs">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {canPublishDirectly
                  ? 'Quyền tài khoản: Xuất bản bài viết trực tiếp'
                  : 'Quyền thành viên: Bài viết sẽ được kiểm duyệt'}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1 sm:line-clamp-none">
                {canPublishDirectly
                  ? 'Bài viết của bạn sẽ được hiển thị công khai ngay sau khi đăng.'
                  : 'Bài viết sẽ được chuyển vào hàng đợi kiểm duyệt của Chuyên gia Dinh dưỡng trước khi công khai.'}
              </p>
            </div>
          </div>

          <Badge variant="secondary" className="rounded-full text-xs shrink-0 font-medium">
            {sessionUser?.role === UserRole.ADMIN
              ? 'Quản trị viên'
              : sessionUser?.role === UserRole.CONTRIBUTOR
                ? 'Người đóng góp'
                : 'Thành viên'}
          </Badge>
        </CardContent>
      </Card>

      {/* Main Grid: 7 cols left, 5 cols right trên lg; 8/4 trên xl */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: Editor Area */}
        <div className="lg:col-span-7 xl:col-span-8 min-w-0 space-y-6">
          {/* Post Title */}
          <div className="space-y-2">
            <Label htmlFor="post-title" className="text-sm font-bold text-foreground">
              Tiêu đề bài viết <span className="text-destructive">*</span>
            </Label>
            <Input
              id="post-title"
              placeholder="VD: Cẩm nang ăn chay trường không lo thiếu máu và Vitamin B12..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 text-base font-semibold rounded-xl bg-card border-border/80"
            />
          </div>

          {/* Post Summary */}
          <div className="space-y-2">
            <Label htmlFor="post-summary" className="text-sm font-bold text-foreground">
              Đoạn trích tóm tắt ngắn (1-2 câu tóm lược nội dung chính)
            </Label>
            <Textarea
              id="post-summary"
              rows={2}
              placeholder="VD: Hướng dẫn kết hợp các loại hạt lên men và ngũ cốc để duy trì năng lượng bền bỉ..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="rounded-xl resize-none text-sm bg-card border-border/80"
            />
          </div>

          {/* Content Section (Chữ thường / văn bản thông thường) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Label
                  htmlFor="post-content"
                  className="text-sm font-bold text-foreground flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-primary" /> Nội dung bài viết{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nhập văn bản thông thường (tối thiểu 100 ký tự). Xuống dòng (Enter) để phân tách
                  các đoạn văn.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className={
                      content.trim().length < 100
                        ? 'font-semibold text-amber-600 dark:text-amber-400'
                        : 'font-semibold text-emerald-600 dark:text-emerald-400'
                    }
                  >
                    {content.trim().length}/100 ký tự
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-foreground">{wordCount}</strong> từ
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-primary font-medium">
                    <Clock className="h-3 w-3" /> ~{readingMinutes} phút đọc
                  </span>
                </div>

                {/* Edit vs Preview Toggle */}
                <div className="flex items-center gap-1 bg-muted/70 p-0.5 rounded-xl border border-border/60">
                  <Button
                    type="button"
                    size="sm"
                    variant={activeTab === 'edit' ? 'default' : 'ghost'}
                    className="h-7 text-xs rounded-lg px-2.5 gap-1.5"
                    onClick={() => setActiveTab('edit')}
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Soạn thảo
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={activeTab === 'preview' ? 'default' : 'ghost'}
                    className="h-7 text-xs rounded-lg px-2.5 gap-1.5"
                    onClick={() => setActiveTab('preview')}
                  >
                    <Eye className="h-3.5 w-3.5" /> Xem trước
                  </Button>
                </div>
              </div>
            </div>

            {activeTab === 'edit' ? (
              <Textarea
                id="post-content"
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Bắt đầu nhập nội dung bài chia sẻ của bạn tại đây... Hãy chia sẻ kinh nghiệm ăn chay, câu chuyện hoặc kiến thức dinh dưỡng với cộng đồng (xuống dòng để chia thành các đoạn văn riêng biệt)."
                rows={18}
                className="w-full rounded-2xl border border-border/80 p-4 sm:p-5 font-sans text-sm sm:text-base leading-relaxed resize-y focus-visible:ring-1 focus-visible:ring-primary shadow-2xs bg-card"
              />
            ) : (
              <div className="rounded-2xl border border-border/80 p-5 sm:p-6 bg-card min-h-[400px] max-h-[650px] overflow-y-auto space-y-4 shadow-2xs">
                <div>
                  <Badge variant="outline" className="mb-2 text-xs">
                    {category}
                  </Badge>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                    {title || 'Tiêu đề bài viết'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-2 pb-3 border-b border-border/60">
                    <span>
                      Tác giả: <strong className="text-foreground">{previewAuthorName}</strong>
                    </span>
                    <span>•</span>
                    <span>{readingMinutes} phút đọc</span>
                    <span>•</span>
                    <span>{wordCount} từ</span>
                  </div>
                </div>

                {summary && (
                  <p className="text-sm sm:text-base italic text-muted-foreground border-l-3 border-primary/60 pl-3 py-1 bg-muted/30 rounded-r-lg">
                    {summary}
                  </p>
                )}

                <div className="space-y-4 pt-2 text-sm sm:text-base text-foreground/90 leading-relaxed font-normal">
                  {content ? (
                    content.split(/\n{2,}/).map((paragraph, idx) => (
                      <p key={idx} className="leading-relaxed whitespace-pre-line">
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="text-muted-foreground italic text-sm">
                      Chưa có nội dung để xem trước...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (Sticky on desktop, responsive layout) */}
        <div className="lg:col-span-5 xl:col-span-4 min-w-0 space-y-6 lg:sticky lg:top-20">
          {/* Card 1: Thao tác xuất bản (Action Card) */}
          <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" /> Thao tác xuất bản
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0.5">
                  {sessionUser?.role === UserRole.ADMIN
                    ? 'Quản trị viên'
                    : sessionUser?.role === UserRole.CONTRIBUTOR
                      ? 'Người đóng góp'
                      : 'Thành viên'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {canPublishDirectly ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    Bài viết sẽ xuất bản công khai ngay lập tức.
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    Bài viết sẽ gửi tới Chuyên gia duyệt trước khi công khai.
                  </span>
                )}
              </p>

              <div className="space-y-2 pt-1">
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit('SUBMIT')}
                  className="w-full rounded-xl gap-2 font-bold h-10 shadow-xs"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting
                    ? 'Đang lưu bài viết...'
                    : canPublishDirectly
                      ? 'Xuất bản bài viết'
                      : 'Gửi chuyên gia duyệt bài'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit('DRAFT')}
                  className="w-full rounded-xl gap-2 text-xs h-9 text-muted-foreground hover:text-foreground"
                >
                  <Save className="h-3.5 w-3.5" /> Lưu bản nháp (DRAFT)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Ảnh bìa bài viết */}
          <Card className="rounded-2xl border-border/70 overflow-hidden shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" /> Ảnh bìa bài viết
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <ImageUploader
                value={coverImage}
                onChange={(url, meta) => {
                  setCoverImage(url);
                  setCoverMedia(
                    meta?.assetId || (meta?.publicId && meta?.mimeType && meta?.bytes)
                      ? {
                          assetId: meta?.assetId,
                          publicId: meta?.publicId,
                          mimeType: meta?.mimeType,
                          bytes: meta?.bytes,
                        }
                      : null
                  );
                }}
              />

              <div className="space-y-1.5 pt-1">
                <Label className="text-xs text-muted-foreground">
                  Hoặc chọn nhanh ảnh bìa có sẵn:
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {COVER_PRESETS.map((p, idx) => {
                    const isSelected = coverImage === p.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCoverImage(p.url);
                          setCoverMedia(null);
                        }}
                        title={p.label}
                        className={cn(
                          'group relative aspect-video w-full overflow-hidden rounded-xl border transition-all text-left focus:outline-hidden focus:ring-2 focus:ring-primary',
                          isSelected
                            ? 'border-primary ring-2 ring-primary shadow-xs'
                            : 'border-border/60 hover:border-primary/50 opacity-80 hover:opacity-100'
                        )}
                      >
                        <SafeImage
                          src={p.url}
                          fallbackSrc="/logo/logo-mark.png"
                          alt={p.label}
                          fill
                          sizes="120px"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-1.5">
                          <span className="text-[10px] text-white font-medium line-clamp-1 leading-tight drop-shadow-xs">
                            {p.label}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5 shadow-xs">
                            <CheckCircle2 className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Phân loại & Trường phái */}
          <Card className="rounded-2xl border-border/70 shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold">Phân loại &amp; Trường phái</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Chuyên mục cẩm nang</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-xl text-xs h-10 w-full min-w-0">
                    <SelectValue placeholder="Chọn chuyên mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {(flatCategories.length > 0
                      ? flatCategories.map((cat) => ({
                          id: cat.id,
                          value: cat.name,
                          label: `${cat.parentId ? '— ' : ''}${cat.name}`,
                        }))
                      : CATEGORIES.map((c) => ({ id: c, value: c, label: c }))
                    ).map((cat) => (
                      <SelectItem key={cat.id} value={cat.value} className="text-xs">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Trường phái áp dụng (Chuẩn SRS VN)</Label>
                <Select
                  value={dietSchool}
                  onValueChange={(val) => setDietSchool(val as DietSchool)}
                >
                  <SelectTrigger className="rounded-xl text-xs h-10 w-full min-w-0">
                    <SelectValue placeholder="Chọn trường phái">
                      {DIET_SCHOOLS.find((ds) => ds.value === dietSchool)?.label ||
                        'Chọn trường phái'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-w-[340px]">
                    {DIET_SCHOOLS.map((ds) => (
                      <SelectItem key={ds.value} value={ds.value} className="text-xs py-2">
                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="font-semibold text-foreground">{ds.label}</span>
                          <span className="text-[11px] text-muted-foreground leading-snug">
                            {ds.desc}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" /> Thẻ chủ đề (Tags)
                </Label>
                <div className="flex flex-wrap gap-1.5 min-w-0">
                  {tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="gap-1 rounded-md text-xs py-0.5 px-2 bg-muted max-w-full"
                    >
                      <span className="truncate">#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-destructive transition-colors shrink-0"
                        aria-label={`Xóa thẻ ${t}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-1.5 mt-1">
                  <Input
                    placeholder="Thêm thẻ (vd: AnLanh)..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="h-8 text-xs rounded-lg min-w-0"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddTag}
                    className="h-8 px-2.5 rounded-lg text-xs shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
