'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  BadgeCheck,
  MessageCircle,
  Trash2,
  Send,
  Copy,
  ThumbsUp,
  RefreshCw,
  BookmarkPlus,
  AlertTriangle,
  Phone,
  ImagePlus,
  Mic,
  Leaf,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

const HISTORY = [
  {
    group: 'Hôm nay',
    items: ['Thực đơn chay 1500 kcal đủ đạm', 'Cách nấu bún bò Huế chay chuẩn vị'],
  },
  {
    group: '7 ngày qua',
    items: [
      'Thay thế trứng trong làm bánh',
      'Phân tích vi chất B12 & Sắt',
      'Mâm cỗ chay Rằm tháng 7',
    ],
  },
];

const NUTRIENTS = [
  { name: 'Đậu hũ non + nước dùng', amount: '150g', kcal: 120, p: 11.2, c: 3.5, f: 7.1 },
  { name: 'Nấm đùi gà áp chảo', amount: '120g', kcal: 95, p: 8.4, c: 9.2, f: 2.8 },
  { name: 'Đậu Edamame rang muối hồng', amount: '80g', kcal: 110, p: 9.1, c: 8.0, f: 4.6 },
  { name: 'Cơm gạo lứt', amount: '1 chén', kcal: 110, p: 2.6, c: 24.1, f: 2.0 },
];

