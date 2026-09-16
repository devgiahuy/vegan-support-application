'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  RotateCcw,
  Printer,
  BookmarkPlus,
  Refrigerator,
  Flag,
  UtensilsCrossed,
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Lightbulb,
  ThumbsUp,
  BadgeCheck,
  ShoppingCart,
  Share2,
  Store,
  Navigation,
  CheckCircle2,
  X,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { WhyRecommendedDialog } from '@/components/shared/why-recommended-dialog';

const GOALS = [
  { id: 'maintain', label: 'Giữ cân & Khỏe mạnh' },
  { id: 'lose', label: 'Giảm mỡ lành mạnh' },
  { id: 'muscle', label: 'Tăng cơ thuần chay' },
];

type Meal = {
  type: 'Sáng' | 'Trưa' | 'Tối';
  name: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
};
type Day = { label: string; date: string; meals: Meal[]; total: number; percent: string };

const PLAN: Day[] = [
  {
    label: 'Thứ Hai',
    date: '21/10',
    total: 1820,
    percent: 'Đạt 98% TDEE',
    meals: [
      { type: 'Sáng', name: 'Bún bò Huế chay nấm & đậu hũ', kcal: 420, p: 18, c: 52, f: 12 },
      { type: 'Trưa', name: 'Cơm lứt đậu gà sốt cà ri rau củ', kcal: 580, p: 24, c: 74, f: 16 },
      { type: 'Tối', name: 'Canh rong biển đậu non & nấm bào ngư', kcal: 490, p: 20, c: 48, f: 11 },
    ],
  },
  {
    label: 'Thứ Ba',
    date: '22/10',
    total: 1840,
    percent: 'Chuẩn 99%',
    meals: [
      { type: 'Sáng', name: 'Phở chay nấm hương & hoa hồi', kcal: 410, p: 16, c: 58, f: 10 },
      {
        type: 'Trưa',
        name: 'Cơm tấm sườn nấm áp chảo & bì chả chay',
        kcal: 610,
        p: 26,
        c: 78,
        f: 18,
      },
      { type: 'Tối', name: 'Gỏi cuốn nấm kim châm xốt tương đậu', kcal: 460, p: 17, c: 54, f: 12 },
    ],
  },
  {
    label: 'Thứ Tư',
    date: '23/10',
    total: 1830,
    percent: 'Đạt 99%',
    meals: [
      {
        type: 'Sáng',
        name: 'Bánh mì xíu mại nấm hương pate hạt điều',
        kcal: 430,
        p: 19,
        c: 49,
        f: 14,
      },
      {
        type: 'Trưa',
        name: 'Bánh canh cua chay nấm rơm & chả quế',
        kcal: 540,
        p: 22,
        c: 68,
        f: 15,
      },
      { type: 'Tối', name: 'Đậu hũ non sốt nấm xá xíu & cải thìa', kcal: 470, p: 25, c: 41, f: 13 },
    ],
  },
  {
    label: 'Thứ Năm',
    date: '24/10',
    total: 1815,
    percent: 'Đạt 98%',
    meals: [
      {
        type: 'Sáng',
        name: 'Cháo yến mạch hạt sen đậu xanh & bí đỏ',
        kcal: 395,
        p: 15,
        c: 62,
        f: 8,
      },
      {
        type: 'Trưa',
        name: 'Miến xào giòn chay lòng mề nấm đông cô',
        kcal: 560,
        p: 21,
        c: 72,
        f: 17,
      },
      { type: 'Tối', name: 'Súp măng tây đậu ngự nấm tuyết nhĩ', kcal: 480, p: 22, c: 47, f: 12 },
    ],
  },
  {
    label: 'Thứ Sáu',
    date: '25/10',
    total: 1860,
    percent: 'Đạt 100%',
    meals: [
      { type: 'Sáng', name: 'Hủ tiếu Nam Vang chay xá xíu đậu hũ', kcal: 410, p: 17, c: 56, f: 10 },
      { type: 'Trưa', name: 'Cơm gạo lứt nấm kho tiêu gừng sả', kcal: 590, p: 23, c: 76, f: 16 },
      { type: 'Tối', name: 'Lẩu mini rau nấm Nhật hạt sen tươi', kcal: 490, p: 22, c: 50, f: 12 },
    ],
  },
  {
    label: 'Thứ Bảy',
    date: '26/10',
    total: 1835,
    percent: 'Chuẩn 99%',
    meals: [
      {
        type: 'Sáng',
        name: 'Bánh cuốn chay nhân mộc nhĩ nấm đùi gà',
        kcal: 420,
        p: 16,
        c: 54,
        f: 11,
      },
      {
        type: 'Trưa',
        name: 'Mì Udon chay xốt bơ đậu phộng rau củ',
        kcal: 570,
        p: 21,
        c: 70,
        f: 19,
      },
      {
        type: 'Tối',
        name: 'Salad cầu vồng sốt mè rang & hạt gai dầu',
        kcal: 470,
        p: 20,
        c: 44,
        f: 18,
      },
    ],
  },
  {
    label: 'Chủ Nhật',
    date: '27/10',
    total: 1845,
    percent: 'Đạt 99%',
    meals: [
      {
        type: 'Sáng',
        name: 'Bún riêu chay cà chua & đậu hũ non chiên',
        kcal: 435,
        p: 19,
        c: 57,
        f: 11,
      },
      {
        type: 'Trưa',
        name: 'Cơm chiên trái thơm hạt điều & nấm tuyết',
        kcal: 580,
        p: 21,
        c: 75,
        f: 17,
      },
      {
        type: 'Tối',
        name: 'Đậu bắp kho quẹt chay & rau luộc ngũ sắc',
        kcal: 450,
        p: 18,
        c: 49,
        f: 10,
      },
    ],
  },
];

