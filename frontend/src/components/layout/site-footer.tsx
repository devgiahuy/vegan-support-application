import Link from 'next/link';
import { ShieldCheck, Lock, Sprout } from 'lucide-react';
import { BrandLogo } from './brand-logo';

const COLUMNS = [
  {
    title: 'Khám phá',
    links: [
      { label: 'Món chay theo mùa', href: '/recipes' },
      { label: 'Video hướng dẫn nấu', href: '/videos' },
      { label: 'Danh mục món chay', href: '/categories' },
      { label: 'Thực đơn 7 ngày', href: '/meal-plans' },
      { label: 'Bản đồ quán chay', href: '/restaurants' },
      { label: 'Trợ lý AI dinh dưỡng', href: '/assistant' },
    ],
  },
  {
    title: 'Về VeggieConnect',
    links: [
      { label: 'Sứ mệnh sống xanh', href: '/' },
      { label: 'Đội ngũ chuyên gia', href: '/' },
      { label: 'Cộng đồng chay Việt', href: '/' },
      { label: 'Tin tức & Bài viết', href: '/' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Hướng dẫn sử dụng', href: '/' },
      { label: 'Chính sách dinh dưỡng', href: '/' },
      { label: 'Đóng góp công thức', href: '/recipes/new' },
      { label: 'Liên hệ hỗ trợ', href: '/' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 md:grid-cols-2 lg:grid-cols-5 lg:px-6">
        <div className="lg:col-span-2">
          <BrandLogo variant="horizontal" size="md" />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Ăn chay đủ chất, dễ dàng mỗi ngày. Đồng hành dinh dưỡng thực vật chuẩn vị Việt.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Bảo mật dữ liệu cá nhân
            </span>
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3.5 w-3.5 text-primary" /> Mã hoá SSL/TLS
            </span>
            <span className="inline-flex items-center gap-1">
              <Sprout className="h-3.5 w-3.5 text-primary" /> Cộng đồng lành tính
            </span>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold">{col.title}</h3>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row lg:px-6">
          <p>© 2026 VeggieConnect. Lan toả lối sống thuần thực vật an vui.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-primary">
              Điều khoản
            </Link>
            <Link href="/" className="hover:text-primary">
              Bảo mật
            </Link>
            <Link href="/" className="hover:text-primary">
              Cộng đồng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
