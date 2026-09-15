'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Home,
  ChevronRight,
  CloudUpload,
  ImageIcon,
  RefreshCw,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Bookmark,
  Eye,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  X,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Ingredient = { name: string; amount: string; unit: string; note: string };
type Step = { title: string; minutes: string; desc: string };

const DIET_OPTIONS = ['Thuần chay 100% (Vegan)', 'Chay có sữa (Lacto)', 'Không ngũ vị tân'];
const DIFFICULTIES = ['Dễ', 'Trung bình', 'Nâng cao'];

export default function CreateRecipePage() {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [title, setTitle] = React.useState('Nấm đùi gà kho tiêu xanh nước dừa');
  const [format, setFormat] = React.useState<'blog' | 'video'>('blog');
  const [servings, setServings] = React.useState(4);
  const [diet, setDiet] = React.useState<string[]>(['Thuần chay 100% (Vegan)', 'Không ngũ vị tân']);
  const [difficulty, setDifficulty] = React.useState('Dễ');
  const [tags, setTags] = React.useState(['MónKhoChay', 'NấmĐùiGà', 'ĂnChayDễDàng', 'ThuầnChay']);

  const [ingredients, setIngredients] = React.useState<Ingredient[]>([
    {
      name: 'Nấm đùi gà tươi thân chắc',
      amount: '300',
      unit: 'gam (g)',
      note: 'Cắt lát xéo dày 1cm',
    },
    { name: 'Tiêu xanh tươi nguyên chùm', amount: '3', unit: 'nhánh', note: 'Đập dập nhẹ 1 nhánh' },
    { name: 'Nước dừa xiêm ngọt thanh', amount: '150', unit: 'ml', note: 'Giữ vị kho ngọt hậu' },
  ]);

  const [steps, setSteps] = React.useState<Step[]>([
    {
      title: 'Sơ chế nấm đùi gà & ướp gia vị',
      minutes: '10',
      desc: 'Nấm ngâm nước muối loãng 5 phút, rửa sạch để ráo, khía ca-rô rồi ướp với 2 thìa Tamari và tiêu xanh trong 10 phút.',
    },
    {
      title: 'Xào săn nấm với dầu điều & tiêu xanh',
      minutes: '8',
      desc: 'Bắc nồi đất, cho dầu điều đun ấm, xào tiêu xanh cho dậy mùi rồi cho nấm vào đảo đến khi săn vàng đều.',
    },
    {
      title: 'Kho cạn nước dừa & rắc tiêu hoàn tất',
      minutes: '12',
      desc: 'Rót nước dừa tươi ngập xâm xấp, hạ lửa nhỏ kho 12 phút đến khi sánh sệt, rắc tiêu và dọn cùng cơm gạo lứt.',
    },
  ]);

  const updateIngredient = (i: number, patch: Partial<Ingredient>) =>
    setIngredients((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const updateStep = (i: number, patch: Partial<Step>) =>
    setSteps((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const toggleDiet = (value: string) =>
    setDiet((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
      {/* Breadcrumb + actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-primary">
            <Home className="h-3.5 w-3.5" /> Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/cong-thuc" className="hover:text-primary">
            Công thức
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-foreground">Đăng công thức mới</span>
        </nav>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 rounded-full">
            <CloudUpload className="h-3.5 w-3.5" /> Đã lưu nháp tự động
          </Badge>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
            <Bookmark className="h-4 w-4" /> Lưu nháp
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
            <Eye className="h-4 w-4" /> Xem trước
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { n: 1, title: 'Thông tin chung', sub: 'Tiêu đề, danh mục, phân loại & media' },
          { n: 2, title: 'Nguyên liệu & Các bước', sub: 'Định lượng, các bước nấu & ghi chú' },
        ].map((s) => (
          <button
            key={s.n}
            onClick={() => setStep(s.n as 1 | 2)}
            className={cn(
              'flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
              step === s.n ? 'border-primary bg-primary/5' : 'hover:bg-accent'
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold',
                step === s.n
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {s.n}
            </span>
            <span>
              <span className="block text-sm font-semibold">{s.title}</span>
              <span className="block text-xs text-muted-foreground">{s.sub}</span>
            </span>
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="mt-6 space-y-6">
          <Card>
            <CardContent className="space-y-5 p-6">
              <h2 className="font-semibold">Thông tin định danh món chay</h2>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">Tiêu đề công thức *</Label>
                  <span className="text-xs text-muted-foreground">{title.length} / 150 ký tự</span>
                </div>
                <Input
                  id="title"
                  maxLength={150}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Định dạng nội dung *</Label>
                <div className="flex gap-2">
                  {(['blog', 'video'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={cn(
                        'rounded-full px-4 py-2 text-sm font-medium',
                        format === f ? 'bg-primary text-primary-foreground' : 'border bg-background'
                      )}
                    >
                      {f === 'blog' ? 'Bài viết & Hình ảnh' : 'Video hướng dẫn'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Danh mục món ăn *</Label>
                  <Select defaultValue="kho-xao">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kho-xao">Món kho / Xào đậm đà</SelectItem>
                      <SelectItem value="canh-sup">Canh &amp; Súp thanh lọc</SelectItem>
                      <SelectItem value="bun-pho">Bún / Phở / Mì nước chay</SelectItem>
                      <SelectItem value="goi-nom">Gỏi &amp; Nộm giòn tươi</SelectItem>
                      <SelectItem value="mon-tiec">Món chay đãi tiệc cỗ rằm</SelectItem>
                      <SelectItem value="trang-mieng">Bánh ngọt &amp; Tráng miệng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Chuẩn loại hình chay *</Label>
                  <div className="flex flex-wrap gap-2">
                    {DIET_OPTIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => toggleDiet(d)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-medium',
                          diet.includes(d)
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {format === 'video' && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <CloudUpload className="h-5 w-5 text-primary" /> Tải lên Video nấu ăn (UC-05)
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Hỗ trợ MP4, WebM, MOV. Tối đa 500MB hoặc thời lượng &le; 60 phút.
                    </p>
                  </div>
                  <Badge className="bg-primary text-white text-xs gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> AI Tự động tóm tắt (UC-10)
                  </Badge>
                </div>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 p-8 text-center bg-background/80 hover:border-primary hover:bg-primary/10 transition-colors">
                  <CloudUpload className="h-10 w-10 text-primary animate-pulse" />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Kéo &amp; thả tệp video hướng dẫn vào đây
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    hoặc bấm để chọn video từ máy tính của bạn
                  </p>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                  />
                </label>

                <div className="rounded-xl border border-primary/20 bg-background/60 p-3.5 text-xs text-muted-foreground flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Sau khi tải lên thành công, hệ thống sẽ tự động chạy pipeline Speech-to-Text để
                    trích xuất danh sách nguyên liệu và các mốc thời gian từng bước nấu ăn cho người
                    xem.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold">Ảnh bìa đại diện công thức</h2>
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP (Tối đa 5MB)</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center hover:border-primary hover:bg-primary/5">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">Kéo &amp; thả ảnh vào đây</p>
                  <p className="text-xs text-muted-foreground">hoặc duyệt tìm tệp từ thiết bị</p>
                  <input type="file" accept="image/*" className="hidden" />
                </label>
                <div className="flex items-center justify-between rounded-2xl border p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <ImageIcon className="h-5 w-5 text-primary" /> cover_mon_chay.jpg • 2.4 MB
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label="Thay ảnh">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Xoá ảnh"
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="gap-2 rounded-full" onClick={() => setStep(2)}>
              Tiếp tục: Nguyên liệu &amp; Các bước <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold">Danh sách nguyên liệu định lượng</h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Khẩu phần:</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setServings((s) => Math.max(1, s - 1))}
                    aria-label="Giảm khẩu phần"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-16 text-center font-medium">{servings} người</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setServings((s) => s + 1)}
                    aria-label="Tăng khẩu phần"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {ingredients.map((ing, i) => (
                  <div key={i} className="grid gap-2 md:grid-cols-12">
                    <Input
                      className="md:col-span-5"
                      value={ing.name}
                      onChange={(e) => updateIngredient(i, { name: e.target.value })}
                      placeholder="Tên nguyên liệu"
                    />
                    <Input
                      className="md:col-span-2"
                      value={ing.amount}
                      onChange={(e) => updateIngredient(i, { amount: e.target.value })}
                      placeholder="Số lượng"
                    />
                    <Input
                      className="md:col-span-2"
                      value={ing.unit}
                      onChange={(e) => updateIngredient(i, { unit: e.target.value })}
                      placeholder="Đơn vị"
                    />
                    <Input
                      className="md:col-span-2"
                      value={ing.note}
                      onChange={(e) => updateIngredient(i, { note: e.target.value })}
                      placeholder="Ghi chú"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive md:col-span-1"
                      onClick={() => setIngredients((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label="Xoá nguyên liệu"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="mt-3 gap-1.5 rounded-full"
                onClick={() =>
                  setIngredients((prev) => [...prev, { name: '', amount: '', unit: '', note: '' }])
                }
              >
                <Plus className="h-4 w-4" /> Thêm nguyên liệu tiếp theo
              </Button>

              <div className="mt-4 rounded-2xl border border-secondary-foreground/10 bg-secondary/40 p-4 text-sm">
                <p className="flex items-center gap-1.5 font-semibold text-secondary-foreground">
                  <Sparkles className="h-4 w-4" /> Gợi ý dinh dưỡng từ ChayXanh AI
                </p>
                <p className="mt-1 text-muted-foreground">
                  Nấm đùi gà cung cấp protein thực vật và kali dồi dào; kho với nước dừa giữ trọn vị
                  ngọt tự nhiên mà không cần đường tinh luyện.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold">Các bước thực hiện chế biến</h2>
              <div className="mt-4 space-y-4">
                {steps.map((s, i) => (
                  <div key={i} className="rounded-2xl border p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <Input
                        value={s.title}
                        onChange={(e) => updateStep(i, { title: e.target.value })}
                        placeholder={`Tiêu đề bước ${i + 1}...`}
                        className="flex-1"
                      />
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Input
                          className="w-16"
                          value={s.minutes}
                          onChange={(e) => updateStep(i, { minutes: e.target.value })}
                        />
                        <span className="text-xs text-muted-foreground">phút</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label="Xoá bước"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      className="mt-3"
                      rows={3}
                      value={s.desc}
                      onChange={(e) => updateStep(i, { desc: e.target.value })}
                      placeholder="Mô tả cụ thể cách nấu ở bước này..."
                    />
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="mt-3 gap-1.5 rounded-full"
                onClick={() => setSteps((prev) => [...prev, { title: '', minutes: '', desc: '' }])}
              >
                <Plus className="h-4 w-4" /> Thêm bước chế biến tiếp theo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-6 p-6 md:grid-cols-2">
              <div>
                <h2 className="font-semibold">Thời gian &amp; Độ khó</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        'rounded-full border px-4 py-1.5 text-sm font-medium',
                        difficulty === d
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="font-semibold">Gắn thẻ bài viết (Tags)</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <Badge key={t} variant="secondary" className="gap-1 rounded-full">
                      #{t}
                      <button
                        onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                        aria-label={`Xoá thẻ ${t}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      const next = window.prompt('Nhập tên thẻ mới:');
                      if (next) setTags((prev) => [...prev, next.replace(/^#/, '')]);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Thêm thẻ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="secondary" className="gap-2 rounded-full" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" /> Quay lại Bước 1
            </Button>
            <Button asChild className="gap-2 rounded-full">
              <Link href="/ho-so">
                <CheckCircle2 className="h-4 w-4" /> Gửi duyệt công thức
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Sticky action bar */}
      <div className="sticky bottom-4 mt-8 flex items-center justify-between gap-3 rounded-2xl border bg-background/90 p-3 backdrop-blur">
        <div className="text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cta" /> Trạng thái: Bản nháp
          </span>
          <span className="ml-2 hidden sm:inline">
            Sẽ chuyển thành <strong>PENDING (Chờ duyệt)</strong> sau khi gửi.
          </span>
        </div>
        <Button
          className="gap-2 rounded-full"
          onClick={() => toast.success('Đã gửi duyệt! Bài viết chuyển sang trạng thái PENDING.')}
        >
          <CheckCircle2 className="h-4 w-4" /> Gửi duyệt công thức
        </Button>
      </div>
    </div>
  );
}
