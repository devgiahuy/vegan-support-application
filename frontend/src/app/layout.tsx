import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/query-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ThemeController } from '@/components/providers/theme-controller';
import { Toaster } from '@/components/ui/sonner';

const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VeggieConnect — Ăn chay đủ chất, dễ dàng mỗi ngày',
  description: 'Nền tảng cộng đồng, dinh dưỡng và bản đồ quán chay cho người ăn chay tại Việt Nam.',
  icons: {
    icon: [{ url: '/logo/logo-mark.png', type: 'image/png' }],
    apple: [{ url: '/logo/logo-mark.png', type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={beVietnam.variable} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <QueryProvider>
          <ThemeController>
            <AuthProvider>
              {children}
              <Toaster position="bottom-right" duration={3000} />
            </AuthProvider>
          </ThemeController>
        </QueryProvider>
      </body>
    </html>
  );
}
