import * as React from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';

interface TextFieldProps extends TextInputProps {
  label: string;
  icon?: LucideIcon;
  error?: string;
  rightElement?: React.ReactNode;
}

/**
 * Input dùng chung cho form (label + icon trái + lỗi inline), style theo brand
 * VeggieConnect (đồng bộ `frontend/src/components/ui/input.tsx`).
 */
export function TextField({
  label,
  icon: Icon,
  error,
  rightElement,
  className,
  ...props
}: TextFieldProps) {
  const colors = useIconColors();

  return (
    <View className="gap-1.5">
      <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
      <View className="relative justify-center">
        {Icon ? (
          <View className="absolute left-3.5 z-10">
            <Icon size={16} color={colors.mutedForeground} />
          </View>
        ) : null}
        <TextInput
          placeholderTextColor={colors.mutedForeground}
          className={cn(
            'h-12 rounded-xl border border-input bg-background px-4 text-sm text-foreground',
            Icon ? 'pl-10' : '',
            rightElement ? 'pr-11' : '',
            error ? 'border-destructive' : '',
            className ?? ''
          )}
          {...props}
        />
        {rightElement ? <View className="absolute right-3.5">{rightElement}</View> : null}
      </View>
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}
