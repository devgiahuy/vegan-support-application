import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/components/providers/query-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ThemeController } from '@/components/providers/theme-controller';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/layout/header';

export const metadata: Metadata = {
  title: 'WDP301 - Modern Frontend Architecture',
  description: 'Enterprise Frontend Architecture with Axios Interceptors, TanStack Query, Zustand, and Type Mapper Layer',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        <QueryProvider>
          <ThemeController>
            <AuthProvider>
              <Header />
              <main className="flex-1 container mx-auto p-4 md:p-6 max-w-7xl">
                {children}
              </main>
              <Toaster position="bottom-right" duration={3000} />
            </AuthProvider>
          </ThemeController>
        </QueryProvider>
      </body>
    </html>
  );
}
