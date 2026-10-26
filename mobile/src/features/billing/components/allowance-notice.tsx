import { Link, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { MessageSquare, Zap } from 'lucide-react-native';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useEntitlementsQuery } from '@/features/billing/queries/billing.queries';
import { billingErrorMessage } from '@/features/billing/lib/billing-errors';

/**
 * `freeExhausted` chỉ dùng cho `CHAT`: khối này chỉ hiện khi lượt miễn phí đã dùng hết (BE báo `exhausted`) và không còn
 * lượt mua thêm — lúc đó mới cần nhắc mua thêm. Còn lượt thì ẩn để màn chat gọn.
 */
export function AllowanceNotice({
  feature = 'PANTRY',
  freeExhausted = false,
}: {
  feature?: 'PANTRY' | 'FRIDGE' | 'RECEIPT' | 'CHAT';
  freeExhausted?: boolean;
}) {
  const query = useEntitlementsQuery();
  if (feature === 'CHAT') {
    if (!freeExhausted || !query.data?.enabled || query.data.chatCredits > 0) return null;
    return (
      <View className="gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5">
        <View className="flex-row items-center gap-3">
          <View className="size-10 items-center justify-center rounded-xl bg-amber-500/20">
            <MessageSquare size={18} color="#b45309" />
          </View>
          <View className="flex-1 gap-0.5">
            <View className="flex-row flex-wrap items-center gap-x-2 gap-y-0.5">
              <View className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-2 py-0.5">
                <Text className="text-sm font-extrabold text-amber-800 dark:text-amber-200">{query.data.chatCredits}</Text>
              </View>
              <Text className="text-sm font-bold text-amber-900 dark:text-amber-100">lượt chat mua thêm</Text>
              <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400">(Đã hết lượt)</Text>
            </View>
            <Text className="text-xs leading-4 text-muted-foreground">Lượt miễn phí được dùng trước; kết quả lỗi không mất lượt mua thêm.</Text>
          </View>
        </View>
        <Link href={'/billing' as Href} asChild>
          <Pressable accessibilityRole="button" className="h-10 flex-row items-center justify-center gap-1.5 rounded-xl bg-amber-600 active:opacity-90">
            <Zap size={15} color="#ffffff" />
            <Text className="text-sm font-semibold text-white">Mua thêm quyền lợi</Text>
          </Pressable>
        </Link>
      </View>
    );
  }
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
      : feature === 'FRIDGE'
        ? query.data.fridgeCredits + ' lượt quét tủ lạnh'
        : query.data.receiptCredits + ' lượt phân tích hóa đơn';
  return (
    <View className="gap-3 rounded-xl border border-border bg-muted p-4">
      <Text className="font-semibold text-foreground">{value}</Text>
      <Text className="text-xs leading-5 text-muted-foreground">
        {feature === 'PANTRY'
          ? 'Item chưa xóa, kể cả số lượng bằng 0, đều chiếm một ô.'
          : query.data.scanPolicyLabel}
      </Text>
      <Link href={'/billing' as Href} asChild>
        <PrimaryButton label="Mua thêm quyền lợi" variant="outline" />
      </Link>
    </View>
  );
}
