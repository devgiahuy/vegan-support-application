import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Leaf, ShieldCheck, Sparkles, Sprout, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Về VeggieConnect — Nền tảng hỗ trợ lối sống ăn chay toàn diện',
  description:
    'Tìm hiểu sứ mệnh, tầm nhìn và giá trị của VeggieConnect trong việc đồng hành cùng cộng đồng ăn chay Việt Nam.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-10 lg:px-6">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <Sprout className="size-3.5" /> Đồng hành cùng lối sống xanh
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
          Về <span className="text-primary">VeggieConnect</span>
        </h1>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground leading-relaxed">
          Nền tảng hỗ trợ lối sống ăn chay thông minh, khoa học và kết nối cộng đồng thực vật hàng
          đầu tại Việt Nam.
        </p>
      </section>

      {/* Sứ mệnh & Tầm nhìn */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-card to-emerald-50/30 dark:to-emerald-950/20">
          <CardContent className="p-6 space-y-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Target className="size-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Sứ mệnh của chúng tôi</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Giúp việc ăn chay trở nên dễ dàng, đủ chất dinh dưỡng và vui vẻ cho tất cả mọi người.
              Chúng tôi loại bỏ rào cản thiếu thông tin, lo âu thiếu chất thông qua công nghệ phân
              tích dinh dưỡng chuẩn xác và gợi ý thực đơn cá nhân hóa.
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-gradient-to-br from-card to-emerald-50/30 dark:to-emerald-950/20">
          <CardContent className="p-6 space-y-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Heart className="size-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Tầm nhìn bền vững</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Xây dựng một hệ sinh thái toàn diện kết nối người ăn chay, chuyên gia dinh dưỡng, các
              nhà hàng chay và nông trại xanh, hướng tới một xã hội khỏe mạnh và một hành tinh xanh
              hơn.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Giá trị cốt lõi */}
      <section className="space-y-6">
        <h2 className="text-center text-2xl font-bold text-foreground">Giá trị cốt lõi</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Leaf className="size-4" />
              </div>
              <h3 className="font-semibold text-foreground">100% Thuần thực vật</h3>
              <p className="text-xs text-muted-foreground">
                Tất cả công thức, món ăn và địa điểm được chọn lọc nghiêm ngặt, minh bạch về trường
                phái ăn chay.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-4" />
              </div>
              <h3 className="font-semibold text-foreground">Dinh dưỡng khoa học</h3>
              <p className="text-xs text-muted-foreground">
                Dữ liệu dinh dưỡng đối chiếu theo chuẩn Viện Dinh dưỡng Quốc gia & USDA, không đưa
                ra lời khuyên y tế võ đoán.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="size-4" />
              </div>
              <h3 className="font-semibold text-foreground">Cộng đồng sẻ chia</h3>
              <p className="text-xs text-muted-foreground">
                Khuyến khích thành viên cùng đóng góp món ăn, chia sẻ kinh nghiệm sống lành mạnh và
                đánh giá chân thực.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA khám phá */}
      <section className="rounded-2xl border bg-muted/40 p-8 text-center space-y-4">
        <h3 className="text-xl font-bold text-foreground">
          Bắt đầu hành trình ăn chay của bạn ngay hôm nay
        </h3>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Khám phá hàng trăm công thức chay hấp dẫn hoặc tìm kiếm các quán ăn chay ngon gần bạn
          nhất.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild className="rounded-full shadow-sm">
            <Link href="/recipes">Khám phá món chay</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/restaurants">Tìm quán chay gần đây</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
