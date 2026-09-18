'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Lightbulb,
  Eye,
  Edit3,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  AlertTriangle,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryType, PostStatus, UserRole } from '@/common/enums';
import { useAuthStore } from '@/store/useAuthStore';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { flattenCategories } from '@/features/category/utils/flatten-categories';
import { ImageUploader } from './image-uploader';
import type { Post, DietSchool, Article } from '../types/post.model';
import { useCreateArticleMutation, useUpdateArticleMutation } from '../queries/post.queries';

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
  const createArticleMutation = useCreateArticleMutation();
  const updateArticleMutation = useUpdateArticleMutation();

  const { data: categoryTree = [] } = useCategoryTreeQuery(CategoryType.CONTENT_TOPIC);
  const flatCategories = React.useMemo(() => flattenCategories(categoryTree), [categoryTree]);

  const [title, setTitle] = React.useState(initialPost?.title || '');
  const [summary, setSummary] = React.useState(() => {
    if (!initialPost) return '';
    if ('summary' in initialPost) return initialPost.summary;
    if ('excerpt' in initialPost) return initialPost.excerpt;
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
    if ('coverImage' in initialPost) return initialPost.coverImage;
    if ('coverImageUrl' in initialPost) return initialPost.coverImageUrl;
    return COVER_PRESETS[0].url;
  });
  const [coverMedia, setCoverMedia] = React.useState<{
    publicId?: string;
    mimeType?: string;
    bytes?: number;
  } | null>(() => {
    if (initialPost && 'coverMedia' in initialPost) return initialPost.coverMedia ?? null;
    return null;
  });
  const [contentMarkdown, setContentMarkdown] = React.useState(() => {
    if (!initialPost) {
      return `## 1. Mở đầu chia sẻ\nViết những dòng chia sẻ chân thành về trải nghiệm ăn chay của bạn...\n\n### 2. Bí quyết dinh dưỡng cần lưu ý\n- **Đảm bảo protein:** Kết hợp các loại đậu và ngũ cốc.\n- **Bổ sung khoáng chất:** Uống đủ nước và bổ sung rau xanh đậm.\n\n> *"Ăn chay nuôi dưỡng tình thương và mang lại sự an lạc nội tâm."*\n\n### 3. Lời khuyên thực hành\nChúc các bạn có những bữa cơm thanh lành tràn đầy năng lượng!`;
    }
    if ('contentMarkdown' in initialPost) return initialPost.contentMarkdown;
    if ('content' in initialPost) return initialPost.content;
    return '';
  });
  const [tags, setTags] = React.useState<string[]>(
    initialPost?.tags || ['ĂnChayKhoaHọc', 'DinhDưỡngXanh', 'ThuầnChay']
  );
  const [newTagInput, setNewTagInput] = React.useState('');

  // Quyền xuất bản lấy từ phiên đăng nhập thật (không mô phỏng):
  // Người đóng góp / Quản trị viên được xuất bản ngay, Thành viên phải chờ duyệt.
  const sessionUser = useAuthStore((s) => s.user);
  const canPublishDirectly =
    sessionUser?.role === UserRole.CONTRIBUTOR || sessionUser?.role === UserRole.ADMIN;
  // Tên tác giả hiển thị ở xem trước: ưu tiên tác giả gốc của bài đang sửa,
  // bài mới lấy tên user đang đăng nhập.
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
    return contentMarkdown.trim().split(/\s+/).filter(Boolean).length;
  }, [contentMarkdown]);

  const readingMinutes = React.useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 160));
  }, [wordCount]);

  // Chèn cú pháp Markdown tại vị trí con trỏ
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const replacement = `${prefix}${selected || 'nội dung'}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);

    setContentMarkdown(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected.length || 'nội dung'.length)
      );
    }, 10);
  };

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
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài viết!');
      return;
    }
    if (!contentMarkdown.trim()) {
      toast.error('Vui lòng nhập nội dung bài viết!');
      return;
    }

    let postStatus: PostStatus = PostStatus.PENDING_REVIEW;
    if (actionType === 'DRAFT') {
      postStatus = PostStatus.DRAFT;
    } else {
      // Người đóng góp / Quản trị viên: xuất bản ngay; Thành viên: chờ duyệt.
      postStatus = canPublishDirectly ? PostStatus.PUBLISHED : PostStatus.PENDING_REVIEW;
    }

    setIsSubmitting(true);
    try {
      // Backend nhận categoryIds (UUID) — map tên chuyên mục đang chọn sang id trong cây thật.
      const categoryId = flatCategories.find((c) => c.name === category)?.id || '';
      if (isEditing && initialPost) {
        await updateArticleMutation.mutateAsync({
          id: initialPost.id,
          article: {
            title,
            category: { id: categoryId, name: category },
            excerpt: summary || title,
            content: contentMarkdown,
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
        router.push(`/articles/${initialPost.id}`);
      } else {
        const res = await createArticleMutation.mutateAsync({
          title,
          category: { id: categoryId, name: category },
          excerpt: summary || title,
          content: contentMarkdown,
          coverImageUrl: coverImage,
          coverMedia,
          tags,
          status: postStatus,
        });

        toast.success(
          actionType === 'DRAFT'
            ? 'Đã lưu bài viết vào Bản nháp!'
            : postStatus === 'PUBLISHED'
              ? '🎉 Bài viết đã được Chuyên gia Dinh dưỡng kiểm chứng và xuất bản!'
              : '🎉 Bài viết đã gửi thành công! Đang chờ Chuyên gia Dinh dưỡng kiểm duyệt.'
        );

        const targetId = res?.id;
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

  // Render markdown đơn giản cho Live Preview
  const renderPreviewContent = (md: string) => {
    return md.split('\n\n').map((block, idx) => {
      const trimmed = block.trim();
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-xl font-bold text-foreground mt-6 mb-2">
            {trimmed.replace(/^## /, '')}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-lg font-semibold text-foreground mt-4 mb-2">
            {trimmed.replace(/^### /, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('> [!TIP]')) {
        return (
          <div
            key={idx}
            className="my-4 rounded-xl border-l-4 border-emerald-500 bg-emerald-500/10 p-4"
          >
            <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-1">
              <Lightbulb className="h-4 w-4" /> Mẹo Dinh Dưỡng Từ Chuyên Gia
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {trimmed.replace(/^> \[!TIP\]\s*/, '').replace(/^> /gm, '')}
            </p>
          </div>
        );
      }
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote
            key={idx}
            className="my-4 border-l-4 border-primary pl-4 italic text-muted-foreground bg-primary/5 py-2.5 rounded-r-lg"
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
            className="list-disc list-inside space-y-1 my-2 text-sm leading-relaxed text-muted-foreground"
          >
            {items.map((it, i) => (
              <li key={i}>{it.replace(/^[-*]\s*/, '')}</li>
            ))}
          </ul>
        );
      }
      return (
        <p key={idx} className="text-sm sm:text-base leading-relaxed text-muted-foreground my-3">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="space-y-8">
      {/* Thông tin quyền xuất bản theo vai trò thật của tài khoản */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {canPublishDirectly
                  ? 'Bạn có quyền xuất bản ngay'
                  : 'Bài viết sẽ chờ chuyên gia duyệt'}
              </p>
              <p className="text-xs text-muted-foreground">
                {canPublishDirectly
                  ? 'Vai trò của bạn được xuất bản ngay kèm trạng thái công khai.'
                  : 'Bài viết sẽ được chuyển vào hàng đợi kiểm duyệt của Chuyên gia Dinh dưỡng trước khi công khai.'}
              </p>
            </div>
          </div>

          <Badge variant="secondary" className="rounded-full text-xs">
            {sessionUser?.role === UserRole.ADMIN
              ? 'Quản trị viên'
              : sessionUser?.role === UserRole.CONTRIBUTOR
                ? 'Người đóng góp'
                : 'Thành viên'}
          </Badge>
        </CardContent>
      </Card>

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT 2 COLS: Editor Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Title */}
          <div className="space-y-2">
            <Label htmlFor="post-title" className="text-sm font-bold text-foreground">
              Tiêu đề bài viết <span className="text-destructive">*</span>
            </Label>
            <Input
              id="post-title"
              placeholder="VD: Tin tức ăn chay trường không lo thiếu máu và Vitamin B12..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 text-base font-semibold rounded-xl"
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
              className="rounded-xl resize-none text-sm"
            />
          </div>

          {/* Markdown Content Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Nội dung bài viết (Định dạng Markdown)
              </Label>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{wordCount} từ</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-primary font-medium">
                  <Clock className="h-3 w-3" /> ~{readingMinutes} phút đọc
                </span>
              </div>
            </div>

            {/* Toolbar & Tabs */}
            <div className="rounded-2xl border border-border/80 overflow-hidden bg-card shadow-sm">
              <div className="flex flex-wrap items-center justify-between border-b border-border/70 bg-muted/40 p-2 gap-2">
                {/* Formatting Action Buttons */}
                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    title="In đậm (**văn bản**)"
                    onClick={() => insertMarkdown('**', '**')}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    title="In nghiêng (*văn bản*)"
                    onClick={() => insertMarkdown('*', '*')}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    title="Tiêu đề mục (H2)"
                    onClick={() => insertMarkdown('\n## ')}
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    title="Tiêu đề nhỏ (H3)"
                    onClick={() => insertMarkdown('\n### ')}
                  >
                    <Heading3 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    title="Trích dẫn danh ngôn (> )"
                    onClick={() => insertMarkdown('\n> ')}
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-emerald-600"
                    title="Khung mẹo dinh dưỡng (> [!TIP])"
                    onClick={() => insertMarkdown('\n> [!TIP]\n> Mẹo dinh dưỡng: ')}
                  >
                    <Lightbulb className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    title="Danh sách gạch đầu dòng"
                    onClick={() => insertMarkdown('\n- ')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    title="Danh sách có số thứ tự"
                    onClick={() => insertMarkdown('\n1. ')}
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                </div>

                {/* Edit vs Preview Toggle */}
                <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-xl border">
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

              {activeTab === 'edit' ? (
                <Textarea
                  ref={textareaRef}
                  value={contentMarkdown}
                  onChange={(e) => setContentMarkdown(e.target.value)}
                  placeholder="Bắt đầu viết nội dung bài chia sẻ của bạn bằng Markdown..."
                  rows={16}
                  className="w-full rounded-none border-none p-4 font-mono text-sm leading-relaxed resize-y focus-visible:ring-0"
                />
              ) : (
                <div className="p-6 bg-card min-h-[380px] max-h-[600px] overflow-y-auto">
                  <h1 className="text-2xl font-black text-foreground mb-3">
                    {title || 'Tiêu đề bài viết'}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pb-4 border-b">
                    <Badge variant="outline">{category}</Badge>
                    <span>•</span>
                    <span>{readingMinutes} phút đọc</span>
                    <span>•</span>
                    <span>Tác giả: {previewAuthorName}</span>
                  </div>
                  <div className="mt-4">{renderPreviewContent(contentMarkdown)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT 1 COL: Metadata, Cover, Tags & Publish Options */}
        <div className="space-y-6">
          {/* Cover Image Selector */}
          <Card className="rounded-2xl border-border/70 overflow-hidden shadow-sm">
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
                    meta?.publicId && meta?.mimeType && meta?.bytes
                      ? { publicId: meta.publicId, mimeType: meta.mimeType, bytes: meta.bytes }
                      : null
                  );
                }}
              />

              <div className="space-y-1.5 pt-1">
                <Label className="text-xs text-muted-foreground">
                  Hoặc chọn nhanh ảnh bìa có sẵn:
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {COVER_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCoverImage(p.url);
                        setCoverMedia(null);
                      }}
                      className={cn(
                        'text-left text-[11px] p-2 rounded-lg border transition-all truncate',
                        coverImage === p.url
                          ? 'border-primary bg-primary/10 font-bold text-primary'
                          : 'border-border/60 hover:border-primary/40 bg-muted/20'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Classification: Category & Diet School */}
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold">Phân loại & Trường phái</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Chuyên mục tin tức</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-xl text-xs h-10">
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
                  <SelectTrigger className="rounded-xl text-xs h-10">
                    <SelectValue placeholder="Chọn trường phái" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIET_SCHOOLS.map((ds) => (
                      <SelectItem key={ds.value} value={ds.value} className="text-xs">
                        <span className="font-semibold">{ds.label}</span> —{' '}
                        <span className="text-muted-foreground">{ds.desc}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" /> Thẻ chủ đề (Tags)
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="gap-1 rounded-md text-xs py-0.5 px-2 bg-muted"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-destructive transition-colors"
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
                    className="h-8 text-xs rounded-lg"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddTag}
                    className="h-8 px-2.5 rounded-lg text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="rounded-2xl border-primary/40 bg-gradient-to-br from-card to-primary/5 shadow-md">
            <CardContent className="p-5 space-y-3">
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {canPublishDirectly ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Quyền xuất bản ngay
                    </span>
                  ) : (
                    <span>Quyền Thành viên: Chờ chuyên gia duyệt</span>
                  )}
                </p>
                <p className="text-[11px] leading-relaxed">
                  {canPublishDirectly
                    ? 'Bài viết sẽ xuất hiện ngay trên trang Tin tức ở trạng thái công khai.'
                    : 'Bài viết sẽ được chuyển vào hàng đợi kiểm duyệt của Chuyên gia Dinh dưỡng trước khi công khai.'}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit('SUBMIT')}
                  className="w-full rounded-xl gap-2 font-bold h-11 shadow-sm"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting
                    ? 'Đang lưu bài viết...'
                    : canPublishDirectly
                      ? 'Xuất bản bài viết'
                      : 'Gửi Chuyên gia duyệt bài'}
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
        </div>
      </div>
    </div>
  );
}
