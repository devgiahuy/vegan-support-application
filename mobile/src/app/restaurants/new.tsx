import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { Link, type Href, useRouter } from 'expo-router';
import { CheckCircle2, LocateFixed, MapPin, Send } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useGeocodeMutation, useSubmitRestaurantMutation } from '@/features/restaurant/queries/restaurant.queries';
import {
  MAX_CATEGORIES,
  MIN_ADDRESS_LENGTH,
  SUBMIT_DIET_TAG_OPTIONS,
} from '@/features/restaurant/schemas/restaurant.schema';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

interface Coordinates {
  lat: number;
  lng: number;
}

function parseCategories(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_CATEGORIES);
}

function submitErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);
  if (code === 'RESTAURANT_DUPLICATE') return 'Quán này đã có trong hệ thống nên không cần đề xuất lại.';
  if (code === 'VALIDATION_ERROR') return 'Thông tin chưa hợp lệ, vui lòng kiểm tra lại tên, địa chỉ và vị trí.';
  return getApiErrorMessage(error, 'Có lỗi xảy ra khi gửi đề xuất quán.');
}

/**
 * Đề xuất quán chay mới (`POST /restaurants`) — đồng bộ `submit-form.tsx` của web nhưng theo đúng hợp đồng
 * backend: bắt buộc có tọa độ (lấy từ địa chỉ hoặc vị trí hiện tại). Quán vào trạng thái chờ duyệt và chỉ
 * hiện công khai sau khi quản trị viên phê duyệt.
 */
