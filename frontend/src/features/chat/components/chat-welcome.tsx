'use client';

import * as React from 'react';
import { Sparkles, Dumbbell, Soup, Pill, Scale, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ChatWelcomeProps {
  onSelectPrompt: (prompt: string) => void;
}

const SUGGESTED_PROMPTS = [
  {
    icon: Dumbbell,
    category: 'Đạm thực vật',
    title: 'Thực đơn thể thao giàu đạm',
    prompt:
      'Gợi ý thực đơn chay giàu protein cho người tập gym trong 1 ngày, cần đạt khoảng 70g đạm từ thực vật.',
  },
  {
    icon: Soup,
    category: 'Món ngon thuần Việt',
    title: 'Nước dùng phở nấm thanh ngọt',
    prompt:
      'Hướng dẫn cách nấu nước dùng phở nấm chay thanh ngọt tự nhiên chuẩn vị Bắc không dùng bột ngọt hay hạt nêm công nghiệp.',
  },
  {
    icon: Pill,
    category: 'Vi chất & Sức khỏe',
    title: 'Bổ sung B12, Sắt & Kẽm',
    prompt:
      'Người mới chuyển sang ăn chay cần lưu ý bổ sung Vitamin B12, Sắt và Kẽm từ những nguồn thực phẩm tự nhiên nào?',
  },
  {
    icon: Scale,
    category: 'Cân bằng Calo',
    title: 'Bữa trưa thuần chay 500 kcal',
    prompt:
      'Tính toán định lượng và calo cho một bữa trưa văn phòng thuần chay đủ no, cân đối khoảng 500 kcal.',
  },
];

export function ChatWelcome({ onSelectPrompt }: ChatWelcomeProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-4 text-center sm:py-6">
      {/* Brand Badge */}
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        <Sparkles className="size-3.5" />
        <span>Trợ lý Dinh dưỡng Thực vật VeggieConnect</span>
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Hôm nay bạn muốn nấu hoặc tìm hiểu món gì?
      </h2>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
        Tôi có thể giúp bạn giải đáp về giá trị dinh dưỡng, công thức món chay chuẩn Việt và cân đối
        calo theo thể trạng.
      </p>

      {/* Bento Grid Prompt Cards */}
      <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className="group relative cursor-pointer border-border/70 bg-card/60 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-emerald-500/[0.04] hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20">
                  <Icon className="size-4" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground/50 transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
              </div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">
                {item.category}
              </p>
              <h3 className="mt-0.5 text-sm font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                {item.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
