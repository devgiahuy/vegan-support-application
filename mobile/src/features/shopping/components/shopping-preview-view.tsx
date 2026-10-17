import { Text, View } from 'react-native';
import type { UseQueryResult } from '@tanstack/react-query';

import { ErrorState, LoadingState } from '@/components/shared/state-views';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import type { ShoppingPreview } from '../types/shopping.model';

/** Kết quả đối chiếu nguyên liệu với Tủ bếp (`POST /shopping-lists/preview`): trạng thái tải/lỗi và danh sách cần mua. */
export function ShoppingPreviewView({ preview }: { preview: UseQueryResult<ShoppingPreview> }) {
  if (preview.isLoading) return <LoadingState message="Đang đối chiếu tủ bếp..." />;
  if (preview.isError) {
    return (
      <ErrorState
        title="Không tính được danh sách"
        description={
          getApiErrorCode(preview.error) === 'SHOPPING_MEAL_NOT_FOUND'
            ? 'Có món đã bị xóa hoặc không còn truy cập được. Bỏ món đó rồi tính lại.'
            : getApiErrorMessage(preview.error)
        }
        onRetry={() => void preview.refetch()}
      />
    );
  }
  if (!preview.data) return null;

  return (
    <View className="gap-3">
      <Text className="text-lg font-bold text-foreground">Cần mua thêm {preview.data.missingItemCount} nguyên liệu</Text>
      <Text className="text-xs text-muted-foreground">
        Tủ bếp tại {new Date(preview.data.pantryAsOf).toLocaleString('vi-VN')}
      </Text>
      {preview.data.items.map((item, index) => (
        <View key={`${item.id}-${index}`} className="gap-2 rounded-lg border border-border p-4">
          <Text className="font-bold text-foreground">{item.name}</Text>
          <Text className="text-sm text-primary">{item.needsPurchase ? `Cần mua: ${item.missing}` : 'Đã có đủ'}</Text>
          <Text className="text-sm text-muted-foreground">
            Cần: {item.required} · Có: {item.available}
          </Text>
          <Text className="text-sm text-muted-foreground">Dư: {item.surplus}</Text>
          <Text className="text-xs text-muted-foreground">Mức tin cậy quy đổi: {item.confidencePercent}%</Text>
          <Text className="text-xs text-muted-foreground">{item.mealNames.join(', ')}</Text>
          {item.assumptions.map((assumption, position) => (
            <Text key={position} className="text-xs text-muted-foreground">
              {assumption}
            </Text>
          ))}
        </View>
      ))}
      {preview.data.unresolvedItems.length ? (
        <Text className="text-lg font-bold text-foreground">Cần kiểm tra thêm</Text>
      ) : null}
      {preview.data.unresolvedItems.map((item, index) => (
        <View key={index} className="gap-2 border-l-4 border-amber-500 px-3 py-2">
          <Text className="font-semibold text-foreground">
            {item.name}: {item.required}
          </Text>
          <Text className="text-sm text-muted-foreground">{item.reason}</Text>
          <Text className="text-sm text-muted-foreground">{item.explanation}</Text>
          <Text className="text-xs text-muted-foreground">{item.mealNames.join(', ')}</Text>
        </View>
      ))}
    </View>
  );
}
