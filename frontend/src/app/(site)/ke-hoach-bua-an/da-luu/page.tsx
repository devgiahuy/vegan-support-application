'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Sparkles,
  Printer,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Flame,
  Dumbbell,
  Clock,
  Home,
  ChevronRight,
  Plus,
  Share2,
  FileText,
  CalendarCheck,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SavedMealPlan {
  id: string;
  name: string;
  savedDate: string;
  generatedBy: 'ai_genai_behavioral' | 'system_rule';
  dietSchool: string;
  dietSchoolBadge: string;
  avgKcal: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  totalMeals: number;
  description: string;
  isActiveCurrentWeek?: boolean;
}

const INITIAL_SAVED_PLANS: SavedMealPlan[] = [
  {
    id: 'sp1',
    name: 'Thực đơn Chay Phật Giáo Tuần 42 — Tối Ưu Đạm Thực Vật',
    savedDate: '10/09/2026',
    generatedBy: 'ai_genai_behavioral',
    dietSchool: 'Phật giáo',
    dietSchoolBadge: 'Kiêng Ngũ vị tân',
    avgKcal: 1840,
    proteinGrams: 75,
    carbGrams: 240,
    fatGrams: 42,
    totalMeals: 21,
    description:
      'Thực đơn được AI cá nhân hóa từ các câu hỏi về protein thực vật và các món nấm ưa thích của bạn. Đạt 99% TDEE khuyến nghị.',
    isActiveCurrentWeek: true,
  },
  {
    id: 'sp2',
    name: 'Thực đơn Thanh Lọc & Tĩnh Tâm 7 Ngày',
    savedDate: '28/08/2026',
    generatedBy: 'system_rule',
    dietSchool: 'Thuần chay',
    dietSchoolBadge: 'Thanh nhiệt',
    avgKcal: 1650,
    proteinGrams: 58,
    carbGrams: 210,
    fatGrams: 35,
    totalMeals: 21,
    description:
      'Tập trung vào canh dưỡng sinh, rau củ hấp cuốn bánh tráng và cháo hạt sen gạo lứt. Giúp nhẹ bụng và tiêu hóa êm dịu.',
    isActiveCurrentWeek: false,
  },
  {
    id: 'sp3',
    name: 'Thực đơn Chay Kỳ Thập Trai — Mùng 1 & Ngày Rằm',
    savedDate: '15/08/2026',
    generatedBy: 'system_rule',
    dietSchool: 'Đạo giáo / Cao Đài',
    dietSchoolBadge: 'Chay kỳ',
    avgKcal: 1780,
    proteinGrams: 64,
    carbGrams: 230,
    fatGrams: 38,
    totalMeals: 21,
    description:
      'Bộ món ăn truyền thống thanh tịnh chuẩn vị cho các dịp lễ sóc vọng và thập trai trong tháng.',
    isActiveCurrentWeek: false,
  },
];

export default function SavedMealPlansPage() {
  const [plans, setPlans] = React.useState<SavedMealPlan[]>(INITIAL_SAVED_PLANS);

  const handleApply = (id: string, name: string) => {
    setPlans((prev) =>
      prev.map((p) => ({
        ...p,
        isActiveCurrentWeek: p.id === id,
      }))
    );
    toast.success(`Đã áp dụng "${name}" cho tuần hiện tại!`);
  };

  const handleDelete = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    toast.success('Đã xóa thực đơn khỏi danh sách lưu trữ.');
  };

  const handlePrint = (name: string) => {
    toast.info(`Đang chuẩn bị file in / PDF cho "${name}"...`);
    if (typeof window !== 'undefined') {
      setTimeout(() => window.print(), 500);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/"
          className="inline-flex items-center gap-1 hover:text-primary transition-colors"
        >
          <Home className="h-4 w-4" /> Trang chủ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/ke-hoach-bua-an" className="hover:text-primary transition-colors">
          Kế hoạch bữa ăn
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-primary">Thực đơn đã lưu</span>
      </nav>

      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Danh sách Thực đơn đã lưu
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý các kế hoạch dinh dưỡng tuần bạn đã tạo hoặc được AI sinh theo sở thích
          </p>
        </div>

        <Button asChild className="gap-2 font-semibold shadow-md shrink-0">
          <Link href="/ke-hoach-bua-an">
            <Plus className="h-4 w-4" /> Tạo thực đơn mới
          </Link>
        </Button>
      </div>

      {/* Plans List */}
      {plans.length > 0 ? (
        <div className="grid gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                'border overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md',
                plan.isActiveCurrentWeek
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                  : 'border-border/70 bg-card'
              )}
            >
              <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {plan.isActiveCurrentWeek && (
                        <Badge className="bg-primary text-primary-foreground text-xs gap-1 font-semibold">
                          <CalendarCheck className="h-3.5 w-3.5" /> Đang áp dụng tuần này
                        </Badge>
                      )}
                      {plan.generatedBy === 'ai_genai_behavioral' ? (
                        <Badge
                          variant="secondary"
                          className="bg-cta/15 text-cta border-cta/30 text-xs gap-1 font-medium"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> AI Cá nhân hoá hành vi (UC-08)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Quy chuẩn dinh dưỡng (UC-06)
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {plan.dietSchool} • {plan.dietSchoolBadge}
                      </Badge>
                    </div>

                    <CardTitle className="text-xl font-bold text-foreground">{plan.name}</CardTitle>
                  </div>

                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Đã lưu ngày: <strong>{plan.savedDate}</strong>
                  </span>
                </div>

                <CardDescription className="text-xs sm:text-sm text-muted-foreground pt-1 leading-relaxed">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-5 sm:px-6 pb-5 pt-2">
                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 p-3.5 rounded-xl bg-background/80 border text-center text-xs mb-4">
                  <div>
                    <span className="text-muted-foreground block">Calo trung bình</span>
                    <strong className="text-sm font-bold text-foreground">
                      {plan.avgKcal} kcal/ngày
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Chất đạm (Protein)</span>
                    <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {plan.proteinGrams}g/ngày
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Carb tinh bột</span>
                    <strong className="text-sm font-bold text-foreground">
                      {plan.carbGrams}g/ngày
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Tổng số bữa ăn</span>
                    <strong className="text-sm font-bold text-primary">
                      {plan.totalMeals} bữa (7 ngày)
                    </strong>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={plan.isActiveCurrentWeek ? 'secondary' : 'default'}
                      size="sm"
                      onClick={() => handleApply(plan.id, plan.name)}
                      disabled={plan.isActiveCurrentWeek}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {plan.isActiveCurrentWeek ? 'Đang kích hoạt' : 'Áp dụng tuần này'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint(plan.name)}
                      className="gap-1.5 text-xs"
                    >
                      <Printer className="h-3.5 w-3.5" /> In / PDF
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs text-primary font-medium"
                    >
                      <Link href="/ke-hoach-bua-an">
                        Xem chi tiết lịch 7 ngày <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(plan.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label="Xoá thực đơn"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center space-y-4 border-dashed">
          <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Bạn chưa lưu thực đơn nào</h3>
            <p className="text-sm text-muted-foreground">
              Hãy tạo hoặc nhờ AI sinh thực đơn tuần theo chỉ số BMI của bạn và bấm "Lưu kế hoạch"
              để lưu lại tại đây.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/ke-hoach-bua-an">
              <Plus className="h-4 w-4" /> Tạo thực đơn tuần đầu tiên
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
