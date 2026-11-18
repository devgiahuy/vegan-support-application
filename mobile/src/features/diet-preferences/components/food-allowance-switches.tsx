import { Switch, Text, View } from 'react-native';

import { useIconColors } from '@/lib/theme-colors';
import type { FoodAllowanceSelection } from '@/features/diet-preferences/types/food-allowances.model';

export const FOOD_ALLOWANCE_OPTIONS: readonly {
  key: keyof FoodAllowanceSelection;
  label: string;
  description: string;
}[] = [
  { key: 'allowEggs', label: 'Ăn trứng', description: 'Cho phép trứng và các món có thành phần từ trứng.' },
  { key: 'allowDairy', label: 'Ăn sữa', description: 'Cho phép sữa động vật và các chế phẩm từ sữa.' },
  { key: 'allowHoney', label: 'Ăn mật ong', description: 'Cho phép mật ong và các món có mật ong.' },
  {
    key: 'allowFivePungent',
    label: 'Ăn ngũ vị tân',
    description: 'Cho phép hành, hẹ, tỏi, kiệu và hưng cừ.',
  },
];

/** Bốn lựa chọn độc lập: bật là được ăn, tắt là kiêng. */
export function FoodAllowanceSwitches({
  value,
  onChange,
  disabled = false,
}: {
  value: FoodAllowanceSelection;
  onChange: (value: FoodAllowanceSelection) => void;
  disabled?: boolean;
}) {
  const colors = useIconColors();

  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text className="text-lg font-semibold text-foreground">Bạn dùng những thực phẩm nào?</Text>
        <Text className="text-sm leading-5 text-muted-foreground">
          Bật để được ăn, tắt để kiêng. Các lựa chọn áp dụng mọi ngày. Thịt và cá luôn được loại khỏi gợi ý.
        </Text>
      </View>
      <View className="overflow-hidden rounded-xl border border-border bg-card">
        {FOOD_ALLOWANCE_OPTIONS.map((option, index) => (
          <View
            key={option.key}
            className={`flex-row items-center gap-4 p-4${index > 0 ? ' border-t border-border' : ''}`}
          >
            <View className="flex-1 gap-1">
              <Text className="text-sm font-semibold text-foreground">{option.label}</Text>
              <Text className="text-xs leading-5 text-muted-foreground">{option.description}</Text>
              <Text className="text-xs font-medium text-primary">
                {value[option.key] ? 'Được ăn' : 'Đang kiêng'}
              </Text>
            </View>
            <Switch
              accessibilityLabel={option.label}
              accessibilityHint={`${option.description} Bật là được ăn, tắt là kiêng.`}
              accessibilityState={{ checked: value[option.key], disabled }}
              value={value[option.key]}
              onValueChange={(allowed) => onChange({ ...value, [option.key]: allowed })}
              disabled={disabled}
              trackColor={{ false: colors.mutedForeground, true: colors.primary }}
            />
          </View>
        ))}
      </View>
      <Text className="text-xs leading-5 text-muted-foreground">
        Dị ứng và nguyên liệu bạn kiêng vẫn được ưu tiên, kể cả khi bật cho phép một nhóm thực phẩm.
      </Text>
    </View>
  );
}
