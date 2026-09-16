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
  BadgeCheck,
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
import { usePostStore } from '@/store/usePostStore';
import type { Post, AuthorRole, DietSchool, PostAuthor } from '../types/post.model';

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
    desc: 'Kiêng thịt cá, kiêng ngũ vị tân (hành tỏi kiệu)',
  },
  {
    value: 'DAO_GIAO',
    label: 'Chay Đạo giáo / Cao Đài',
    desc: 'Kiêng kích thích, chay sóc vọng kỳ',
  },
  { value: 'ALL', label: 'Áp dụng cho mọi trường phái', desc: 'Kiến thức chung hữu ích' },
];

const COVER_PRESETS = [
  {
    label: 'Thực dưỡng rau củ & B12',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
  },
  {
    label: 'Nước dùng & Phở nấm',
    url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80',
  },
  {
    label: 'Mâm cơm chay ngày Rằm',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  },
  {
    label: 'Nem rán giòn chay',
    url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80',
  },
  {
    label: 'Lối sống xanh & Thiền định',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  },
];

interface PostEditorFormProps {
  initialPost?: Post;
  isEditing?: boolean;
}

export function PostEditorForm({ initialPost, isEditing = false }: PostEditorFormProps) {
  const router = useRouter();
  const { addPost, updatePost } = usePostStore();

  const [title, setTitle] = React.useState(initialPost?.title || '');
  const [summary, setSummary] = React.useState(initialPost?.summary || '');
  const [category, setCategory] = React.useState(initialPost?.category || CATEGORIES[0]);
  const [dietSchool, setDietSchool] = React.useState<DietSchool>(
    initialPost?.dietSchool || 'THUAN_CHAY'
  );
  const [coverImage, setCoverImage] = React.useState(
    initialPost?.coverImage || COVER_PRESETS[0].url
  );
  const [contentMarkdown, setContentMarkdown] = React.useState(
    initialPost?.contentMarkdown ||
      `## 1. Mở đầu chia sẻ\nViết những dòng chia sẻ chân thành về trải nghiệm ăn chay của bạn...\n\n### 2. Bí quyết dinh dưỡng cần lưu ý\n- **Đảm bảo protein:** Kết hợp các loại đậu và ngũ cốc.\n- **Bổ sung khoáng chất:** Uống đủ nước và bổ sung rau xanh đậm.\n\n> *"Ăn chay nuôi dưỡng tình thương và mang lại sự an lạc nội tâm."*\n\n### 3. Lời khuyên thực hành\nChúc các bạn có những bữa cơm thanh lành tràn đầy năng lượng!`
  );
  const [tags, setTags] = React.useState<string[]>(
    initialPost?.tags || ['ĂnChayKhoaHọc', 'DinhDưỡngXanh', 'ThuầnChay']
  );
  const [newTagInput, setNewTagInput] = React.useState('');

  // Cho phép chuyển đổi vai trò tác giả demo: Thành viên thường vs Chuyên gia Dinh dưỡng
  const [authorRole, setAuthorRole] = React.useState<AuthorRole>(
    initialPost?.author?.role || 'AUTHORIZED_USER'
  );

  const [activeTab, setActiveTab] = React.useState<'edit' | 'preview'>('edit');
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

  const getAuthorInfo = (): PostAuthor => {
    if (authorRole === 'NUTRITION_EXPERT') {
      return {
        id: 'expert-lan-anh',
        name: 'ThS. Bác sĩ Lan Anh',
        avatar: 'https://i.pravatar.cc/80?img=47',
        role: 'NUTRITION_EXPERT',
        roleTitle: 'Chuyên gia Dinh dưỡng & Y học Cổ truyền',
        verified: true,
      };
    }
    return {
      id: 'my-user',
      name: 'Nguyễn Lan Hương (Bạn)',
      avatar: 'https://i.pravatar.cc/80?img=32',
      role: 'AUTHORIZED_USER',
      roleTitle: 'Thành viên Vàng',
      verified: true,
    };
  };

  const handleSubmit = (actionType: 'DRAFT' | 'SUBMIT') => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài viết!');
      return;
    }
    if (!contentMarkdown.trim()) {
      toast.error('Vui lòng nhập nội dung bài viết!');
      return;
    }

    const currentAuthor = getAuthorInfo();

    let postStatus: 'DRAFT' | 'PENDING' | 'PUBLISHED' = 'PENDING';
    if (actionType === 'DRAFT') {
      postStatus = 'DRAFT';
    } else {
      // Nếu tác giả là Chuyên gia dinh dưỡng: xuất bản ngay
      if (currentAuthor.role === 'NUTRITION_EXPERT') {
        postStatus = 'PUBLISHED';
      } else {
        // Nếu là Thành viên thường: vào PENDING chờ chuyên gia duyệt
        postStatus = 'PENDING';
      }
    }

    if (isEditing && initialPost) {
      updatePost(initialPost.id, {
        title,
        summary: summary || title,
        contentMarkdown,
        category,
        dietSchool,
        coverImage,
        tags,
        status: postStatus,
        readingMinutes,
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
      const created = addPost({
        title,
        summary: summary || title,
        contentMarkdown,
        category,
        dietSchool,
        coverImage,
        tags,
        status: postStatus,
        author: currentAuthor,
        readingMinutes,
      });

      toast.success(
        actionType === 'DRAFT'
          ? 'Đã lưu bài viết vào Bản nháp!'
          : postStatus === 'PUBLISHED'
            ? '🎉 Bài viết đã được Chuyên gia Dinh dưỡng kiểm chứng và xuất bản!'
            : '🎉 Bài viết đã gửi thành công! Đang chờ Chuyên gia Dinh dưỡng kiểm duyệt.'
      );

      if (postStatus === 'PUBLISHED') {
        router.push(`/articles/${created.id}`);
      } else {
        router.push('/profile?tab=posts');
      }
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
      {/* Simulation Bar: Role switcher for testing */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Mô phỏng vai trò tác giả (SRS UC-02 & UC-11)
              </p>
              <p className="text-xs text-muted-foreground">
                Chuyên gia đăng bài &rarr; Xuất bản ngay kèm tick kiểm chứng. Thành viên đăng &rarr;
                Chuyển trạng thái Chờ chuyên gia duyệt (PENDING).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={authorRole === 'AUTHORIZED_USER' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-xs"
              onClick={() => setAuthorRole('AUTHORIZED_USER')}
            >
              Thành viên thường
            </Button>
            <Button
              type="button"
              variant={authorRole === 'NUTRITION_EXPERT' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-xs gap-1.5"
              onClick={() => setAuthorRole('NUTRITION_EXPERT')}
            >
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" /> Chuyên gia Dinh dưỡng
            </Button>
          </div>
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
              placeholder="VD: Cẩm nang ăn chay trường không lo thiếu máu và Vitamin B12..."
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
                    <span>Tác giả: {getAuthorInfo().name}</span>
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
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted border">
                <img
                  src={coverImage}
                  alt="Ảnh bìa bài viết"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Chọn nhanh ảnh bìa chất lượng cao:
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {COVER_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCoverImage(p.url)}
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

              <div className="space-y-1 pt-1">
                <Label htmlFor="custom-cover" className="text-xs text-muted-foreground">
                  Hoặc dán URL ảnh ngoài:
                </Label>
                <Input
                  id="custom-cover"
                  placeholder="https://..."
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="h-8 text-xs rounded-lg"
                />
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
                <Label className="text-xs font-semibold">Chuyên mục cẩm nang</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-xl text-xs h-10">
                    <SelectValue placeholder="Chọn chuyên mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
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
                  {authorRole === 'NUTRITION_EXPERT' ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Quyền Chuyên gia: Duyệt & Xuất bản ngay
                    </span>
                  ) : (
                    <span>Quyền Thành viên: Chờ chuyên gia duyệt</span>
                  )}
                </p>
                <p className="text-[11px] leading-relaxed">
                  {authorRole === 'NUTRITION_EXPERT'
                    ? 'Bài viết sẽ xuất hiện ngay trên trang Cẩm nang kèm huy hiệu "Đã kiểm chứng bởi Chuyên gia Dinh dưỡng".'
                    : 'Bài viết sẽ được chuyển vào hàng đợi kiểm duyệt của Chuyên gia Dinh dưỡng trước khi công khai.'}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  type="button"
                  onClick={() => handleSubmit('SUBMIT')}
                  className="w-full rounded-xl gap-2 font-bold h-11 shadow-sm"
                >
                  <Send className="h-4 w-4" />
                  {authorRole === 'NUTRITION_EXPERT'
                    ? 'Xuất bản & Kiểm chứng bài viết'
                    : 'Gửi Chuyên gia duyệt bài'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
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
