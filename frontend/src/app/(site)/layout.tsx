import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-clip">
      <SiteHeader />
      <main className="flex-1 w-full overflow-x-clip">{children}</main>
      <SiteFooter />
    </div>
  );
}
