'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home,
  ChevronRight,
  UploadCloud,
  Video,
  Play,
  Sparkles,
  CheckCircle2,
  Bookmark,
  Eye,
  FileVideo,
  RotateCcw,
  Trash2,
  ImageIcon,
  Clock,
  Flame,
  Users,
  Info,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const CATEGORIES = [
  { id: 'mon-chinh', label: 'Món chính đậm vị' },
  { id: 'canh-sup', label: 'Canh & Súp thanh nhiệt' },
  { id: 'lau-chay', label: 'Lẩu chay dưỡng sinh' },
  { id: 'chien-rim', label: 'Món chiên & rim giòn' },
  { id: 'salad-goi', label: 'Salad & Gỏi tươi' },
  { id: 'trang-mieng', label: 'Bánh ngọt & Tráng miệng' },
];

const DIET_SCHOOLS = [
  { id: 'PHAT_GIAO', label: 'Chay Phật giáo', desc: 'Thanh tịnh, tùy chọn kiêng ngũ vị tân' },
  { id: 'DAO_GIAO', label: 'Chay Đạo giáo', desc: 'Theo lịch kỳ sóc vọng, kiêng mùi nồng' },
  { id: 'THUAN_CHAY', label: 'Thuần chay (Vegan)', desc: '100% nguồn gốc thực vật' },
];

