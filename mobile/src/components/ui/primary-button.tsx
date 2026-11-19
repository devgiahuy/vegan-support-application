import * as React from 'react';
import { ActivityIndicator, Pressable, type PressableProps, Text } from 'react-native';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';

export type ButtonVariant = 'primary' | 'outline' | 'secondary' | 'destructive' | 'ghost';

interface PrimaryButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
  icon?: React.ReactNode;
  /** Vị trí icon so với nhãn: `right` (mặc định) hoặc `left`. */
  iconPosition?: 'left' | 'right';
  variant?: ButtonVariant;
}

const CONTAINER_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary active:opacity-90',
  outline: 'border border-input bg-background active:bg-muted',
  secondary: 'bg-secondary active:opacity-85',
  destructive: 'bg-destructive active:opacity-90',
  ghost: 'bg-transparent active:bg-muted',
};

const TEXT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'text-primary-foreground',
  outline: 'text-foreground',
  secondary: 'text-secondary-foreground',
  destructive: 'text-destructive-foreground',
  ghost: 'text-foreground',
};

/** Nút hành động chuẩn mobile (cao tối thiểu 48dp, bo góc 12px, hỗ trợ primary/outline/secondary/destructive/ghost). */
export function PrimaryButton({
  label,
  loading,
  icon,
  iconPosition = 'right',
  variant = 'primary',
  className,
  disabled,
  ...props
}: PrimaryButtonProps) {
  const colors = useIconColors();
  const isDisabled = Boolean(disabled) || Boolean(loading);
  const textOnly = !icon && !loading;

  const spinnerColor =
    variant === 'primary'
      ? colors.primaryForeground
      : variant === 'destructive'
        ? '#ffffff'
        : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: Boolean(loading) }}
      disabled={isDisabled}
      className={cn(
        'h-12 flex-row items-center justify-center gap-2 rounded-xl px-3.5',
        CONTAINER_CLASSES[variant],
        isDisabled ? 'opacity-60' : '',
        (className as string) ?? ''
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : iconPosition === 'left' ? (
        icon
      ) : null}
      <Text
        numberOfLines={textOnly ? 1 : undefined}
        style={textOnly ? { width: '100%', textAlign: 'center' } : { flexShrink: 0, textAlign: 'center' }}
        className={cn('text-sm font-semibold', TEXT_CLASSES[variant])}
      >
        {label}
      </Text>
      {loading || iconPosition === 'left' ? null : icon}
    </Pressable>
  );
}
