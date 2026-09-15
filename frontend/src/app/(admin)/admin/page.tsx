'use client';

import * as React from 'react';
import {
  ClipboardCheck,
  Users,
  FolderTree,
  ScrollText,
  Hourglass,
  Check,
  X,
  Gavel,
  RefreshCw,
  ShieldAlert,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type Tab = 'queue' | 'users' | 'categories' | 'logs';

const KPIS = [
  {
    label: 'Công thức chờ duyệt',
    value: '48',
    sub: '+12 mới hôm nay • 6 bài cảnh báo cao',
    icon: ClipboardCheck,
    tone: 'text-cta',
  },
  {
    label: 'Người dùng hoạt động',
    value: '24,850',
    sub: '+320 tuần này • 98.2% tuân thủ',
    icon: Users,
    tone: 'text-primary',
  },
  {
    label: 'Báo cáo vi phạm',
    value: '15',
    sub: '5 bài report ≥ 5 cần xử lý ngay',
    icon: ShieldAlert,
    tone: 'text-destructive',
  },
  {
    label: 'Công thức đang live',
    value: '1,420',
    sub: '7 nhóm chính • 24 danh mục con',
    icon: FolderTree,
    tone: 'text-secondary-foreground',
  },
];

type QueueItem = {
  id: string;
  title: string;
  author: string;
  verified: boolean;
  time: string;
  category: string;
  status: 'pending' | 'reported' | 'approved';
  reports: number;
  reason?: string;
};

const QUEUE: QueueItem[] = [
  {
    id: '#1088',
    title: 'Lẩu Nấm Thập Cẩm Tiêu Xanh',
    author: 'MinhTrang_Vegan',
    verified: false,
    time: '10 phút trước',
    category: 'Món chính / Lẩu',
    status: 'reported',
    reports: 7,
    reason: 'Nghi có hạt nêm mặn & ảnh sao chép',
  },
  {
    id: '#1087',
    title: 'Bún Bò Huế Chay Nấm Đùi Gà',
    author: 'BepChaySaigon',
    verified: true,
    time: '45 phút trước',
    category: 'Bún / Mì / Phở',
    status: 'pending',
    reports: 0,
  },
  {
    id: '#1086',
    title: 'Gỏi Cuốn Ngũ Sắc Sốt Bơ Đậu Phộng',
    author: 'AnNhien99',
    verified: false,
    time: '2 giờ trước',
    category: 'Salad & Gỏi',
    status: 'pending',
    reports: 1,
  },
  {
    id: '#1085',
    title: 'Chả Lụa Chay Từ Váng Đậu Non',
    author: 'Chef_HungChay',
    verified: true,
    time: '4 giờ trước',
    category: 'Giả mặn thuần TV',
    status: 'reported',
    reports: 5,
  },
  {
    id: '#1084',
    title: 'Súp Bí Đỏ Hạt Sen Nước Cốt Dừa',
    author: 'ThanhTam_Green',
    verified: true,
    time: 'Hôm qua',
    category: 'Canh / Súp',
    status: 'approved',
    reports: 0,
  },
];

const USERS = [
  {
    name: 'Võ Minh Tuấn (Bạn)',
    email: 'tuan.vm@chayxanh.vn • UID #ADM-001',
    role: 'SuperAdmin',
    posts: '158 công thức',
    violations: '0 cảnh báo',
    status: 'Hoạt động',
    self: true,
  },
  {
    name: 'TranHoang_Spam',
    email: 'hoang99@tempmail.com • UID #USR-8821',
    role: 'Thành viên',
    posts: '2 bài (Đã ẩn)',
    violations: '3 lần vi phạm (Spam link)',
    status: 'Khóa 30 ngày',
  },
  {
    name: 'LanAnh_Cook',
    email: 'lananh.vegan@gmail.com • UID #CRE-349',
    role: 'Creator Món Chay',
    posts: '42 công thức',
    violations: '0 vi phạm',
    status: 'Đang hoạt động',
  },
];

const CATEGORIES = [
  {
    name: 'Món chính',
    slug: '/mon-chinh',
    count: 420,
    children: ['Món kho chay (145)', 'Món xào chay (190)', 'Món chiên/rán (85)'],
  },
  {
    name: 'Canh / Súp',
    slug: '/canh-sup',
    count: 210,
    children: ['Canh rau củ thanh nhiệt (120)', 'Súp bí đỏ hạt sen (90)'],
  },
  {
    name: 'Salad & Gỏi',
    slug: '/salad-goi',
    count: 180,
    children: ['Nộm hoa chuối (72)', 'Gỏi ngó sen (64)', 'Salad sốt chanh leo (44)'],
  },
  {
    name: 'Bún / Mì / Phở',
    slug: '/bun-mi-pho',
    count: 260,
    children: ['Bún bò Huế chay (98)', 'Phở nấm (84)'],
  },
];

const LOGS = [
  {
    actor: 'Admin Minh Trang',
    action: 'đã Duyệt công thức #REC-1092',
    time: '10:42 • Vừa xong',
    detail: 'Tác giả @bepchay_annhien • Đạt kiểm định 100% nguyên liệu thuần thực vật.',
  },
  {
    actor: 'Hệ thống Auto-Flag',
    action: 'đẩy bài #REC-1088 lên đầu hàng chờ',
    time: '10:15 • 27 phút trước',
    detail: 'Bài viết đạt 7 lượt báo cáo vi phạm từ cộng đồng.',
  },
  {
    actor: 'Mod Đức Hải',
    action: 'đã Khóa tạm thời @spam_bot_01',
    time: '09:30 • 1 giờ trước',
    detail: 'Thời hạn 30 ngày. Lý do: rải liên kết thương mại độc hại.',
  },
];

export default function AdminPage() {
  const [tab, setTab] = React.useState<Tab>('queue');
  const [selected, setSelected] = React.useState<string[]>(['#1088', '#1087']);
  const [queue, setQueue] = React.useState(QUEUE);
  const [rejectId, setRejectId] = React.useState<string | null>(null);
  const [slug, setSlug] = React.useState('');

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const approve = (id: string) => {
    setQueue((q) =>
      q.map((item) => (item.id === id ? { ...item, status: 'approved' as const } : item))
    );
    toast.success(`Đã duyệt bài ${id}`);
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'queue', label: 'Kiểm duyệt (48)', icon: ClipboardCheck },
    { id: 'users', label: 'Người dùng & Roles', icon: Users },
    { id: 'categories', label: 'Cây danh mục', icon: FolderTree },
    { id: 'logs', label: 'Audit logs', icon: ScrollText },
  ];

  return (
    <div>
      {/* Banner + KPI */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
            <BadgeCheckIcon /> Bảng Điều Hành Trung Tâm
            <Badge variant="secondary" className="rounded-full">
              RBAC V2.4
            </Badge>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hàng đợi duyệt: <strong className="text-foreground">48 yêu cầu</strong> • Chỉ SuperAdmin
            &amp; Moderator
          </p>
        </div>
        <Button variant="outline" size="icon" aria-label="Làm mới">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{k.label}</p>
                  <Icon className={cn('h-5 w-5', k.tone)} />
                </div>
                <p className="mt-1 text-2xl font-bold">{k.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="no-scrollbar mt-4 flex gap-1 overflow-x-auto rounded-full border bg-card p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium',
                tab === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB: QUEUE */}
      {tab === 'queue' && (
        <Card className="mt-4">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Tìm tên công thức, tác giả, ID..." className="pl-9" />
              </div>
              <div className="flex flex-wrap gap-2">
                {['Tất cả (48)', 'Chờ duyệt (42)', 'Report cao ≥ 5 (6)'].map((f, i) => (
                  <Badge
                    key={f}
                    variant={i === 0 ? 'default' : 'secondary'}
                    className="cursor-pointer rounded-full"
                  >
                    {f}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-4 py-2.5 text-sm">
              <Checkbox
                checked={selected.length === queue.length}
                onCheckedChange={(v) => setSelected(v ? queue.map((q) => q.id) : [])}
                aria-label="Chọn tất cả"
              />
              <span>
                Đang chọn: <strong>{selected.length}</strong> / {queue.length} (tối đa 50/lần)
              </span>
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  className="gap-1.5 rounded-full"
                  onClick={() => {
                    setQueue((q) =>
                      q.map((item) =>
                        selected.includes(item.id) ? { ...item, status: 'approved' as const } : item
                      )
                    );
                    toast.success(`Đã duyệt hàng loạt (${selected.length})`);
                    setSelected([]);
                  }}
                >
                  <Check className="h-3.5 w-3.5" /> Duyệt hàng loạt
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 rounded-full">
                  <X className="h-3.5 w-3.5" /> Từ chối
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Công thức &amp; Ảnh</TableHead>
                    <TableHead>Tác giả &amp; Thời gian</TableHead>
                    <TableHead>Chuyên mục</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((item) => (
                    <TableRow
                      key={item.id}
                      className={cn(item.status === 'reported' && 'bg-destructive/5')}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(item.id)}
                          onCheckedChange={() => toggleSelect(item.id)}
                          aria-label={`Chọn ${item.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {item.id} {item.title}
                        </p>
                        {item.reason && (
                          <p className="mt-0.5 text-xs text-destructive">Lý do: {item.reason}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {item.author} {item.verified ? '(đã xác minh)' : '(chưa xác minh)'}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </TableCell>
                      <TableCell className="text-sm">{item.category}</TableCell>
                      <TableCell>
                        {item.status === 'approved' ? (
                          <Badge className="rounded-full bg-primary/10 text-primary">
                            Đã duyệt
                          </Badge>
                        ) : item.status === 'reported' ? (
                          <Badge variant="destructive" className="rounded-full">
                            {item.reports} report
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-full">
                            Chờ duyệt
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {item.status !== 'approved' && (
                            <>
                              <Button
                                size="sm"
                                className="gap-1 rounded-full"
                                onClick={() => approve(item.id)}
                              >
                                <Check className="h-3.5 w-3.5" /> Duyệt
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 rounded-full text-destructive"
                                onClick={() => setRejectId(item.id)}
                              >
                                <Gavel className="h-3.5 w-3.5" /> Xử lý
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 p-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">Hiển thị 1 - 5 trên 48 bài chờ duyệt</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" aria-label="Trang trước">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {[1, 2, 3].map((p) => (
                  <Button
                    key={p}
                    variant={p === 1 ? 'default' : 'outline'}
                    size="icon"
                    className="rounded-full"
                  >
                    {p}
                  </Button>
                ))}
                <Button variant="outline" size="icon" aria-label="Trang sau">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB: USERS */}
      {tab === 'users' && (
        <Card className="mt-4">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Tìm theo tên, email, ID..." className="pl-9" />
              </div>
              <Button className="gap-1.5 rounded-full">
                <Plus className="h-4 w-4" /> Thêm Mod mới
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Bài đăng</TableHead>
                    <TableHead>Vi phạm</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {USERS.map((u) => (
                    <TableRow key={u.email}>
                      <TableCell>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-full">
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{u.posts}</TableCell>
                      <TableCell className="text-sm">{u.violations}</TableCell>
                      <TableCell className="text-sm">{u.status}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {u.self ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="rounded-full"
                              title="Không thể tự khóa chính mình"
                            >
                              Khóa tài khoản
                            </Button>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" className="rounded-full">
                                Đổi vai trò
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full text-destructive"
                                onClick={() => toast.info('Đã ghi nhận thao tác bảo mật')}
                              >
                                Khóa
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB: CATEGORIES */}
      {tab === 'categories' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="font-semibold">Tạo danh mục mới</h2>
              <p className="text-xs text-muted-foreground">
                Slug URL sẽ tự động chuẩn hoá tiếng Việt không dấu chuẩn SEO.
              </p>
              <div className="grid gap-1.5">
                <Label>Tên chuyên mục</Label>
                <Input
                  placeholder="Ví dụ: Món cuốn dinh dưỡng"
                  onChange={(e) =>
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[̀-ͯ]/g, '')
                        .replace(/đ/g, 'd')
                        .replace(/[^a-z0-9]+/g, '-')
                    )
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Đường dẫn tĩnh (Slug SEO)</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="mon-cuon-dinh-duong"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Danh mục cha</Label>
                <Select defaultValue="root">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">-- Danh mục gốc (Cấp 1) --</SelectItem>
                    <SelectItem value="mon-chinh">Món chính</SelectItem>
                    <SelectItem value="canh-sup">Canh / Súp</SelectItem>
                    <SelectItem value="salad-goi">Salad &amp; Gỏi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full rounded-xl"
                onClick={() => {
                  toast.success('Đã lưu danh mục');
                  setSlug('');
                }}
              >
                Lưu danh mục
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Cấu trúc cây 2 tầng</h2>
                <Badge variant="secondary" className="rounded-full">
                  7 nhóm chính • 1,420 bài
                </Badge>
              </div>
              <ul className="mt-4 space-y-3">
                {CATEGORIES.map((c, i) => (
                  <li key={c.slug} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {i + 1}. {c.name}{' '}
                        <span className="text-xs text-muted-foreground">({c.count} bài)</span>
                      </p>
                      <code className="rounded bg-muted px-2 py-0.5 text-xs">{c.slug}</code>
                    </div>
                    <ul className="mt-2 space-y-1 pl-4">
                      {c.children.map((child) => (
                        <li key={child} className="text-sm text-muted-foreground">
                          ↳ {child}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB: LOGS */}
      {tab === 'logs' && (
        <Card className="mt-4">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Nhật ký thao tác hệ thống</h2>
                <p className="text-xs text-muted-foreground">
                  Toàn bộ hành động quản trị viên và bot giám sát tự động theo chuẩn ISO-27001.
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
                <Download className="h-4 w-4" /> Xuất CSV
              </Button>
            </div>
            <ul className="mt-4 space-y-3">
              {LOGS.map((log) => (
                <li key={log.action} className="flex gap-3 rounded-xl border p-3">
                  <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="text-sm">
                    <p>
                      <strong>{log.actor}</strong> {log.action}
                    </p>
                    <p className="mt-0.5 text-muted-foreground">{log.detail}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{log.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Reject dialog */}
      <Dialog open={rejectId !== null} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Từ chối duyệt bài {rejectId}</DialogTitle>
            <DialogDescription>
              Phản hồi chi tiết sẽ được gửi cho tác giả để chỉnh sửa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Lý do từ chối *</Label>
              <Select defaultValue="category">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="non-vegan">Nghi vấn nguyên liệu không thuần chay</SelectItem>
                  <SelectItem value="category">Sai danh mục món ăn</SelectItem>
                  <SelectItem value="photo">Ảnh mờ hoặc sao chép bản quyền</SelectItem>
                  <SelectItem value="missing">Thiếu định lượng / hướng dẫn chưa rõ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Phản hồi chi tiết</Label>
              <Textarea rows={3} placeholder="Ghi rõ phần cần chỉnh sửa..." />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox />
              Ghi nhận cảnh cáo vi phạm vào hồ sơ tác giả
            </label>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Hủy bỏ
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                toast.success(`Đã từ chối ${rejectId} và ghi log`);
                setRejectId(null);
              }}
            >
              Xác nhận từ chối &amp; lưu log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BadgeCheckIcon() {
  return <ClipboardCheck className="inline h-6 w-6 text-primary" />;
}
