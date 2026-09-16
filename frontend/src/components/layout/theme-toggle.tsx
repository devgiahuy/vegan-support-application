'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { InnerMoon } from '@/components/ui/inner-moon';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // Tránh hydration mismatch khi đọc theme của next-themes (chỉ có trên client).
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const isDark = mounted && resolvedTheme === 'dark';

  const handleToggle = React.useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      className="relative text-[1.25rem] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      <InnerMoon
        toggled={isDark}
        onClick={handleToggle}
        title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        aria-label={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      />
    </Button>
  );
}