export default function AiAssistantPage() {
  const [messages, setMessages] = React.useState<{ from: 'user' | 'ai'; text: string }[]>([]);
  const [draft, setDraft] = React.useState('');

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: 'user', text }]);
    setDraft('');
    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          from: 'ai',
          text: 'Cảm ơn bạn! Đây là giao diện minh hoạ — AI dinh dưỡng sẽ trả lời chi tiết khi kết nối AI Gateway (UC-07). Hãy thử hỏi: "Tôi ăn chay trường theo Phật giáo thì bổ sung protein từ đâu?"',
        },
      ]);
    }, 600);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
      <div className="flex h-[calc(100vh-10rem)] min-h-[540px] gap-4 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 flex-col rounded-2xl border bg-card p-4 lg:flex">
          <Button className="gap-1.5 rounded-xl" onClick={() => setMessages([])}>
            <Plus className="h-4 w-4" /> Cuộc trò chuyện mới
          </Button>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm hội thoại cũ..." className="pl-9" />
          </div>
          <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
            <p className="flex items-center gap-1.5 font-semibold text-primary">
              <BadgeCheck className="h-4 w-4" /> Hội thoại bảo mật ChayXanh
            </p>
            <p className="mt-1 text-muted-foreground">
              Lưu lịch sử 90 ngày • Ngữ cảnh 10 lượt gần nhất
            </p>
          </div>

          <div className="mt-3 flex-1 space-y-3 overflow-y-auto">
            {HISTORY.map((g) => (
              <div key={g.group}>
                <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {g.group}
                </p>
                {g.items.map((item, i) => (
                  <button
                    key={item}
                    className={cn(
                      'mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm',
                      i === 0 && g.group === 'Hôm nay'
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'hover:bg-accent'
                    )}
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    <span className="line-clamp-1">{item}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-3 border-t pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Thành viên ChayXanh • 42/50 tin</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Xoá lịch sử">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Progress value={84} className="mt-2" />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Hạn mức ngày • Đặt lại lúc 00:00
            </p>
          </div>
        </aside>

        {/* Chat */}
        <div className="flex min-w-0 flex-1 flex-col rounded-2xl border bg-card">
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            <Badge className="gap-1.5 rounded-full">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-foreground" />
              Gemini 1.5 Flash • Bếp chay &amp; Dinh dưỡng
            </Badge>
            <span className="text-xs text-muted-foreground">480 tokens • 1.2s</span>
          </div>

          <div className="rounded-xl border border-cta/30 bg-cta/5 p-3 text-xs text-muted-foreground">
            <Brain className="mr-1 inline h-3.5 w-3.5 text-cta" />
            <strong className="text-foreground">Lưu ý:</strong> Trợ lý AI chuyên thuần chay &amp;
            công thức Việt. Không thay thế chẩn đoán y khoa. Thông tin mang tính tham khảo, không
            thay thế tư vấn từ chuyên gia dinh dưỡng/bác sĩ.
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <>
                <UserBubble
                  time="10:14"
                  text="Em tập gym, muốn 30g protein thực vật sau tập, món nào dễ nấu dưới 30 phút và phân tích luôn calo giúp em?"
                />
                <div className="max-w-[92%]">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Leaf className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-muted-foreground">ChayXanh AI (Gemini 1.5)</p>
                  </div>
                  <div className="ml-10 mt-2 rounded-2xl rounded-tl-sm border bg-muted/40 p-4">
                    <p className="font-semibold">
                      Đậu hũ sốt nấm đùi gà &amp; đậu Edamame rang muối hồng — ăn kèm cơm gạo lứt
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Thời gian: 22 phút • Độ khó: Dễ
                    </p>
                    <Table className="mt-3 bg-card">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nguyên liệu / Món</TableHead>
                          <TableHead>Khối lượng</TableHead>
                          <TableHead>Calo</TableHead>
                          <TableHead>Protein</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {NUTRIENTS.map((n) => (
                          <TableRow key={n.name}>
                            <TableCell className="font-medium">{n.name}</TableCell>
                            <TableCell>{n.amount}</TableCell>
                            <TableCell>{n.kcal} kcal</TableCell>
                            <TableCell>{n.p}g</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-primary/5 font-semibold">
                          <TableCell>Tổng</TableCell>
                          <TableCell>—</TableCell>
                          <TableCell>~435 kcal</TableCell>
                          <TableCell>31.3g</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        { icon: Copy, label: 'Sao chép' },
                        { icon: ThumbsUp, label: 'Đánh giá' },
                        { icon: RefreshCw, label: 'Thử lại' },
                        { icon: BookmarkPlus, label: 'Lưu vào Thực đơn tuần' },
                      ].map((a) => {
                        const Icon = a.icon;
                        return (
                          <Button
                            key={a.label}
                            variant="outline"
                            size="sm"
                            className="gap-1.5 rounded-full"
                            onClick={() => toast.success('Đã ghi nhận')}
                          >
                            <Icon className="h-3.5 w-3.5" /> {a.label}
                          </Button>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        'Thêm món vào giỏ đi chợ tuần',
                        'Gợi ý món thay thế Edamame',
                        'Cần bổ sung gì để hấp thu kẽm & sắt?',
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => setDraft(q)}
                          className="rounded-full border px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <UserBubble
                  time="10:22"
                  text="Em bị đau dạ dày dữ dội, có nên nhịn ăn thải độc 7 ngày không?"
                />
                <div className="max-w-[92%] rounded-2xl border-l-4 border-l-destructive bg-destructive/5 p-4">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
                    <AlertTriangle className="h-4 w-4" /> Từ chối tư vấn y tế với tình trạng cấp
                    tính
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Tôi không thể tư vấn cho cơn đau cấp tính. Hãy đến ngay cơ sở y tế gần nhất.
                    Không nhịn ăn hoàn toàn, không uống nước cam/chanh hay gia vị cay nóng. Uống
                    từng ngụm nước ấm nhỏ hoặc ăn vài thìa cháo loãng.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-3 gap-1.5 rounded-full"
                    asChild
                  >
                    <Link href="tel:115">
                      <Phone className="h-3.5 w-3.5" /> Cấp cứu y tế: Gọi 115
                    </Link>
                  </Button>
                </div>
              </>
            )}

            {messages.map((m, i) =>
              m.from === 'user' ? (
                <UserBubble key={i} time="Bây giờ" text={m.text} />
              ) : (
                <div key={i} className="max-w-[92%]">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Leaf className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-muted-foreground">ChayXanh AI</p>
                  </div>
                  <div className="ml-10 mt-2 rounded-2xl rounded-tl-sm border bg-muted/40 p-4 text-sm">
                    {m.text}
                  </div>
                </div>
              )
            )}
          </div>

          <div className="border-t p-3">
            <div className="flex items-end gap-2">
              <Button variant="ghost" size="icon" aria-label="Tải ảnh" className="shrink-0">
                <ImagePlus className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Ghi âm" className="shrink-0">
                <Mic className="h-5 w-5" />
              </Button>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Hỏi chuyên gia AI về công thức, dinh dưỡng... (Enter để gửi)"
                className="min-h-11 rounded-xl"
              />
              <Button size="icon" aria-label="Gửi" className="shrink-0 rounded-xl" onClick={send}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span>Đã sẵn sàng • Độ trễ 48ms</span>
              <span className="flex items-center gap-1.5">
                <Checkbox id="save-history" defaultChecked />{' '}
                <Label htmlFor="save-history" className="text-[11px]">
                  Lưu lịch sử để cá nhân hoá gợi ý
                </Label>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserBubble({ time, text }: { time: string; text: string }) {
  return (
    <div className="ml-auto max-w-[85%]">
      <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground">
        {text}
      </div>
      <p className="mt-1 text-right text-[11px] text-muted-foreground">Bạn • {time}</p>
    </div>
  );
}
