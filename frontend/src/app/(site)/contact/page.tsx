'use client';

import * as React from 'react';
import { Mail, MapPin, Phone, MessageSquare, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 lg:px-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <MessageSquare className="size-3.5" /> Kết nối cùng chúng tôi
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Liên hệ với VeggieConnect
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Mọi thắc mắc, đề xuất hợp tác hoặc hỗ trợ kỹ thuật, xin vui lòng liên hệ theo thông tin
          bên dưới.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Cột trái: Thông tin liên hệ */}
        <div className="space-y-4 lg:col-span-5">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="size-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-foreground">Email hỗ trợ</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">support@veggieconnect.vn</p>
                  <p className="text-xs text-muted-foreground">contact@veggieconnect.vn</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Phone className="size-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-foreground">Hotline</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    1900 6868 (8:00 - 18:00 Thứ 2 - Thứ 7)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-foreground">Trụ sở chính</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Quận 1, Thành phố Hồ Chí Minh, Việt Nam
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clock className="size-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-foreground">Thời gian phản hồi</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Trong vòng 24 giờ làm việc</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cột phải: Form gửi liên hệ */}
        <div className="lg:col-span-7">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-base font-bold text-foreground">Gửi tin nhắn trực tiếp</h2>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Cảm ơn bạn! Tin nhắn liên hệ đã được ghi nhận.');
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Họ và tên</label>
                    <Input placeholder="Nguyễn Văn A" required className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Email</label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      required
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Chủ đề</label>
                  <Input
                    placeholder="Hợp tác, hỗ trợ kỹ thuật..."
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Nội dung tin nhắn</label>
                  <Textarea
                    placeholder="Mô tả chi tiết câu hỏi hoặc yêu cầu của bạn..."
                    rows={4}
                    required
                    className="text-xs"
                  />
                </div>

                <Button type="submit" className="w-full sm:w-auto shadow-sm">
                  Gửi tin nhắn
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
