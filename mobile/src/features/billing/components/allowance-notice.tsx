import { Link, type Href } from 'expo-router';
import { Text, View } from 'react-native';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useEntitlementsQuery } from '@/features/billing/queries/billing.queries';
import { billingErrorMessage } from '@/features/billing/lib/billing-errors';

export function AllowanceNotice({
  feature = 'PANTRY',
}: {
  feature?: 'PANTRY' | 'FRIDGE' | 'RECEIPT' | 'CHAT';
}) {
  const query = useEntitlementsQuery();
  if (query.isError)
    return (
      <View className="gap-2">
        <Text className="text-xs text-destructive">{billingErrorMessage(query.error)}</Text>
        <PrimaryButton
          variant="outline"
          label="Tải lại quyền lợi"
          onPress={() => void query.refetch()}
        />
      </View>
    );
  if (!query.data?.enabled) return null;
  const value =
    feature === 'PANTRY'
      ? query.data.pantryLabel
      : feature === 'CHAT'
        ? query.data.chatCredits + ' lượt chat mua thêm'
        : feature === 'FRIDGE'
          ? query.data.fridgeCredits + ' lượt quét tủ lạnh'
          : query.data.receiptCredits + ' lượt phân tích hóa đơn';
  return (
    <View className="gap-3 rounded-xl border border-border bg-muted p-4">
      <Text className="font-semibold text-foreground">{value}</Text>
      <Text className="text-xs leading-5 text-muted-foreground">
        {feature === 'PANTRY'
          ? 'Item chưa xóa, kể cả số lượng bằng 0, đều chiếm một ô.'
          : feature === 'CHAT'
            ? 'Lượt miễn phí được dùng trước; lỗi không mất lượt mua thêm.'
            : query.data.scanPolicyLabel}
      </Text>
      <Link href={'/billing' as Href} asChild>
        <PrimaryButton label="Mua thêm quyền lợi" variant="outline" />
      </Link>
    </View>
  );
}
