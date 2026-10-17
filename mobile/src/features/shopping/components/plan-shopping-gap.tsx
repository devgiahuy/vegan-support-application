import * as React from 'react';
import { Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { Warehouse } from 'lucide-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { useShoppingPreviewQuery } from '../queries/shopping.queries';
import type { SelectedShoppingMeal } from '../types/shopping.model';
import { ShoppingPreviewView } from './shopping-preview-view';

/**
 * "Đi chợ thông minh" cho một thực đơn tuần: đối chiếu các món đã xếp với Tủ bếp. Chỉ gọi API khi người dùng bấm,
 * không đổi số lượng tồn kho.
 */
export function PlanShoppingGap({ meals }: { meals: SelectedShoppingMeal[] }) {
  const colors = useIconColors();
  const signature = JSON.stringify(meals);
  const [requested, setRequested] = React.useState<{ signature: string; meals: SelectedShoppingMeal[] } | null>(null);
  // Thực đơn đổi món/khẩu phần thì kết quả cũ không còn đúng: bỏ kết quả, chờ người dùng bấm tính lại.
  const request = requested?.signature === signature ? requested.meals : null;
  const preview = useShoppingPreviewQuery(request);

  return (
    <View className="mt-4 gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-2">
        <Warehouse size={16} color={colors.primary} />
        <Text className="text-base font-bold text-foreground">Đi chợ thông minh</Text>
      </View>
      <Text className="text-xs leading-relaxed text-muted-foreground">
        Đối chiếu nguyên liệu của cả tuần với Tủ bếp để biết còn thiếu gì. Xem trước không thay đổi số lượng tồn.
      </Text>
      {meals.length === 0 ? (
        <Text className="text-sm text-muted-foreground">Thực đơn chưa có món nào để đối chiếu.</Text>
      ) : (
        <PrimaryButton
          label={request ? 'Tính lại' : 'Đối chiếu với Tủ bếp'}
          loading={Boolean(request) && preview.isFetching}
          onPress={() => {
            if (request) void preview.refetch();
            else setRequested({ signature, meals });
          }}
        />
      )}
      {request ? <ShoppingPreviewView preview={preview} /> : null}
      <Link href={'/pantry' as Href} asChild>
        <PrimaryButton label="Mở Tủ bếp" variant="outline" />
      </Link>
    </View>
  );
}
