import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';

import { FormSheet } from '@/components/shared/form-sheet';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';

/** Các đơn vị định lượng phổ biến — đồng bộ `COMMON_UNITS_CONFIG` của web. */
export const COMMON_UNITS_CONFIG = [
  {
    category: 'Khối lượng & Thể tích',
    units: [
      { value: 'g', label: 'g (gam)' },
      { value: 'kg', label: 'kg (kilôgam)' },
      { value: 'ml', label: 'ml (mililít)' },
      { value: 'l', label: 'l (lít)' },
      { value: 'muỗng canh', label: 'muỗng canh (tbsp)' },
      { value: 'muỗng cà phê', label: 'muỗng cà phê (tsp)' },
      { value: 'chén', label: 'chén (bát)' },
    ],
  },
  {
    category: 'Đơn vị đếm & Sơ chế',
    units: [
      { value: 'quả', label: 'quả / trái' },
      { value: 'củ', label: 'củ' },
      { value: 'tép', label: 'tép (tỏi/hành)' },
      { value: 'cây', label: 'cây (sả/hành)' },
      { value: 'nhánh', label: 'nhánh (gừng/cần)' },
      { value: 'lát', label: 'lát (miếng)' },
      { value: 'bìa', label: 'bìa (đậu hũ)' },
      { value: 'bó', label: 'bó (rau)' },
      { value: 'gói', label: 'gói' },
      { value: 'hộp', label: 'hộp' },
      { value: 'lon', label: 'lon' },
      { value: 'tai', label: 'tai (nấm/mộc nhĩ)' },
      { value: 'nắm', label: 'nắm' },
      { value: 'chút', label: 'chút / nhúm' },
    ],
  },
] as const;

export interface UnitGroup {
  category: string;
  units: readonly { value: string; label: string }[];
}

/** Chọn đơn vị từ danh sách nhóm sẵn (mặc định là danh sách công thức) hoặc "Tự nhập đơn vị khác…". */
export function RecipeUnitPicker({
  value,
  onChange,
  invalid,
  label,
  groups = COMMON_UNITS_CONFIG,
}: {
  value: string;
  onChange: (unit: string) => void;
  invalid?: boolean;
  label: string;
  groups?: readonly UnitGroup[];
}) {
  const colors = useIconColors();
  const [open, setOpen] = React.useState(false);
  const [custom, setCustom] = React.useState(false);

  if (custom) {
    return (
      <View className={cn('h-11 flex-row items-center rounded-xl border bg-background pl-3', invalid ? 'border-destructive/60' : 'border-input')}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChange}
          placeholder="Nhập đơn vị"
          placeholderTextColor={colors.mutedForeground}
          maxLength={40}
          autoFocus
          className="h-11 flex-1 text-sm text-foreground"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại danh sách đơn vị"
          onPress={() => {
            setCustom(false);
            onChange('g');
          }}
          className="h-11 w-10 items-center justify-center">
          <X size={14} color={colors.mutedForeground} />
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'chưa chọn'}`}
        onPress={() => setOpen(true)}
        className={cn('h-11 flex-row items-center gap-1 rounded-xl border bg-background px-3', invalid ? 'border-destructive/60' : 'border-input')}>
        <Text numberOfLines={1} className={cn('flex-1 text-sm', value ? 'text-foreground' : 'text-muted-foreground')}>
          {value || 'Đơn vị'}
        </Text>
        <ChevronDown size={14} color={colors.mutedForeground} />
      </Pressable>
      {open ? (
        <FormSheet title="Chọn đơn vị" variant="popup" onClose={() => setOpen(false)}>
          {groups.map((group) => (
            <View key={group.category} className="gap-1">
              <Text className="text-[11px] font-semibold uppercase text-muted-foreground">{group.category}</Text>
              {group.units.map((unit) => (
                <Pressable
                  key={unit.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: value === unit.value }}
                  onPress={() => {
                    onChange(unit.value);
                    setOpen(false);
                  }}
                  className={cn('min-h-11 justify-center rounded-xl px-3 py-2', value === unit.value ? 'bg-primary/10' : 'active:bg-muted')}>
                  <Text className={cn('text-sm', value === unit.value ? 'font-semibold text-primary' : 'text-foreground')}>{unit.label}</Text>
                </Pressable>
              ))}
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setOpen(false);
              setCustom(true);
              onChange('');
            }}
            className="min-h-11 justify-center rounded-xl px-3 py-2 active:bg-muted">
            <Text className="text-sm font-semibold text-primary">Tự nhập đơn vị khác…</Text>
          </Pressable>
        </FormSheet>
      ) : null}
    </>
  );
}
