'use client';

import * as React from 'react';
import { MessageSquarePlus, Bug, Sparkles, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 lg:px-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <MessageSquarePlus className="size-3.5" /> Lắng nghe người dùng
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Góp ý & Báo lỗi
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Mỗi phản hồi của bạn là động lực to lớn giúp VeggieConnect ngày càng hoàn thiện và phục vụ
          cộng đồng tốt hơn.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              alert('Cảm ơn bạn đã đóng góp phản hồi quý báu!');
            }}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Loại phản hồi</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <label className="flex items-center gap-2 rounded-xl border p-3 cursor-pointer text-xs font-medium hover:border-primary/50 transition-colors">
                  <input
                    type="radio"
                    name="feedback_type"
                    defaultChecked
                    className="text-primary"
                  />
                  <Bug className="size-4 text-rose-500" /> Báo lỗi kỹ thuật
                </label>
                <label className="flex items-center gap-2 rounded-xl border p-3 cursor-pointer text-xs font-medium hover:border-primary/50 transition-colors">
                  <input type="radio" name="feedback_type" className="text-primary" />
                  <Sparkles className="size-4 text-amber-500" /> Góp ý tính năng
                </label>
                <label className="flex items-center gap-2 rounded-xl border p-3 cursor-pointer text-xs font-medium hover:border-primary/50 transition-colors col-span-2 sm:col-span-1">
                  <input type="radio" name="feedback_type" className="text-primary" />
                  <MessageSquarePlus className="size-4 text-emerald-500" /> Ý kiến khác
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Tiêu đề phản hồi</label>
              <Input placeholder="Tóm tắt ngắn gọn vấn đề..." required className="h-9 text-xs" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Mô tả chi tiết</label>
              <Textarea
                placeholder="Vui lòng mô tả các bước gặp lỗi hoặc ý tưởng cải tiến của bạn..."
                rows={5}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Email của bạn (không bắt buộc)
              </label>
              <Input
                type="email"
                placeholder="Để chúng tôi phản hồi kết quả xử lý..."
                className="h-9 text-xs"
              />
            </div>

            <Button type="submit" className="w-full sm:w-auto shadow-sm gap-2">
              <Send className="size-3.5" /> Gửi phản hồi
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
