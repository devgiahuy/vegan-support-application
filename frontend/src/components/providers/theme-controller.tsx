'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';

/**
 * Bọc next-themes (attribute="class") để đồng bộ với
 * `@custom-variant dark` trong globals.css. Dùng useTheme() để đọc/đổi theme.
 */
export function ThemeController({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
