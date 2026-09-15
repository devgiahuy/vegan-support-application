'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Camera,
  BadgeCheck,
  Sparkles,
  Award,
  Plus,
  User,
  HeartPulse,
  BookOpen,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  UtensilsCrossed,
  Eye,
  Pencil,
  Trash2,
  Search,
  ShieldCheck,
  CalendarDays,
  FileDown,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { WhyRecommendedDialog } from '@/components/shared/why-recommended-dialog';
import {
  ACTIVITY_LEVELS,
  calcBmi,
  calcBmr,
  calcTdee,
  calGoalTargets,
  type BiologicalSex,
} from '@/features/health/lib/bmi';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { usePostStore } from '@/store/usePostStore';
import type { Post } from '@/features/post/types/post.model';

type Tab = 'info' | 'health' | 'posts' | 'privacy';

const DIET_MODES = ['Thuần chay (Vegan)', 'Chay bán phần', 'Ăn chay rằm/mùng 1'];

const POSTS = [
  {
    status: 'Đã duyệt',
    tone: 'primary',
    title: 'Phở Nấm Thuần Chay Dưỡng Sinh Nước Dùng Thanh Ngọt',
    meta: 'Món nước • Đăng ngày 12/10/2024',
    desc: 'Bí quyết ninh củ cải trắng, mía lau và các loại nấm tươi để có nồi nước dùng ngọt tự nhiên.',
    views: '1,420 lượt xem • 248 yêu thích',
  },
  {
    status: 'Chờ duyệt',
    tone: 'cta',
    title: 'Nem Rán Chay Nhân Nấm Mộc Nhĩ & Đậu Xanh Bùi Béo',
    meta: 'Món chiên giòn • Gửi lúc 15:30 hôm nay',
    desc: 'Vỏ bánh ram giòn rụm nhiều giờ, công thức nhân đậu bùi thơm dinh dưỡng cho ngày lễ rằm.',
    views: 'Ban kiểm duyệt sẽ phản hồi trong 24 giờ',
  },
  {
    status: 'Cần chỉnh sửa',
    tone: 'destructive',
    title: 'Cà Tím Kho Tiêu Nồi Đất Cay Nồng Đậm Đà Đưa Cơm',
    meta: 'Món kho • Cập nhật 2 ngày trước',
    desc: 'Lý do: Vui lòng bổ sung định lượng chi tiết cho nguyên liệu gia vị tiêu và nước tương.',
    views: 'Phiên bản nháp v1.2',
  },
];

const toneClass: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  cta: 'bg-cta/15 text-cta',
  destructive: 'bg-destructive/10 text-destructive',
};

