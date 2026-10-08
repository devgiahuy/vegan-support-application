import * as React from 'react';
import { Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';

/** Phần đầu trang tĩnh: nhãn có icon, tiêu đề, mô tả — dùng chung cho các trang giới thiệu/hỗ trợ/pháp lý. */
export function StaticHero({
  badge,
  badgeIcon: BadgeIcon,
  title,
  subtitle,
  centered = false,
  updatedAt,
}: {
  badge: string;
  badgeIcon: LucideIcon;
  title: React.ReactNode;
  subtitle?: string;
  centered?: boolean;
  updatedAt?: string;
}) {
  const colors = useIconColors();
  return (
    <View className={cn('gap-3', centered ? 'items-center' : '')}>
      <View className="flex-row items-center gap-1.5 self-start rounded-full bg-primary/10 px-3 py-1.5">
        <BadgeIcon size={13} color={colors.primary} />
        <Text className="text-xs font-semibold text-primary">{badge}</Text>
      </View>
      <Text className={cn('text-3xl font-extrabold leading-tight tracking-tight text-foreground', centered ? 'text-center' : '')}>
        {title}
      </Text>
      {subtitle ? (
        <Text className={cn('text-sm leading-relaxed text-muted-foreground', centered ? 'text-center' : '')}>{subtitle}</Text>
      ) : null}
      {updatedAt ? <Text className="text-xs text-muted-foreground">{updatedAt}</Text> : null}
    </View>
  );
}

/** Mục có tiêu đề và đoạn văn/danh sách bên dưới. */
export function StaticSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-base font-bold text-foreground">{title}</Text>
      {children}
    </View>
  );
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return <Text className="text-sm leading-relaxed text-muted-foreground">{children}</Text>;
}

/** Danh sách gạch đầu dòng; mỗi mục có thể có phần in đậm đứng trước (`lead`). */
export function BulletList({ items }: { items: { lead?: string; text: string }[] }) {
  return (
    <View className="gap-1.5">
      {items.map((item) => (
        <View key={`${item.lead ?? ''}${item.text}`} className="flex-row gap-2">
          <Text className="w-4 text-sm text-muted-foreground">•</Text>
          <Text className="flex-1 text-sm leading-relaxed text-muted-foreground">
            {item.lead ? <Text className="font-semibold text-foreground">{item.lead} </Text> : null}
            {item.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Thẻ có icon tròn bo góc, tiêu đề và mô tả ngắn. */
export function IconCard({
  icon: Icon,
  title,
  description,
  tone = 'primary',
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: 'primary' | 'solid';
}) {
  const colors = useIconColors();
  return (
    <View className="gap-2 rounded-2xl border border-border bg-card p-4">
      <View className={cn('h-10 w-10 items-center justify-center rounded-xl', tone === 'solid' ? 'bg-primary' : 'bg-primary/10')}>
        <Icon size={18} color={tone === 'solid' ? colors.primaryForeground : colors.primary} />
      </View>
      <Text className="text-base font-bold text-foreground">{title}</Text>
      <Text className="text-sm leading-relaxed text-muted-foreground">{description}</Text>
    </View>
  );
}
