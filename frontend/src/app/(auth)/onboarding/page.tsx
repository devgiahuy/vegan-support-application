'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  Heart,
  Leaf,
  Flame,
  ShieldAlert,
  Apple,
  Dumbbell,
  Target,
  Smile,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type DietSchool = 'PHAT_GIAO' | 'DAO_GIAO' | 'VEGAN' | 'CHAY_KY' | 'FLEXITARIAN';

interface DietOption {
  id: DietSchool;
  title: string;
  badge: string;
  desc: string;
  icon: string;
}

const DIET_SCHOOLS: DietOption[] = [
  {
    id: 'PHAT_GIAO',
    title: 'Chay Phật giáo',
    badge: 'Phổ biến',
    desc: 'Nuôi dưỡng tâm từ bi, kiêng thịt cá, có tuỳ chọn kiêng nhóm Ngũ vị tân theo giới luật.',
    icon: '🪷',
  },
  {
    id: 'DAO_GIAO',
    title: 'Chay Đạo giáo / Cao Đài',
    badge: 'Chay tịnh',
    desc: 'Ăn chay theo lịch kỳ (mùng 1, rằm, thập trai), kiêng các chất cay nồng và kích thích.',
    icon: '☯️',
  },
  {
    id: 'VEGAN',
    title: 'Thuần chay (Vegan)',
    badge: 'Lối sống',
    desc: '100% nguồn gốc thực vật, kiêng toàn bộ thịt, hải sản, trứng, sữa và mật ong.',
    icon: '🌱',
  },
  {
    id: 'CHAY_KY',
    title: 'Ăn chay kỳ',
    badge: 'Linh hoạt',
    desc: 'Ăn chay định kỳ vào ngày rằm, mùng 1 hoặc 4-10 ngày trong tháng để thanh lọc cơ thể.',
    icon: '📅',
  },
  {
    id: 'FLEXITARIAN',
    title: 'Bán chay (Flexitarian)',
    badge: 'Khởi đầu',
    desc: 'Ưu tiên tối đa rau củ hạt quả trong tuần, giảm dần lượng thịt cá theo lộ trình.',
    icon: '🥗',
  },
];

const ALLERGIES = [
  {
    id: 'ngu_vi_tan',
    label: 'Ngũ vị tân (Hành, hẹ, tỏi, kiệu, hưng cừ)',
    badge: 'Phật giáo khuyên kiêng',
  },
  { id: 'trung', label: 'Trứng gia cầm', badge: 'Thuần chay' },
  { id: 'sua', label: 'Sữa & Bơ động vật', badge: 'Lactose free' },
  { id: 'dau_nanh', label: 'Đậu nành & Tàu hũ', badge: 'Dị ứng phổ biến' },
  { id: 'gluten', label: 'Gluten (Mì căn, lúa mì)', badge: 'Gluten-free' },
  { id: 'cay_nong', label: 'Đồ cay nồng, ớt hiểm', badge: 'Dạ dày' },
];