export default function ProfilePage() {
  const [tab, setTab] = React.useState<Tab>('health');
  const [sex, setSex] = React.useState<BiologicalSex>('female');
  const [age, setAge] = React.useState(27);
  const [height, setHeight] = React.useState(162);
  const [weight, setWeight] = React.useState(52.5);
  const [activity, setActivity] = React.useState(1.375);
  const [personalizationEnabled, setPersonalizationEnabled] = React.useState(true);
  const [healthSyncEnabled, setHealthSyncEnabled] = React.useState(true);
  const [isWhyDialogOpen, setIsWhyDialogOpen] = React.useState(false);

  const { posts, deletePost } = usePostStore();
  const [postSearch, setPostSearch] = React.useState('');
  const [postStatusFilter, setPostStatusFilter] = React.useState<
    'ALL' | 'PUBLISHED' | 'PENDING' | 'FLAGGED' | 'DRAFT'
  >('ALL');
  const [postToDelete, setPostToDelete] = React.useState<Post | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab');
      if (urlTab && ['info', 'health', 'posts', 'privacy'].includes(urlTab)) {
        setTab(urlTab as Tab);
      }
    }
  }, []);

  const myPosts = React.useMemo(() => {
    return posts.filter(
      (p) =>
        p.author.id === 'my-user' ||
        p.author.id === 'expert-lan-anh' ||
        p.tags?.includes('BàiCủaTôi') ||
        p.author.name.includes('Lan Hương')
    );
  }, [posts]);

  const filteredMyPosts = React.useMemo(() => {
    let list = [...myPosts];
    if (postStatusFilter !== 'ALL') {
      list = list.filter((p) => p.status === postStatusFilter);
    }
    if (postSearch.trim()) {
      const q = postSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [myPosts, postStatusFilter, postSearch]);

  const publishedCount = myPosts.filter((p) => p.status === 'PUBLISHED').length;
  const pendingCount = myPosts.filter((p) => p.status === 'PENDING').length;
  const flaggedCount = myPosts.filter((p) => p.status === 'FLAGGED').length;
  const draftCount = myPosts.filter((p) => p.status === 'DRAFT').length;

  const bmi = calcBmi(weight, height);
  const bmr = calcBmr(weight, height, age, sex);
  const tdee = calcTdee(bmr, activity);
  const goals = calGoalTargets(tdee);

  const scale = [
    { range: '< 18.5', label: 'Thiếu cân' },
    { range: '18.5 - 22.9', label: 'Bình thường' },
    { range: '23.0 - 24.9', label: 'Thừa cân' },
    { range: '>= 25.0', label: 'Béo phì' },
  ];

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'info', label: 'Thông tin cá nhân', icon: User },
    { id: 'health', label: 'Sức khỏe & BMI', icon: HeartPulse, badge: 'AI Phân tích' },
    { id: 'posts', label: 'Bài viết của tôi', icon: BookOpen, badge: `${myPosts.length}` },
    { id: 'privacy', label: 'Cá nhân hoá & Dữ liệu', icon: ShieldCheck, badge: 'NĐ 13/2023' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
      {/* Profile banner */}
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center">
          <div className="relative">
            <Avatar className="h-20 w-20 rounded-2xl">
              <AvatarFallback className="rounded-2xl bg-primary/10 text-2xl text-primary">
                LH
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-2 -right-2 rounded-full bg-background p-1.5 shadow">
              <Camera className="h-4 w-4 text-primary" />
            </span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold">Nguyễn Lan Hương</h1>
              <Badge className="gap-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                <Award className="h-3.5 w-3.5" /> Thành viên Vàng
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                Thuần chay 3 năm
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Đầu bếp tại gia &amp; người truyền cảm hứng lối sống thực dưỡng xanh. Yêu thích sáng
              tạo những món chay thuần túy mang đậm hương vị Việt Nam.
            </p>
            <div className="mt-3 grid max-w-md grid-cols-3 gap-4">
              <div>
                <p className="text-lg font-bold text-primary">12</p>
                <p className="text-xs text-muted-foreground">Công thức đăng</p>
              </div>
              <div>
                <p className="text-lg font-bold text-primary">1,850</p>
                <p className="text-xs text-muted-foreground">Điểm sống lành</p>
              </div>
              <div>
                <p className="text-lg font-bold text-primary">24 Th10</p>
                <p className="text-xs text-muted-foreground">Ngày tham gia</p>
              </div>
            </div>
          </div>
          <Button asChild className="gap-1.5 rounded-full">
            <Link href="/dang-cong-thuc">
              <Plus className="h-4 w-4" /> Tạo công thức mới
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="mt-6 grid grid-cols-2 gap-1 rounded-full border bg-muted p-1 sm:grid-cols-4">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
              {t.badge && (
                <Badge className="hidden rounded-full bg-primary/10 text-[10px] text-primary lg:inline-flex">
                  {t.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB: INFO */}
      {tab === 'info' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold">Ảnh đại diện hồ sơ</h2>
              <p className="text-xs text-muted-foreground">JPG, PNG dung lượng dưới 5MB</p>
              <label className="mt-4 flex h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center hover:border-primary hover:bg-primary/5">
                <Camera className="h-7 w-7 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Kéo &amp; thả ảnh vào đây</p>
                <p className="text-xs text-muted-foreground">hoặc nhấp để chọn tệp</p>
                <input type="file" accept="image/png,image/jpeg" className="hidden" />
              </label>
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
                <p className="flex items-center gap-1.5 font-medium text-primary">
                  <BadgeCheck className="h-4 w-4" /> Tài khoản đã xác minh
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bạn đã hoàn tất định danh để nhận huy hiệu đóng góp món ngon.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="space-y-4 p-6">
                <h2 className="font-semibold">Thông tin chi tiết</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Họ và tên</Label>
                    <Input defaultValue="Nguyễn Lan Hương" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tên hiển thị (Nickname)</Label>
                    <Input defaultValue="HuongLan.Vegan" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Địa chỉ Email</Label>
                    <div className="flex items-center gap-2">
                      <Input defaultValue="lanhuong.chay@gmail.com" />
                      <Badge className="whitespace-nowrap rounded-full bg-primary/10 text-primary">
                        Đã xác thực
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Số điện thoại</Label>
                    <Input defaultValue="0987 654 321" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Chế độ ăn hiện tại</Label>
                  <div className="flex flex-wrap gap-2">
                    {DIET_MODES.map((d, i) => (
                      <button
                        key={d}
                        className={cn(
                          'rounded-full border px-4 py-1.5 text-sm font-medium',
                          i === 0
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Giới thiệu ngắn (Bio)</Label>
                  <Textarea
                    rows={3}
                    defaultValue="Đầu bếp tại gia & người truyền cảm hứng lối sống thực dưỡng xanh. Yêu thích sáng tạo những món chay thuần túy mang đậm hương vị Việt Nam."
                  />
                </div>
                <Button className="rounded-full">Cập nhật thông tin</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-6">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Lock className="h-4 w-4 text-primary" /> Bảo mật &amp; Đổi mật khẩu
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Mật khẩu hiện tại</Label>
                    <Input type="password" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mật khẩu mới</Label>
                    <Input type="password" placeholder="Tối thiểu 8 ký tự" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Xác nhận mật khẩu mới</Label>
                    <Input type="password" placeholder="Nhập lại mật khẩu mới" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={cn(
                          'h-1.5 flex-1 rounded-full',
                          i < 3 ? 'bg-primary' : 'bg-muted'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-primary">Tốt</span>
                </div>
                <Button variant="outline" className="rounded-full">
                  Đổi mật khẩu
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB: HEALTH */}
      {tab === 'health' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-5">
            <CardContent className="space-y-5 p-6">
              <h2 className="font-semibold">Chỉ số thể trạng</h2>
              <p className="text-sm text-muted-foreground">
                Nhập thông số để AI tính toán nhu cầu dinh dưỡng thực vật.
              </p>

              <div className="space-y-2">
                <Label>Giới tính sinh học</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['female', 'male'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSex(s)}
                      className={cn(
                        'rounded-xl border py-2 text-sm font-medium',
                        sex === s
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      {s === 'female' ? 'Nữ' : 'Nam'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Độ tuổi ({age} tuổi)</Label>
                <Input
                  type="number"
                  min={15}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Chiều cao ({height} cm)</Label>
                <Slider
                  min={140}
                  max={220}
                  step={1}
                  value={[height]}
                  onValueChange={(v) => setHeight(v[0])}
                />
              </div>

              <div className="space-y-2">
                <Label>Cân nặng ({weight} kg)</Label>
                <Slider
                  min={30}
                  max={180}
                  step={0.5}
                  value={[weight]}
                  onValueChange={(v) => setWeight(v[0])}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Mức độ vận động thể chất</Label>
                <Select value={String(activity)} onValueChange={(v) => setActivity(Number(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_LEVELS.map((a) => (
                      <SelectItem key={a.value} value={String(a.value)}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 lg:col-span-7">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Chỉ số khối cơ thể</p>
                    <p className="mt-1 flex items-center gap-2">
                      <span className="text-3xl font-bold text-primary">
                        {bmi.value.toFixed(1)}
                      </span>
                      <Badge className="rounded-full bg-primary/10 text-primary">
                        {bmi.category}
                      </Badge>
                    </p>
                  </div>
                  <p className="text-right text-xs text-muted-foreground">
                    Tiêu chuẩn WHO Châu Á
                    <br />
                    Thể trạng cân đối lý tưởng
                  </p>
                </div>

                <div className="mt-4 flex h-3 overflow-hidden rounded-full">
                  <span
                    className={cn(
                      'flex-1',
                      bmi.level === 0 ? 'bg-muted-foreground/50' : 'bg-muted-foreground/30'
                    )}
                  />
                  <span
                    className={cn('flex-1', bmi.level === 1 ? 'bg-primary' : 'bg-primary/30')}
                  />
                  <span className={cn('flex-1', bmi.level === 2 ? 'bg-cta' : 'bg-cta/30')} />
                  <span
                    className={cn(
                      'flex-1',
                      bmi.level === 3 ? 'bg-destructive' : 'bg-destructive/30'
                    )}
                  />
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[11px]">
                  {scale.map((s, i) => (
                    <div
                      key={s.label}
                      className={cn('rounded-lg p-1', i === bmi.level && 'bg-primary/10')}
                    >
                      <p className="font-semibold">{s.range}</p>
                      <p className="text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card>
                <CardContent className="p-5">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Flame className="h-4 w-4 text-cta" /> BMR (Mifflin-St Jeor)
                  </p>
                  <p className="mt-2 text-2xl font-bold">{bmr.toLocaleString('vi-VN')} kcal/ngày</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Năng lượng tối thiểu để duy trì sự sống cơ bản khi nghỉ ngơi.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4 text-cta" /> TDEE (Tiêu hao tổng)
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {tdee.toLocaleString('vi-VN')} kcal/ngày
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tổng năng lượng đốt cháy tính theo vận động thực tế mỗi ngày.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6">
                <h2 className="flex items-center gap-2 font-semibold">
                  <UtensilsCrossed className="h-4 w-4 text-primary" /> Mục tiêu Calo khuyến nghị cho
                  người ăn chay
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {goals.map((g) => (
                    <div
                      key={g.key}
                      className={cn(
                        'rounded-2xl border p-4',
                        g.key === 'maintain' && 'border-primary bg-primary/5'
                      )}
                    >
                      <p className="text-sm font-medium">{g.label}</p>
                      <p className="mt-2 text-xl font-bold text-primary">
                        {g.kcal.toLocaleString('vi-VN')} kcal
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{g.note}</p>
                      {g.key === 'maintain' && (
                        <Badge className="mt-2 rounded-full bg-primary text-primary-foreground">
                          Khuyên dùng
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {bmi.isOutOfSafeRange && (
              <Card className="border-destructive/40 bg-destructive/5">
                <CardContent className="flex gap-3 p-5">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
                  <div className="text-sm">
                    <p className="font-semibold text-destructive">Lưu ý y tế quan trọng</p>
                    <p className="mt-1 text-muted-foreground">
                      BMI của bạn đang nằm ngoài giới hạn an toàn thông thường. Vui lòng tham khảo
                      bác sĩ chuyên khoa dinh dưỡng trước khi áp dụng chế độ kiêng cữ.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" /> Lời khuyên dinh dưỡng từ AI ChayXanh
                </h2>
                <ul className="mt-3 space-y-3 text-sm">
                  {[
                    'Bổ sung đạm thực vật toàn phần: cần ~65-75g protein/ngày từ tempeh, đậu hũ nướng, đậu gà và hạt gai dầu.',
                    'Tối ưu hấp thu Sắt & Vitamin C: kết hợp rau bina, cải xoăn với chanh hoặc ớt chuông đỏ trong bữa chính.',
                    'Vitamin B12 & Omega-3: người thuần chay lâu năm nên bổ sung men dinh dưỡng, hạt lanh hoặc vi tảo định kỳ.',
                  ].map((tip) => (
                    <li key={tip} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB: POSTS */}
      {tab === 'posts' && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border">
            <div>
              <h2 className="text-lg font-bold text-foreground">Quản lý bài viết cá nhân</h2>
              <p className="text-xs text-muted-foreground">
                Quản lý các bài chia sẻ dinh dưỡng, cẩm nang nấu chay và theo dõi trạng thái kiểm
                duyệt từ Chuyên gia (SRS UC-02 &amp; UC-11).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" className="rounded-xl gap-1.5 shadow-sm">
                <Link href="/bai-viet/tao-moi">
                  <Plus className="h-4 w-4" /> Viết bài mới
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Link href="/dang-cong-thuc">
                  <UtensilsCrossed className="h-4 w-4 text-primary" /> Đăng công thức
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: `Tất cả (${myPosts.length})` },
                { id: 'PUBLISHED', label: `Đã duyệt (${publishedCount})` },
                { id: 'PENDING', label: `Chờ duyệt (${pendingCount})` },
                { id: 'FLAGGED', label: `Cần sửa (${flaggedCount})` },
                { id: 'DRAFT', label: `Bản nháp (${draftCount})` },
              ].map((f) => (
                <Badge
                  key={f.id}
                  variant={postStatusFilter === f.id ? 'default' : 'secondary'}
                  onClick={() => setPostStatusFilter(f.id as any)}
                  className="rounded-full px-3 py-1 cursor-pointer text-xs transition-all"
                >
                  {f.label}
                </Badge>
              ))}
            </div>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm bài viết của bạn..."
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {filteredMyPosts.length > 0 ? (
              filteredMyPosts.map((p) => {
                const isPublished = p.status === 'PUBLISHED';
                const isPending = p.status === 'PENDING';
                const isFlagged = p.status === 'FLAGGED';

                return (
                  <Card
                    key={p.id}
                    className="overflow-hidden border-border/70 hover:border-primary/40 transition-colors"
                  >
                    <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                      <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-muted md:w-36">
                        <img
                          src={p.coverImage}
                          alt={p.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={cn(
                              'rounded-full text-[11px] font-medium',
                              isPublished &&
                                'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                              isPending &&
                                'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
                              isFlagged &&
                                'bg-destructive/15 text-destructive border-destructive/30',
                              p.status === 'DRAFT' && 'bg-muted text-muted-foreground'
                            )}
                          >
                            {p.statusLabel || p.status}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{p.category}</span>
                          <span className="text-[11px] text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            Đăng ngày {p.publishedAt}
                          </span>
                        </div>

                        <h3 className="font-semibold text-foreground text-sm sm:text-base leading-snug line-clamp-1">
                          {p.title}
                        </h3>

                        <p className="line-clamp-1 text-xs text-muted-foreground">{p.summary}</p>

                        {p.moderationReason && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span className="truncate">{p.moderationReason}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                          <span>{p.views.toLocaleString()} lượt xem</span>
                          <span>•</span>
                          <span className="text-primary font-semibold">Net vote: {p.score}</span>
                          <span>•</span>
                          <span>{p.commentCount} bình luận</span>
                        </div>
                      </div>

                      <div className="flex gap-1 shrink-0 self-end md:self-center">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          aria-label="Xem bài viết"
                          className="rounded-xl"
                        >
                          <Link href={`/bai-viet/${p.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          aria-label="Sửa bài viết"
                          className="rounded-xl"
                        >
                          <Link href={`/bai-viet/${p.id}/chinh-sua`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Xoá bài viết"
                          className="text-destructive hover:bg-destructive/10 rounded-xl"
                          onClick={() => {
                            setPostToDelete(p);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Chưa có bài viết nào trong danh mục này.
                </p>
                <Button asChild size="sm" variant="outline" className="rounded-full text-xs">
                  <Link href="/bai-viet/tao-moi">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Viết bài chia sẻ đầu tiên
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: PRIVACY & PERSONALIZATION (NĐ 13/2023) */}
      {tab === 'privacy' && (
        <div className="mt-6 space-y-6">
          <Card className="border-border/70">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle className="text-xl font-bold">
                    Quyền riêng tư &amp; Quản trị dữ liệu cá nhân
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân tại Việt Nam
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Quick links to Saved Menus */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl border bg-primary/5 border-primary/20 gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Thực đơn đã lưu của bạn (3 kế hoạch)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Xem lại, chỉnh sửa hoặc áp dụng các thực đơn 7 ngày đã lưu
                    </p>
                  </div>
                </div>

                <Button asChild size="sm" className="gap-1.5 font-semibold shrink-0">
                  <Link href="/ke-hoach-bua-an/da-luu">
                    Mở Thực đơn đã lưu <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Consent Switches */}
              <div className="space-y-4 divide-y">
                <div className="flex items-start justify-between gap-4 pt-4 first:pt-0">
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-foreground">
                      Cá nhân hoá thực đơn theo dữ liệu hành vi (UC-08)
                    </Label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Cho phép AI sử dụng câu hỏi của bạn với Trợ lý AI (UC-07), món ăn bạn đã lưu
                      và lịch sử tìm kiếm để tự động tinh chỉnh gợi ý thực đơn phù hợp nhất. Khi
                      tắt, hệ thống chỉ dùng công thức quy chuẩn cứng (UC-06).
                    </p>
                  </div>
                  <Switch
                    checked={personalizationEnabled}
                    onCheckedChange={(val) => {
                      setPersonalizationEnabled(val);
                      toast.success(
                        val
                          ? 'Đã bật cá nhân hoá thực đơn theo hành vi.'
                          : 'Đã tắt cá nhân hoá. Hệ thống sẽ chỉ sử dụng bộ lọc quy chuẩn.'
                      );
                    }}
                  />
                </div>

                <div className="flex items-start justify-between gap-4 pt-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-foreground">
                      Đồng bộ dữ liệu thể trạng &amp; vận động (UC-13)
                    </Label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Đồng bộ dữ liệu chiều cao, cân nặng, đếm bước từ Health Connect / cảm biến
                      điện thoại để tự động tính toán BMR, TDEE và đề xuất mức calo tương ứng.
                    </p>
                  </div>
                  <Switch
                    checked={healthSyncEnabled}
                    onCheckedChange={(val) => {
                      setHealthSyncEnabled(val);
                      toast.success(
                        val
                          ? 'Đã bật đồng bộ dữ liệu sức khoẻ.'
                          : 'Đã tắt đồng bộ dữ liệu sức khoẻ.'
                      );
                    }}
                  />
                </div>
              </div>

              {/* Transparency explanation button */}
              <div className="rounded-2xl border p-4 bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" /> Minh bạch thuật toán gợi ý AI
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Xem chi tiết các nguồn tín hiệu nào đang được dùng để đề xuất món ăn và thực đơn
                    cho bạn
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWhyDialogOpen(true)}
                  className="gap-1.5 text-xs font-semibold shrink-0"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Xem căn cứ giải trình
                </Button>
              </div>

              {/* Data Rights: Download & Delete */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Quyền đối với dữ liệu cá nhân (Nghị định 13/2023)
                </h4>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast.info(
                        'Yêu cầu trích xuất dữ liệu của bạn đã được tiếp nhận. Bản sao lưu sẽ được gửi vào email trong 24 giờ.'
                      )
                    }
                    className="gap-1.5 text-xs"
                  >
                    <FileDown className="h-4 w-4 text-primary" /> Tải về bản sao dữ liệu của tôi
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast.success('Đã xóa toàn bộ lịch sử hành vi cá nhân hóa thành công.')
                    }
                    className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" /> Xóa toàn bộ lịch sử hành vi &amp; chat AI
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Why recommended transparency dialog */}
      <WhyRecommendedDialog
        isOpen={isWhyDialogOpen}
        onClose={() => setIsWhyDialogOpen(false)}
        targetTitle="Tài khoản cá nhân & Dữ liệu hành vi"
      />

      {/* Delete Post Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Xoá bài viết này?"
        description={`Bạn có chắc chắn muốn xoá bài viết "${postToDelete?.title}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá bài viết"
        cancelLabel="Huỷ bỏ"
        danger={true}
        onConfirm={() => {
          if (postToDelete) {
            deletePost(postToDelete.id);
            toast.success(`Đã xoá bài viết "${postToDelete.title}" thành công!`);
            setIsDeleteDialogOpen(false);
            setPostToDelete(null);
          }
        }}
      />
    </div>
  );
}
