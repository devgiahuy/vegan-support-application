import * as React from 'react';
import { ActivityIndicator, Pressable, type PressableProps, Text } from 'react-native';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';

interface PrimaryButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'outline';
}

/** Nút hành động chính, style theo brand VeggieConnect (bo góc 12px, cao 48px). */
export function PrimaryButton({
  label,
  loading,
  icon,
  variant = 'primary',
  className,
  disabled,
  ...props
}: PrimaryButtonProps) {
  const colors = useIconColors();
  const isDisabled = Boolean(disabled) || Boolean(loading);

  return (
    <Pressable
      disabled={isDisabled}
      className={cn(
        'h-12 flex-row items-center justify-center gap-2 rounded-xl',
        variant === 'primary' ? 'bg-primary' : 'border border-input bg-background',
        isDisabled ? 'opacity-60' : '',
        (className as string) ?? ''
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.primaryForeground : colors.primary} />
      ) : (
        <>
          <Text
            className={cn(
              'text-sm font-semibold',
              variant === 'primary' ? 'text-primary-foreground' : 'text-foreground'
            )}
          >
            {label}
          </Text>
          {icon}
        </>
      )}
    </Pressable>
  );
}