const MEAL_COLOR: Record<Meal['type'], string> = {
  Sáng: 'text-primary',
  Trưa: 'text-secondary-foreground',
  Tối: 'text-cta',
};

const MACROS = [
  { label: 'Đạm thực vật (Protein)', value: '78g / 70g (18%)', pct: 100, color: 'bg-primary' },
  { label: 'Tinh bột phức (Carbs)', value: '240g (55%)', pct: 75, color: 'bg-sprout' },
  { label: 'Chất béo tốt (Healthy Fat)', value: '52g (27%)', pct: 60, color: 'bg-cta' },
];

export default function MealPlanPage() {
  const [goal, setGoal] = React.useState('lose');
  const [fridge, setFridge] = React.useState([
    'Đậu hũ non',
    'Nấm đùi gà',
    'Rau cải thìa',
    'Hạt sen',
  ]);
  const [extraMeal, setExtraMeal] = React.useState(true);
  const [isWhyDialogOpen, setIsWhyDialogOpen] = React.useState(false);
  const [personalizationEnabled, setPersonalizationEnabled] = React.useState(true);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Trang chủ
        </Link>
        <ChevronRightIcon />
        <span className="hover:text-primary">Tiện ích</span>
        <ChevronRightIcon />
        <span className="font-semibold text-foreground">Kế hoạch bữa ăn 7 ngày</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Đã đồng bộ hồ sơ • Lưu tự động 1 phút trước
        </span>
      </nav>

      <h1 className="mt-6 flex items-center gap-2 text-2xl font-bold md:text-3xl">
        <Sparkles className="h-6 w-6 text-cta" /> Lên Thực Đơn Thuần Chay 7 Ngày Cùng AI
      </h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        Tự động cân bằng dinh dưỡng vi chất, kiểm soát calo khoa học và trích xuất danh sách mua sắm
        tức thì theo tủ lạnh của bạn.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Button asChild variant="outline" className="gap-1.5 rounded-full">
          <Link href="/meal-plans/saved">
            <CalendarDays className="h-4 w-4 text-primary" /> Thực đơn đã lưu
          </Link>
        </Button>

        {/* Personalization Switch & Why Recommended Button */}
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 p-1 px-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsWhyDialogOpen(true)}
            className="h-7 gap-1 rounded-full text-xs font-semibold text-primary hover:bg-primary/10 px-2"
          >
            <Sparkles className="h-3.5 w-3.5" /> Vì sao thấy gợi ý này?
          </Button>

          <span className="h-4 w-[1px] bg-border" />

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
              Cá nhân hoá AI:
            </span>
            <Switch
              checked={personalizationEnabled}
              onCheckedChange={(val) => {
                setPersonalizationEnabled(val);
                toast.success(
                  val
                    ? 'Đã bật cá nhân hoá thực đơn tuần theo hành vi & BMI.'
                    : 'Đã tắt cá nhân hoá. Thực đơn chuyển sang chế độ quy chuẩn dinh dưỡng cố định.'
                );
              }}
              className="scale-75"
            />
            <Badge
              variant={personalizationEnabled ? 'default' : 'secondary'}
              className={cn(
                'text-[10px] rounded-full font-medium ml-0.5',
                personalizationEnabled ? 'bg-cta text-white' : 'bg-muted text-muted-foreground'
              )}
            >
              {personalizationEnabled ? 'AI Hành vi' : 'Quy chuẩn'}
            </Badge>
          </div>
        </div>

        <Button variant="outline" className="gap-1.5 rounded-full">
          <RotateCcw className="h-4 w-4" /> Tạo lại ngẫu nhiên
        </Button>
        <Button variant="outline" className="gap-1.5 rounded-full">
          <Printer className="h-4 w-4" /> Xuất PDF &amp; Đi chợ
        </Button>
        <Button
          className="gap-1.5 rounded-full"
          onClick={() => toast.success('Đã lưu kế hoạch tuần này vào Thực đơn đã lưu!')}
        >
          <BookmarkPlus className="h-4 w-4" /> Lưu kế hoạch tuần này
        </Button>
      </div>

      {/* Preferences */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Refrigerator className="h-4 w-4 text-primary" /> Tủ lạnh nhà bạn
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {fridge.map((f) => (
                <Badge key={f} variant="secondary" className="gap-1 rounded-full">
                  {f}
                  <button
                    onClick={() => setFridge((p) => p.filter((x) => x !== f))}
                    aria-label={`Xoá ${f}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <button
                onClick={() => {
                  const v = window.prompt('Thêm nguyên liệu:');
                  if (v) setFridge((p) => [...p, v]);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Plus className="h-3 w-3" /> Thêm
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Flag className="h-4 w-4 text-primary" /> Mục tiêu thể chất
            </p>
            <div className="mt-3 space-y-2">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm',
                    goal === g.id
                      ? 'border-primary bg-primary/5 font-medium text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {g.label}
                  {goal === g.id && <CheckCircle2 className="h-4 w-4" />}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Thâm hụt calo kiểm soát: 300 kcal/ngày
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <UtensilsCrossed className="h-4 w-4 text-primary" /> Số bữa ăn trong ngày
            </p>
            <div className="mt-3 rounded-xl border bg-muted/40 p-3">
              <p className="text-sm font-medium">3 Bữa chính tiêu chuẩn</p>
              <Badge className="mt-1 rounded-full bg-primary/10 text-primary">Đang chọn</Badge>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <Checkbox checked={extraMeal} onCheckedChange={(v) => setExtraMeal(Boolean(v))} />
              Kèm 1 bữa xế phụ (Hạt / Sinh tố xanh)
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4 text-primary" /> Chỉ số cơ thể
            </p>
            <p className="mt-3 text-sm">
              Chỉ số BMI: <strong className="text-primary">21.4 kg/m²</strong>
            </p>
            <div className="mt-2 flex h-2 overflow-hidden rounded-full">
              <span className="w-1/4 bg-blue-300" />
              <span className="w-2/4 bg-primary" />
              <span className="w-1/4 bg-amber-400" />
            </div>
            <p className="mt-3 text-sm">
              TDEE Thực đơn: <strong>1,850 kcal</strong>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              * BMI &lt; 16 hoặc &gt; 35 vui lòng tham vấn bác sĩ dinh dưỡng.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="icon" aria-label="Tuần trước">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center gap-2 font-semibold">
              <CalendarDays className="h-4 w-4 text-primary" /> Tuần 42 (21/10 - 27/10)
            </span>
            <Button variant="outline" size="icon" aria-label="Tuần sau">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="ml-auto gap-1.5 rounded-full">
              <SlidersHorizontal className="h-4 w-4" /> Tự động cân đối calo tuần
            </Button>
            <Badge variant="secondary" className="rounded-full">
              Chay kì: Rằm 15
            </Badge>
          </div>

          <div className="no-scrollbar mt-4 overflow-x-auto pb-2">
            <div className="grid min-w-[900px] grid-cols-7 gap-3">
              {PLAN.map((day) => (
                <div key={day.label} className="space-y-3">
                  <div className="rounded-xl border bg-muted/40 px-2 py-1.5 text-center">
                    <p className="text-xs font-medium">{day.label}</p>
                    <p className="text-sm font-semibold">{day.date}</p>
                  </div>
                  {day.meals.map((m) => (
                    <div key={m.type} className="rounded-xl border p-2">
                      <div className="flex items-center justify-between">
                        <span className={cn('text-[11px] font-semibold', MEAL_COLOR[m.type])}>
                          {m.type}
                        </span>
                        <button
                          aria-label="Đổi món"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs font-medium">{m.name}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {m.kcal} kcal • P:{m.p} C:{m.c} F:{m.f}
                      </p>
                    </div>
                  ))}
                  <div className="rounded-xl bg-primary/5 p-2 text-center">
                    <p className="text-xs font-bold">{day.total.toLocaleString('vi-VN')} kcal</p>
                    <p className="text-[10px] text-primary">{day.percent}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-xl border border-cta/30 bg-cta/5 p-3 text-sm">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-cta" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Cơ chế Đổi Món Tương Thích Calo:</strong> nhấn
              biểu tượng đổi món trên từng thẻ để chọn món cùng nhóm calo (~420 kcal) mà không làm
              lệch biểu đồ TDEE.
            </p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4 xl:col-span-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Calo Hôm Nay vs TDEE</h3>
                <Badge variant="secondary" className="rounded-full">
                  Biên độ ±15%
                </Badge>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div
                  className="relative h-20 w-20 rounded-full"
                  style={{
                    background:
                      'conic-gradient(var(--primary) 0turn 0.98turn, var(--muted) 0.98turn 1turn)',
                  }}
                >
                  <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-card">
                    <span className="text-sm font-bold">98%</span>
                    <span className="text-[10px] text-muted-foreground">Tối ưu</span>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="font-semibold">1,820 / 1,850 kcal</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
                    <ThumbsUp className="h-3.5 w-3.5" /> -1.6% lý tưởng cho mục tiêu giảm mỡ
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {MACROS.map((m) => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-medium">{m.value}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full rounded-full', m.color)}
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">HM</AvatarFallback>
                </Avatar>
                <div>
                  <p className="flex items-center gap-1 text-sm font-semibold">
                    BS. Hoàng Mai <BadgeCheck className="h-4 w-4 text-primary" />
                  </p>
                  <p className="text-xs text-muted-foreground">Cố vấn Dinh dưỡng Thuần chay</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                “Thực đơn tuần này giàu sắt thực vật (non-heme iron) từ nấm và rau cải thìa, kết hợp
                vitamin C giúp tăng hấp thu sắt. Protein trung bình 78g/ngày bảo toàn khối cơ.”
              </p>
              <Button variant="secondary" className="mt-3 w-full rounded-xl">
                Hỏi AI Dinh Dưỡng điều chỉnh thêm
              </Button>
            </CardContent>
          </Card>

          <Card id="shopping-section">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <ShoppingCart className="h-4 w-4 text-primary" /> Cần Mua Thêm
                </h3>
                <Badge variant="secondary" className="rounded-full">
                  Thiếu 7 món
                </Badge>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  'Cải xoăn Kale / Cải thìa — 500g',
                  'Nấm hương tươi & Nấm rơm — 300g',
                  'Cà rốt Đà Lạt — 3 củ',
                  'Đậu gà khô hữu cơ — 500g',
                  'Hạt chia & Hạt sen tươi — 200g',
                  'Hạt nêm nấm Shiitake — 1 gói',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Checkbox />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-3 w-full gap-1.5 rounded-xl">
                <Share2 className="h-4 w-4" /> Xuất sang Zalo / Điện thoại
              </Button>
            </CardContent>
          </Card>

          <Card className="border-cta/30 bg-cta/5">
            <CardContent className="p-5">
              <Store className="h-5 w-5 text-cta" />
              <p className="mt-2 font-semibold">Bận rộn không kịp nấu bữa trưa?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tìm ngay 14 quán chay sạch gần bạn có thực đơn tương đương lượng calo bữa trưa hôm
                nay.
              </p>
              <Button asChild className="mt-3 w-full gap-1.5 rounded-xl">
                <Link href="/restaurants">
                  <Navigation className="h-4 w-4" /> Tìm quán chay lân cận (3km)
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border bg-accent p-4 text-sm text-muted-foreground">
        Lưu ý: Mọi gợi ý dinh dưỡng từ VeggieConnect đều dựa trên công thức mẫu tham khảo và AI sinh
        dựa trên dữ liệu hành vi với sự đồng thuận của bạn.
      </div>

      <WhyRecommendedDialog
        isOpen={isWhyDialogOpen}
        onClose={() => setIsWhyDialogOpen(false)}
        targetTitle="Thực đơn tuần cá nhân hoá theo hành vi & BMI"
      />

      <p className="mt-8 rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
        * Khuyến cáo dinh dưỡng: mọi tính toán calo và gợi ý thực đơn mang tính hỗ trợ xây dựng lối
        sống. Vui lòng tham vấn chuyên gia y tế cho các tình trạng bệnh lý chuyên biệt.
      </p>
    </div>
  );
}

function ChevronRightIcon() {
  return <ChevronRight className="h-3.5 w-3.5" />;
}
