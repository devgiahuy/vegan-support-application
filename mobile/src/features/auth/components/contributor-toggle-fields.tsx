import * as React from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { useWatch, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import { ContributorType } from '@/common/enums';
import type { RegisterFormValues } from '../schemas/auth.schema';

const REQUESTED_TYPE_OPTIONS: { value: ContributorType; label: string }[] = [
  { value: ContributorType.EXPERIENCED_PRACTITIONER, label: 'Người thực hành có kinh nghiệm' },
  { value: ContributorType.NUTRITION_EXPERT, label: 'Chuyên gia dinh dưỡng' },
];

/**
 * Khối nguyện vọng Contributor trong form đăng ký (tùy chọn, BL-01).
 * Chỉ thu thập nguyện vọng — tài khoản vẫn là Member chờ Admin duyệt, không cấp quyền.
 * Bản rút gọn của `frontend/src/features/auth/components/contributor-request-fields.tsx`
 * cho mobile (chip chọn loại thay vì Select, chưa có ô link tham khảo).
 */
export function ContributorToggleFields({
  control,
  setValue,
  errors,
}: {
  control: Control<RegisterFormValues>;
  setValue: UseFormSetValue<RegisterFormValues>;
  errors: FieldErrors<RegisterFormValues>;
}) {
  const colors = useIconColors();
  const wantsContributor = useWatch({ control, name: 'wantsContributor' });
  const requestedType = useWatch({ control, name: 'requestedType' });
  const experience = useWatch({ control, name: 'experience' }) ?? '';

  return (
    <View className="gap-3 rounded-xl border border-dashed border-border p-4">
      <Pressable
        className="flex-row items-start gap-2.5"
        onPress={() => setValue('wantsContributor', !wantsContributor)}
      >
        <Switch
          value={wantsContributor}
          onValueChange={(v) => setValue('wantsContributor', v)}
          trackColor={{ true: colors.primary }}
        />
        <View className="flex-1">
          <Text className="text-sm font-medium text-foreground">
            Tôi muốn trở thành Contributor
          </Text>
          <Text className="text-xs text-muted-foreground">
            Tài khoản của bạn vẫn là Member. Đơn sẽ được admin duyệt sau.
          </Text>
        </View>
      </Pressable>

      {wantsContributor ? (
        <View className="gap-3 pt-1">
          <View className="gap-1.5">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bạn là ai?
            </Text>
            <View className="gap-2">
              {REQUESTED_TYPE_OPTIONS.map((option) => {
                const selected = requestedType === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setValue('requestedType', option.value)}
                    className={cn(
                      'rounded-xl border px-3.5 py-3',
                      selected ? 'border-primary bg-primary/10' : 'border-input bg-background'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-sm',
                        selected ? 'font-semibold text-primary' : 'text-foreground'
                      )}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.requestedType ? (
              <Text className="text-xs text-destructive">{errors.requestedType.message}</Text>
            ) : null}
          </View>

          <View className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kinh nghiệm của bạn
              </Text>
              <Text className="text-xs text-muted-foreground">{experience.length}/1000</Text>
            </View>
            <TextInput
              value={experience}
              onChangeText={(text) => setValue('experience', text)}
              placeholder="Ví dụ: 5 năm nấu món chay cho gia đình, từng mở lớp hướng dẫn..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              maxLength={1000}
              className="min-h-20 rounded-xl border border-input bg-background p-3 text-sm text-foreground"
              textAlignVertical="top"
            />
            {errors.experience ? (
              <Text className="text-xs text-destructive">{errors.experience.message}</Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