export default function NewRestaurantScreen() {
  const colors = useIconColors();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const geocode = useGeocodeMutation();
  const submit = useSubmitRestaurantMutation();

  const [name, setName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [coords, setCoords] = React.useState<Coordinates | null>(null);
  const [dietTags, setDietTags] = React.useState<string[]>(['VEGAN']);
  const [categories, setCategories] = React.useState('');
  const [locating, setLocating] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const toggleDietTag = (tag: string) => {
    setDietTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  };

  const resolveAddress = async (): Promise<Coordinates | null> => {
    const trimmed = address.trim();
    if (trimmed.length < MIN_ADDRESS_LENGTH) {
      setMessage(`Vui lòng nhập địa chỉ đầy đủ (tối thiểu ${MIN_ADDRESS_LENGTH} ký tự).`);
      return null;
    }
    try {
      const result = await geocode.mutateAsync(trimmed);
      if (!result) {
        setMessage('Không xác định được vị trí từ địa chỉ này. Hãy nhập chi tiết hơn hoặc dùng vị trí hiện tại.');
        return null;
      }
      const resolved = { lat: result.lat, lng: result.lng };
      setCoords(resolved);
      return resolved;
    } catch (error) {
      setMessage(
        getApiErrorCode(error) === 'EXTERNAL_LOCATION_UNAVAILABLE'
          ? 'Dịch vụ tìm địa chỉ tạm thời không khả dụng. Hãy dùng vị trí hiện tại hoặc thử lại sau.'
          : getApiErrorMessage(error, 'Không phân giải được địa chỉ.')
      );
      return null;
    }
  };

  const requestCurrentPosition = async () => {
    setLocating(true);
    setMessage(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setMessage('Chưa có quyền vị trí. Hãy nhập địa chỉ và lấy tọa độ từ địa chỉ.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
    } catch {
      setMessage('Không lấy được vị trí hiện tại.');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    setMessage(null);
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setMessage('Vui lòng nhập tên quán (tối thiểu 2 ký tự).');
      return;
    }
    if (address.trim().length < MIN_ADDRESS_LENGTH) {
      setMessage(`Vui lòng nhập địa chỉ đầy đủ (tối thiểu ${MIN_ADDRESS_LENGTH} ký tự).`);
      return;
    }
    const position = coords ?? (await resolveAddress());
    if (!position) return;

    try {
      await submit.mutateAsync({
        name: cleanName,
        address: address.trim(),
        lat: position.lat,
        lng: position.lng,
        categories: parseCategories(categories),
        dietTags,
      });
      Alert.alert('Đã gửi quán mới', 'Quán đang chờ quản trị viên duyệt trước khi hiển thị công khai.');
      router.replace('/restaurants/mine' as Href);
    } catch (error) {
      setMessage(submitErrorMessage(error));
    }
  };

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-3xl border border-border bg-card p-6">
            <Text className="text-center text-xl font-bold text-foreground">Đăng nhập để đề xuất quán</Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              Quán bạn đề xuất sẽ được quản trị viên xem xét trước khi hiển thị công khai.
            </Text>
            <View className="mt-5 w-full">
              <Link href={'/(auth)/login' as Href} asChild>
                <PrimaryButton label="Đăng nhập ngay" />
              </Link>
            </View>
          </View>
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <View>
          <Text className="text-2xl font-bold tracking-tight text-foreground">Đề xuất quán chay mới</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Quán sẽ được quản trị viên xem xét và phê duyệt trước khi xuất hiện công khai.
          </Text>
        </View>

        <View className="gap-4">
          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Tên quán ăn *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="VD: Quán Cơm Chay Diệu Tâm"
              placeholderTextColor={colors.mutedForeground}
              className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
            />
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Địa chỉ cụ thể *</Text>
            <TextInput
              value={address}
              onChangeText={(value) => {
                setAddress(value);
                setCoords(null);
              }}
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              className="min-h-12 rounded-2xl border border-input bg-card px-3.5 py-3 text-sm text-foreground"
            />
          </View>

          <View className="gap-2 rounded-2xl border border-dashed border-border p-4">
            <Text className="text-xs font-bold uppercase text-muted-foreground">Vị trí trên bản đồ *</Text>
            {coords ? (
              <View className="flex-row items-center gap-1.5">
                <CheckCircle2 size={15} color={colors.primary} />
                <Text className="text-sm text-foreground">
                  Đã xác định: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </Text>
              </View>
            ) : (
              <Text className="text-sm text-muted-foreground">
                Chưa có tọa độ. Lấy từ địa chỉ hoặc dùng vị trí hiện tại (khi bạn đang đứng tại quán).
              </Text>
            )}
            <View className="flex-row gap-2">
              <PrimaryButton
                label="Lấy từ địa chỉ"
                variant="outline"
                className="flex-1"
                loading={geocode.isPending}
                icon={<MapPin size={15} color={colors.foreground} />}
                onPress={() => void resolveAddress()}
              />
              <PrimaryButton
                label="Vị trí hiện tại"
                variant="outline"
                className="flex-1"
                loading={locating}
                icon={<LocateFixed size={15} color={colors.foreground} />}
                onPress={() => void requestCurrentPosition()}
              />
            </View>
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Trường phái ăn chay áp dụng</Text>
            <View className="flex-row flex-wrap gap-1.5">
              {SUBMIT_DIET_TAG_OPTIONS.map((option) => {
                const selected = dietTags.includes(option.value);
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => toggleDietTag(option.value)}
                    className={cn('rounded-full px-3 py-1.5', selected ? 'bg-primary' : 'bg-muted')}>
                    <Text
                      className={cn(
                        'text-xs font-medium',
                        selected ? 'text-primary-foreground' : 'text-muted-foreground'
                      )}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">
              Loại hình & món nổi bật (cách nhau bởi dấu phẩy)
            </Text>
            <TextInput
              value={categories}
              onChangeText={setCategories}
              placeholder="VD: Cơm chay, Bún riêu chay, Lẩu nấm..."
              placeholderTextColor={colors.mutedForeground}
              className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
            />
          </View>
        </View>

        {message ? <Text className="text-sm text-destructive">{message}</Text> : null}

        <PrimaryButton
          label={submit.isPending ? 'Đang gửi...' : 'Gửi đề xuất quán'}
          loading={submit.isPending}
          icon={<Send size={16} color={colors.primaryForeground} />}
          onPress={() => void handleSubmit()}
        />
      </View>
    </SiteScreen>
  );
}