const HEALTH_GOALS = [
  {
    id: 'healthy',
    title: 'Duy trì sức khỏe & Thanh lọc',
    desc: 'Ăn chay khoa học, đầy đủ vi chất, da dẻ hồng hào và tinh thần an vui.',
    icon: Heart,
  },
  {
    id: 'weight_loss',
    title: 'Giảm cân & Đốt mỡ lành mạnh',
    desc: 'Kiểm soát calo, giàu chất xơ, giữ cảm giác no lâu mà không mất cơ.',
    icon: Target,
  },
  {
    id: 'muscle_gain',
    title: 'Tăng cơ thuần chay (High Protein)',
    desc: 'Tối ưu lượng protein thực vật từ các loại đậu, hạt sen, nấm và ngũ cốc nguyên cám.',
    icon: Dumbbell,
  },
  {
    id: 'medical_care',
    title: 'Ổn định huyết áp & Đường huyết',
    desc: 'Thực đơn thanh nhạt, ít muối đường, giàu kali và chất chống oxy hóa tự nhiên.',
    icon: Apple,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<number>(1);
  const [selectedDiet, setSelectedDiet] = React.useState<DietSchool>('PHAT_GIAO');
  const [selectedAllergies, setSelectedAllergies] = React.useState<string[]>(['ngu_vi_tan']);
  const [selectedGoals, setSelectedGoals] = React.useState<string[]>(['healthy']);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const toggleAllergy = (id: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => prev + 1);
    } else {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        toast.success('Hồ sơ dinh dưỡng VeggieConnect đã được lưu!');
        router.push('/');
      }, 1000);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    toast.info('Bạn có thể cập nhật lại hồ sơ bất kỳ lúc nào tại trang Hồ sơ.');
    router.push('/');
  };

  return (
    <div className="w-full max-w-2xl">
      <Card className="border-border/60 shadow-xl overflow-hidden">
        {/* Step progress bar */}
        <div className="bg-muted/50 px-6 pt-5 pb-3 border-b">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
            <span>BƯỚC {step} / 3</span>
            <span>
              {step === 1 && 'Trường phái ăn chay'}
              {step === 2 && 'Kiêng kỵ & Dị ứng thực phẩm'}
              {step === 3 && 'Mục tiêu dinh dưỡng'}
            </span>
          </div>
          <Progress value={(step / 3) * 100} className="h-1.5" />
        </div>

        <CardHeader className="text-center pb-3 pt-6">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {step === 1 && <span className="text-2xl">🪷</span>}
            {step === 2 && <ShieldAlert className="h-6 w-6" />}
            {step === 3 && <Target className="h-6 w-6" />}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === 1 && 'Bạn đang thực hành trường phái ăn chay nào?'}
            {step === 2 && 'Bạn cần kiêng hoặc tránh thực phẩm nào?'}
            {step === 3 && 'Mục tiêu sức khỏe chính của bạn là gì?'}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {step === 1 &&
              'VeggieConnect sẽ tự động lọc công thức và gợi ý thực đơn chuẩn xác theo trường phái của bạn.'}
            {step === 2 &&
              'Các công thức và gợi ý AI sẽ tự động loại trừ các thành phần bạn đã chọn bên dưới.'}
            {step === 3 &&
              'Thuật toán dinh dưỡng sẽ cân bằng lượng Calories và đạm thực vật phù hợp với bạn.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {/* STEP 1: Trường phái chay */}
          {step === 1 && (
            <div className="grid gap-3">
              {DIET_SCHOOLS.map((item) => {
                const isSelected = selectedDiet === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedDiet(item.id)}
                    className={cn(
                      'relative flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                        : 'border-border/70 hover:border-primary/50 hover:bg-muted/30'
                    )}
                  >
                    <span className="text-3xl shrink-0 mt-0.5">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground text-base">
                          {item.title}
                        </span>
                        <Badge variant="secondary" className="text-[11px] font-normal">
                          {item.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                    <div
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors mt-1',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 2: Kiêng kỵ & Dị ứng */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="grid gap-2.5 sm:grid-cols-2">
                {ALLERGIES.map((item) => {
                  const isChecked = selectedAllergies.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleAllergy(item.id)}
                      className={cn(
                        'flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all',
                        isChecked
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border/70 hover:border-primary/50 hover:bg-muted/30'
                      )}
                    >
                      <div className="space-y-0.5 pr-2">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <span className="text-[11px] text-muted-foreground">{item.badge}</span>
                      </div>
                      <div
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                          isChecked
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/40'
                        )}
                      >
                        {isChecked && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground italic text-center pt-2">
                💡 Lưu ý: Đối với người ăn chay theo Phật giáo tu tập, việc kiêng Ngũ vị tân (hành,
                hẹ, tỏi, kiệu, hưng cừ) giúp thân tâm thanh tịnh.
              </p>
            </div>
          )}

          {/* STEP 3: Mục tiêu dinh dưỡng */}
          {step === 3 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {HEALTH_GOALS.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedGoals.includes(goal.id);
                return (
                  <div
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={cn(
                      'flex flex-col p-4 rounded-xl border cursor-pointer transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                        : 'border-border/70 hover:border-primary/50 hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/40'
                        )}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">{goal.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{goal.desc}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Quay lại
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                Bỏ qua
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="gap-1.5 px-6 font-semibold"
            >
              {isSubmitting ? (
                'Đang lưu...'
              ) : step === 3 ? (
                <>
                  Hoàn tất & Bắt đầu <CheckCircle2 className="h-4 w-4" />
                </>
              ) : (
                <>
                  Tiếp theo <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
