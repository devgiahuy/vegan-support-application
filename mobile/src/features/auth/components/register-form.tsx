import * as React from 'react';
import { Text, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowRight, CheckCircle2, Circle, Lock, Mail, User } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { TextField } from '@/components/ui/text-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useRegisterMutation } from '../queries/auth.queries';
import { registerSchema, type RegisterFormValues } from '../schemas/auth.schema';
import { getApiErrorCode, getApiErrorFields } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { ContributorToggleFields } from './contributor-toggle-fields';

function PasswordStrength({ value }: { value: string }) {
  const rules = [
    { label: 'Từ 8 ký tự', ok: value.length >= 8 },
    { label: '1 chữ HOA', ok: /[A-Z]/.test(value) },
    { label: '1 số (0-9)', ok: /[0-9]/.test(value) },
  ];
  const score = rules.filter((r) => r.ok).length;
  const label = !value
    ? 'Chưa nhập'
    : ['Rất yếu', 'Rất yếu', 'Trung bình', 'Khá mạnh', 'An toàn'][score];
  const barClass = ['bg-muted', 'bg-destructive', 'bg-cta', 'bg-sprout', 'bg-primary'][score];

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-muted-foreground">Độ an toàn mật khẩu:</Text>
        <Text className="text-xs font-medium text-foreground">{label}</Text>
      </View>
      <View className="flex-row gap-1">
        {[0, 1, 2, 3].map((i) => (
          <View key={i} className={cn('h-1.5 flex-1 rounded-full', i < score ? barClass : 'bg-muted')} />
        ))}
      </View>
      <View className="flex-row flex-wrap gap-3">
        {rules.map((r) => (
          <View key={r.label} className="flex-row items-center gap-1">
            {r.ok ? <CheckCircle2 size={13} color="#2e7d32" /> : <Circle size={13} color="#9ca3af" />}
            <Text className={cn('text-xs', r.ok ? 'text-primary' : 'text-muted-foreground')}>
              {r.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Form đăng ký tài khoản Member. Gọi API thật và tự đăng nhập sau khi thành công
 * (đồng bộ `frontend/src/features/auth/components/register-form.tsx`).
 * Lỗi nghiệp vụ đọc theo `error.code` (không branch theo text).
 */
export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const registerMutation = useRegisterMutation();
  const colors = useIconColors();
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      wantsContributor: false,
    },
  });

  const passwordValue = useWatch({ control, name: 'password' });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await registerMutation.mutateAsync(values);
      onSuccess?.();
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'EMAIL_ALREADY_EXISTS') {
        setError('email', { message: 'Email này đã được sử dụng. Vui lòng dùng email khác.' });
        return;
      }
      if (code === 'VALIDATION_ERROR') {
        const fields = getApiErrorFields(error);
        let mapped = false;
        if (fields) {
          for (const [key, messages] of Object.entries(fields)) {
            const field = key as keyof RegisterFormValues;
            const first = Array.isArray(messages) ? messages[0] : messages;
            setError(field, {
              message: typeof first === 'string' ? first : 'Giá trị không hợp lệ.',
            });
            mapped = true;
          }
        }
        if (mapped) return;
      }
      setFormError('Đăng ký thất bại. Vui lòng kiểm tra lại thông tin và thử lại.');
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
        name="displayName"
        render={({ field }) => (
          <TextField
            label="Họ và tên"
            icon={User}
            autoComplete="name"
            placeholder="Ví dụ: Lê Minh Tâm"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.displayName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Địa chỉ Email"
            icon={Mail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="ban@gmail.com"
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
          <View className="gap-1.5">
            <TextField
              label="Mật khẩu mới"
              icon={Lock}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              placeholder="Tối thiểu 8 ký tự..."
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
            />
            {!errors.password ? <PasswordStrength value={passwordValue ?? ''} /> : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field }) => (
          <TextField
            label="Nhập lại mật khẩu"
            icon={Lock}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            placeholder="Nhập lại mật khẩu..."
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.confirmPassword?.message}
          />
        )}
      />

      <ContributorToggleFields control={control} setValue={setValue} errors={errors} />

      <PrimaryButton
        label={registerMutation.isPending ? 'Đang tạo tài khoản...' : 'Tạo tài khoản VeggieConnect'}
        icon={<ArrowRight size={16} color={colors.primaryForeground} />}
        loading={registerMutation.isPending}
        onPress={onSubmit}
      />
    </View>
  );
}
