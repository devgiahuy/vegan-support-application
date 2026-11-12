import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { LocateFixed, MapPin } from 'lucide-react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useColorScheme } from 'nativewind';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';

/** Minh họa bên dưới thẻ chọn vị trí khi chưa có khu vực — đồng bộ khối "Bữa chay tiếp theo bắt đầu từ đây" của web. */
function LocationIllustration() {
  const colors = useIconColors();
  const { colorScheme } = useColorScheme();
  const road = colorScheme === 'dark' ? '#0b1410' : '#ffffff';
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="min-h-[280px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary/40 p-6">
      <Svg width="100%" height="100%" viewBox="0 0 500 400" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
        <G fill="none" stroke={road} strokeWidth={24}>
          <Path d="M-30 80 L540 290 M80 -30 L350 440 M430 -30 L170 440 M-30 330 L540 120" />
        </G>
        <Circle cx={250} cy={200} r={115} fill={colors.primary} fillOpacity={0.04} stroke={colors.primary} strokeOpacity={0.15} strokeDasharray="5 8" />
      </Svg>
      <View className="items-center gap-3 rounded-2xl border border-border bg-background px-7 py-6 shadow-sm">
        <View className="size-16 items-center justify-center rounded-2xl bg-secondary">
          <MapPin size={32} color={colors.primary} strokeWidth={1.5} />
        </View>
        <Text className="text-center text-lg font-semibold text-foreground">Bữa chay tiếp theo{'\n'}bắt đầu từ đây.</Text>
        <Text className="max-w-[220px] text-center text-sm leading-5 text-muted-foreground">Chọn khu vực để xem những địa điểm quanh bạn.</Text>
      </View>
    </View>
  );
}

/**
 * Thẻ chọn khu vực tìm quán — đồng bộ `LocationPrompt` + `AddressForm` của web: nút "Dùng vị trí của tôi", dải phân cách
 * "hoặc tìm theo địa chỉ" và ô nhập địa chỉ. Vị trí chỉ lấy sau khi người dùng bấm nút, không có tọa độ mặc định.
 */
export function LocationPanel({
  hasLocation,
  locating,
  geocoding,
  error,
  onUseMyLocation,
  onSubmitAddress,
  onCancel,
}: {
  hasLocation: boolean;
  locating: boolean;
  geocoding: boolean;
  error: string | null;
  onUseMyLocation: () => void;
  /** Trả `true` khi địa chỉ được phân giải thành công để ô nhập được xóa. */
  onSubmitAddress: (address: string) => Promise<boolean>;
  onCancel: () => void;
}) {
  const colors = useIconColors();
  const [address, setAddress] = React.useState('');

  const submit = async () => {
    if (await onSubmitAddress(address)) setAddress('');
  };

  return (
    <View className="gap-4">
      <View className="gap-5 rounded-2xl border border-border bg-card p-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xl font-semibold text-foreground">{hasLocation ? 'Tìm ở một khu vực khác' : 'Bạn muốn tìm quán ở đâu?'}</Text>
            <Text className="mt-2 text-sm leading-5 text-muted-foreground">Chọn vị trí hiện tại hoặc nhập địa chỉ để khám phá các quán chay lân cận.</Text>
          </View>
          {hasLocation ? (
            <Pressable accessibilityRole="button" onPress={onCancel} hitSlop={8} className="h-11 justify-center px-2">
              <Text className="text-sm font-medium text-foreground">Hủy</Text>
            </Pressable>
          ) : null}
        </View>

        <View className="gap-4">
          <PrimaryButton
            label={locating ? 'Đang lấy vị trí...' : 'Dùng vị trí của tôi'}
            loading={locating}
            disabled={locating}
            icon={<LocateFixed size={16} color={colors.primaryForeground} />}
            onPress={onUseMyLocation}
          />
          <View className="flex-row items-center gap-3">
            <View className="h-px flex-1 bg-border" />
            <Text className="text-xs text-muted-foreground">hoặc tìm theo địa chỉ</Text>
            <View className="h-px flex-1 bg-border" />
          </View>
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Hoặc nhập địa chỉ</Text>
            <View className="h-12 flex-row items-center gap-2 rounded-xl border border-input bg-background px-3.5">
              <MapPin size={16} color={colors.mutedForeground} />
              <TextInput
                value={address}
                onChangeText={setAddress}
                onSubmitEditing={() => void submit()}
                returnKeyType="search"
                placeholder="VD: Hồ Gươm, Hà Nội"
                placeholderTextColor={colors.mutedForeground}
                className="h-12 flex-1 text-sm text-foreground"
              />
            </View>
          </View>
          <PrimaryButton label={geocoding ? 'Đang tìm...' : 'Tìm quán'} variant="outline" loading={geocoding} disabled={geocoding} onPress={() => void submit()} />
        </View>

        {error ? (
          <Text accessibilityRole="alert" className="text-sm font-medium text-destructive">
            {error}
          </Text>
        ) : null}
        <Text className="text-xs leading-5 text-muted-foreground">Vị trí của bạn chỉ dùng cho lần tìm này và không được lưu giữ.</Text>
      </View>

      {hasLocation ? null : <LocationIllustration />}
    </View>
  );
}
