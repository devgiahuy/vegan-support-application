import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react-native';
import { TextField } from '@/components/ui/text-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useLoginMutation } from '../queries/auth.queries';
import { loginSchema, type LoginFormValues } from '../schemas/auth.schema';
import { getApiErrorCode, getApiErrorFields } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';

/**
 * Form đăng nhập email/mật khẩu. Lỗi nghiệp vụ đọc theo `error.code`
 * (đồng bộ `frontend/src/features/auth/components/login-form.tsx`):
 * - `INVALID_CREDENTIALS` → inline "Email hoặc mật khẩu không đúng."
 * - `ACCOUNT_LOCKED` / `ACCOUNT_BANNED` → thông báo lỗi đăng nhập thất bại chung.
 */
export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const loginMutation = useLoginMutation();
  const colors = useIconColors();
  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await loginMutation.mutateAsync(values);
      onSuccess?.();
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'INVALID_CREDENTIALS') {
        setFormError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
        return;
      }
      if (code === 'ACCOUNT_LOCKED' || code === 'ACCOUNT_BANNED') {
        setFormError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin và thử lại.');
        return;
      }
      if (code === 'VALIDATION_ERROR') {
        const fields = getApiErrorFields(error);
        let mapped = false;
        if (fields) {
          for (const [key, messages] of Object.entries(fields)) {
            const field = key as keyof LoginFormValues;
            const first = Array.isArray(messages) ? messages[0] : messages;
            setError(field, {
              message: typeof first === 'string' ? first : 'Giá trị không hợp lệ.',
            });
            mapped = true;
          }
        }
        if (mapped) return;
      }
      setFormError('Đăng nhập thất bại. Vui lòng thử lại.');
    }
  });

  return (
    <View className="gap-4">
      {formError ? (
        <View className="flex-row items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <AlertCircle size={16} color={colors.destructive} />
          <Text className="flex-1 text-sm text-destructive">{formError}</Text>
        </View>
      ) : null}

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Email hoặc Tên đăng nhập"
            icon={Mail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="vidu@veggieconnect.vn"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label="Mật khẩu"
            icon={Lock}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            placeholder="••••••••"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
            rightElement={
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                accessibilityLabel="Hiện/ẩn mật khẩu"
              >
                {showPassword ? (
                  <EyeOff size={16} color={colors.mutedForeground} />
                ) : (
                  <Eye size={16} color={colors.mutedForeground} />
                )}
              </Pressable>
            }
          />
        )}
      />

      <PrimaryButton
        label={loginMutation.isPending ? 'Đang xác thực...' : 'Đăng nhập'}
        icon={<LogIn size={16} color={colors.primaryForeground} />}
        loading={loginMutation.isPending}
        onPress={onSubmit}
      />
    </View>
  );
}