export default function UploadVideoPage() {
  const router = useRouter();

  // Form states
  const [videoFile, setVideoFile] = React.useState<{ name: string; size: string } | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [title, setTitle] = React.useState('Cách Nấu Nồi Lẩu Nấm Dưỡng Sinh Nước Dùng Trong Vắt');
  const [description, setDescription] = React.useState(
    'Chia sẻ bí quyết nấu nước dùng lẩu chay ngọt tự nhiên từ mía lau, táo đỏ và 7 loại nấm tươi không cần mì chính.'
  );
  const [category, setCategory] = React.useState('lau-chay');
  const [dietSchool, setDietSchool] = React.useState('PHAT_GIAO');
  const [avoidAlliums, setAvoidAlliums] = React.useState(true);
  const [durationMinutes, setDurationMinutes] = React.useState('12');
  const [servings, setServings] = React.useState('4');
  const [difficulty, setDifficulty] = React.useState('Dễ làm');
  const [estCalories, setEstCalories] = React.useState('280');
  const [autoSttEnabled, setAutoSttEnabled] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Giả lập tải lên video
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    });
    setIsUploading(true);
    setUploadProgress(15);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          toast.success('Video đã tải lên và sẵn sàng phân tích!');
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const handleResetVideo = () => {
    setVideoFile(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleSubmit = (isDraft: boolean = false) => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề cho video.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (isDraft) {
        toast.success('Đã lưu bản nháp video thành công!');
      } else {
        toast.success(
          'Đăng tải video thành công! Hệ thống đang kích hoạt AI STT tóm tắt công thức.'
        );
        router.push('/video');
      }
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/"
          className="inline-flex items-center gap-1 hover:text-primary transition-colors"
        >
          <Home className="h-4 w-4" /> Trang chủ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/video" className="hover:text-primary transition-colors">
          Video nấu ăn
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-primary">Đăng tải video mới (UC-05)</span>
      </nav>

      {/* Header title & Draft actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary text-white text-xs gap-1 font-semibold">
              <Video className="h-3.5 w-3.5" /> Chuẩn Video Nấu Ăn (UC-05)
            </Badge>
            <Badge variant="secondary" className="text-xs text-primary font-medium">
              Tích hợp AI STT (UC-10)
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Đăng Tải Video Hướng Dẫn Nấu Chay
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chia sẻ các món chay thanh lành của bạn đến cộng đồng hàng chục nghìn người ăn chay Việt
            Nam
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="gap-1.5 rounded-full"
          >
            <Bookmark className="h-4 w-4" /> Lưu nháp
          </Button>
          <Button
            size="sm"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="gap-1.5 rounded-full font-semibold shadow-md"
          >
            <UploadCloud className="h-4 w-4" /> Đăng tải video ngay
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: Video File Upload & Media Preview (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* VIDEO DROPZONE CARD */}
          <Card className="border-border/70 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/40 pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <FileVideo className="h-4 w-4 text-primary" /> Tệp video nấu ăn (MP4 / WebM / MOV)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {!videoFile ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 p-10 text-center bg-muted/20 hover:border-primary hover:bg-primary/5 transition-all">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                    <UploadCloud className="h-7 w-7 animate-bounce" />
                  </div>
                  <h4 className="text-base font-bold text-foreground">
                    Kéo &amp; thả video nấu ăn vào đây
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
                    Hỗ trợ tệp MP4, WebM, MOV. Dung lượng tối đa 500MB hoặc thời lượng &le; 60 phút
                    theo chuẩn hệ thống.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 pointer-events-none rounded-full"
                  >
                    Duyệt tệp từ thiết bị
                  </Button>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  {/* Uploaded state info */}
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Video className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {videoFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{videoFile.size}</p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleResetVideo}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      aria-label="Xoá video"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Upload progress */}
                  {isUploading ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Đang tải lên và mã hóa HLS...</span>
                        <span className="font-semibold text-primary">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Video đã được tải lên thành công và sẵn sàng để xuất bản.</span>
                    </div>
                  )}

                  {/* Video preview simulation */}
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80"
                      alt="Preview"
                      className="h-full w-full object-cover opacity-60"
                    />
                    <div className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg cursor-pointer hover:scale-110 transition-transform">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </div>
                    <Badge className="absolute bottom-2.5 right-2.5 bg-black/80 text-white font-mono text-[11px]">
                      Xem trước ({durationMinutes}:00)
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI SPEECH-TO-TEXT NOTICE (UC-10) */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Quy trình tóm tắt tự động từ AI (STT • UC-10)
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary text-[11px]">
                  Tự động kích hoạt
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>
                Sau khi đăng tải, hệ thống sẽ tự động lắng nghe giọng nói trong video qua pipeline{' '}
                <strong>Speech-to-Text</strong>:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Tự động nhận diện danh sách nguyên liệu và định lượng.</li>
                <li>
                  Tạo các mốc thời gian (timestamps) cho từng bước nấu ăn để người xem bấm tua
                  nhanh.
                </li>
                <li>Tạo tóm tắt súc tích giúp tăng khả năng tìm kiếm trên nền tảng.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Video Metadata & Recipe Details (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-base font-bold text-foreground">
                Thông tin video &amp; Món ăn
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label htmlFor="title" className="font-semibold">
                    Tiêu đề video *
                  </Label>
                  <span className="text-muted-foreground">{title.length}/120</span>
                </div>
                <Input
                  id="title"
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Bí quyết nấu bún bò Huế chay nước dùng thanh ngọt..."
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="desc" className="font-semibold text-xs">
                  Mô tả &amp; Hướng dẫn sơ lược
                </Label>
                <Textarea
                  id="desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Giới thiệu món ăn, mẹo nấu hoặc nguyên liệu đặc biệt..."
                  className="resize-none text-xs"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label className="font-semibold text-xs">Danh mục món ăn *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-xs">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Diet School */}
              <div className="space-y-2">
                <Label className="font-semibold text-xs">Trường phái ăn chay áp dụng *</Label>
                <div className="grid gap-2">
                  {DIET_SCHOOLS.map((school) => {
                    const isSelected = dietSchool === school.id;
                    return (
                      <div
                        key={school.id}
                        onClick={() => setDietSchool(school.id)}
                        className={cn(
                          'flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all text-xs',
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-border/70 hover:border-primary/40'
                        )}
                      >
                        <div>
                          <p className="font-semibold text-foreground">{school.label}</p>
                          <p className="text-[11px] text-muted-foreground">{school.desc}</p>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Avoid Alliums Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <Checkbox
                  id="alliums"
                  checked={avoidAlliums}
                  onCheckedChange={(checked) => setAvoidAlliums(!!checked)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="alliums"
                  className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                >
                  <strong className="text-foreground">Không chứa Ngũ vị tân</strong> (hành, hẹ, tỏi,
                  kiệu, hưng cừ) — phù hợp cho người ăn chay Phật giáo tu tập.
                </label>
              </div>

              {/* Cooking Metrics (2x2 grid) */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Thời lượng (phút)
                  </Label>
                  <Input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> Khẩu phần (người)
                  </Label>
                  <Input
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Độ khó</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dễ làm" className="text-xs">
                        Dễ làm
                      </SelectItem>
                      <SelectItem value="Trung bình" className="text-xs">
                        Trung bình
                      </SelectItem>
                      <SelectItem value="Nâng cao" className="text-xs">
                        Nâng cao
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Flame className="h-3 w-3" /> Calo (kcal/phần)
                  </Label>
                  <Input
                    type="number"
                    value={estCalories}
                    onChange={(e) => setEstCalories(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Bottom Submit Action */}
              <div className="pt-4 border-t space-y-2">
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="w-full gap-2 font-semibold shadow-md text-sm"
                >
                  <UploadCloud className="h-4 w-4" />
                  {isSubmitting ? 'Đang xuất bản...' : 'Đăng tải video ngay'}
                </Button>

                <p className="text-[11px] text-center text-muted-foreground italic">
                  Video sau khi đăng sẽ tuân thủ quy tắc kiểm duyệt nội dung cộng đồng (UC-11).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
