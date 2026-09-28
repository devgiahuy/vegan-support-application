import * as React from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { useWatch, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import { ContributorApprovalBasis } from '@/common/enums';
import type { RegisterFormValues } from '../schemas/auth.schema';

const APPROVAL_BASIS_OPTIONS: {
  value: 'ORGANIZATION_AFFILIATION' | 'PLATFORM_TRACK_RECORD';
  label: string;
  note: string;
}[] = [
  {
    value: ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
    label: 'Có tổ chức/đơn vị liên kết',
    note: 'Ví dụ: nhà hàng chay, phòng khám dinh dưỡng, trung tâm dạy nấu ăn...',
  },
  {
    value: ContributorApprovalBasis.PLATFORM_TRACK_RECORD,
    label: 'Kinh nghiệm thực hành cá nhân',
    note: 'Không thuộc tổ chức nào, xét theo kinh nghiệm bạn mô tả bên dưới.',
  },
];

/**
 * Khối nguyện vọng Contributor trong form đăng ký (tùy chọn, BL-01, hợp đồng Phase 14
 * — thay `requestedType` cũ bằng `claimedApprovalBasis`). Chỉ thu thập nguyện vọng —
 * tài khoản vẫn là Member chờ Admin duyệt, KHÔNG cấp quyền, và mọi basis được duyệt
 * đều có cùng quyền hạn như nhau (basis chỉ là căn cứ xét duyệt).
 * Bản rút gọn của `frontend/src/features/auth/components/contributor-request-fields.tsx`.
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
  const claimedApprovalBasis = useWatch({ control, name: 'claimedApprovalBasis' });
  const organizationClaim = useWatch({ control, name: 'organizationClaim' }) ?? '';
  const experience = useWatch({ control, name: 'experience' }) ?? '';
  const referenceLinks = useWatch({ control, name: 'referenceLinks' }) ?? '';

  const selectBasis = (value: 'ORGANIZATION_AFFILIATION' | 'PLATFORM_TRACK_RECORD') => {
    setValue('claimedApprovalBasis', value);
    // Đổi sang basis không phải tổ chức thì xoá khai báo tổ chức — backend từ chối
    // nếu gửi kèm `organizationClaim` cho basis PLATFORM_TRACK_RECORD.
    if (value !== 'ORGANIZATION_AFFILIATION') {
      setValue('organizationClaim', '');
    }
  };

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
              Căn cứ nguyện vọng
            </Text>
            <View className="gap-2">
              {APPROVAL_BASIS_OPTIONS.map((option) => {
                const selected = claimedApprovalBasis === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => selectBasis(option.value)}
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
                    <Text className="mt-0.5 text-xs text-muted-foreground">{option.note}</Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.claimedApprovalBasis ? (
              <Text className="text-xs text-destructive">{errors.claimedApprovalBasis.message}</Text>
            ) : null}
          </View>

          {claimedApprovalBasis === 'ORGANIZATION_AFFILIATION' ? (
            <View className="gap-1.5">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tên/mô tả tổ chức
              </Text>
              <TextInput
                value={organizationClaim}
                onChangeText={(text) => setValue('organizationClaim', text)}
                placeholder="Ví dụ: Nhà hàng chay Tâm An, Quận 3, TP.HCM"
                placeholderTextColor={colors.mutedForeground}
                maxLength={500}
                className="rounded-xl border border-input bg-background p-3 text-sm text-foreground"
              />
              {errors.organizationClaim ? (
                <Text className="text-xs text-destructive">{errors.organizationClaim.message}</Text>
              ) : null}
            </View>
          ) : null}

          <View className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kinh nghiệm của bạn
              </Text>
              <Text className="text-xs text-muted-foreground">{experience.length}/2000</Text>
            </View>
            <TextInput
              value={experience}
              onChangeText={(text) => setValue('experience', text)}
              placeholder="Mô tả ít nhất 20 ký tự. Ví dụ: 5 năm nấu món chay cho gia đình, từng mở lớp hướng dẫn..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              maxLength={2000}
              className="min-h-20 rounded-xl border border-input bg-background p-3 text-sm text-foreground"
              textAlignVertical="top"
            />
            {errors.experience ? (
              <Text className="text-xs text-destructive">{errors.experience.message}</Text>
            ) : null}
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Link tham khảo (không bắt buộc)
            </Text>
            <TextInput
              value={referenceLinks}
              onChangeText={(text) => setValue('referenceLinks', text)}
              placeholder={'Mỗi dòng một link, tối đa 5 link\nhttps://...'}
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={2}
              autoCapitalize="none"
              keyboardType="url"
              className="min-h-14 rounded-xl border border-input bg-background p-3 text-sm text-foreground"
              textAlignVertical="top"
            />
            {errors.referenceLinks ? (
              <Text className="text-xs text-destructive">{errors.referenceLinks.message}</Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
