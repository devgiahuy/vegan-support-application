import { Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { ArrowRight, Layers, Receipt, ShoppingCart, Sparkles, UploadCloud } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { useIconColors } from '@/lib/theme-colors';

const STEPS = [
  {
    title: 'Chụp hoặc tải ảnh hóa đơn',
    description:
      'Hỗ trợ chụp từ 1 đến 4 ảnh cho hóa đơn dài. Ảnh được tải lên lưu trữ an toàn trong hạn mức tài khoản của bạn.',
  },
  {
    title: 'Đối chiếu & Rà soát thông minh',
    description:
      'So sánh ảnh gốc với các dòng hàng bóc tách. Tự do sửa số lượng, đổi đơn vị hoặc loại bỏ mặt hàng phi thực phẩm.',
  },
  {
    title: 'Xác nhận cập nhật Tủ bếp',
    description:
      'Một cú bấm xác nhận duy nhất để đồng bộ số dư vào Tủ bếp, phục vụ tính toán khoảng thiếu đi chợ cho thực đơn tuần tiếp theo.',
  },
];

/**
 * "Hóa đơn mua sắm" — trang giới thiệu quét hóa đơn, đồng bộ `/receipts` của web: banner, quy trình 3 bước và lối tắt
 * sang Tủ bếp / Thực đơn. Việc quét thật nằm ở màn `receipt-scan`.
 */
export default function ReceiptsScreen() {
  const colors = useIconColors();

  return (
    <SiteScreen>
      <View className="gap-8 px-5 pb-6 pt-4">
        <View className="relative overflow-hidden rounded-3xl bg-emerald-800 p-6">
          <View className="absolute -bottom-8 -right-8 opacity-10" pointerEvents="none">
            <Receipt size={200} color="#ffffff" />
          </View>
          <View className="gap-4">
            <View className="flex-row items-center gap-2 self-start rounded-full border border-white/20 bg-white/10 px-3 py-1">
              <Sparkles size={13} color="#6ee7b7" />
              <Text className="text-xs font-medium text-emerald-100">Nhận diện OCR & Đi chợ thông minh</Text>
            </View>
            <Text className="text-3xl font-extrabold leading-9 tracking-tight text-white">
              Quét Hóa Đơn & Tối Ưu Mua Sắm Thực Phẩm
            </Text>
            <Text className="text-sm leading-6 text-emerald-100">
              Chuyển hóa đơn mua hàng giấy thành dữ liệu số trong nháy mắt. AI tự động bóc tách từng dòng sản phẩm, khớp
              với nguyên liệu chuẩn và cập nhật trực tiếp vào kho Tủ bếp gia đình.
            </Text>
            <View className="flex-row flex-wrap gap-3 pt-1">
              <Link href={'/receipt-scan' as Href} asChild>
                <Pressable
                  accessibilityRole="button"
                  className="h-12 flex-row items-center gap-2 rounded-xl bg-white px-5 active:opacity-90">
                  <UploadCloud size={16} color="#047857" />
                  <Text className="text-sm font-semibold text-emerald-900">Quét hóa đơn ngay</Text>
                </Pressable>
              </Link>
              <Link href={'/pantry' as Href} asChild>
                <Pressable
                  accessibilityRole="button"
                  className="h-12 flex-row items-center gap-2 rounded-xl border border-white/30 px-5 active:bg-white/10">
                  <Layers size={16} color="#ffffff" />
                  <Text className="text-sm font-semibold text-white">Xem Tủ bếp của tôi</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>

        <View className="gap-4">
          <View className="items-center gap-1">
            <Text className="text-center text-xl font-bold text-foreground">Quy trình bóc tách & nhập kho an toàn</Text>
            <Text className="text-center text-sm text-muted-foreground">
              Tuyệt đối minh bạch và không tự ý thay đổi số dư tồn kho nếu chưa có sự xác nhận của bạn.
            </Text>
          </View>
          {STEPS.map((step, index) => (
            <View key={step.title} className="gap-3 rounded-2xl border border-border bg-card p-5">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60">
                  <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{index + 1}</Text>
                </View>
                <Text className="flex-1 text-base font-semibold text-foreground">{step.title}</Text>
              </View>
              <Text className="text-xs leading-5 text-muted-foreground">{step.description}</Text>
            </View>
          ))}
        </View>

        <View className="gap-3">
          <Link href={'/pantry' as Href} asChild>
            <Pressable className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4 active:bg-muted">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                <Layers size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">Quản lý Tủ bếp gia đình</Text>
                <Text className="text-xs text-muted-foreground">Xem số dư nguyên liệu và cảnh báo hết hạn</Text>
              </View>
              <ArrowRight size={16} color={colors.mutedForeground} />
            </Pressable>
          </Link>
          <Link href={'/(tabs)/meal-plans' as Href} asChild>
            <Pressable className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4 active:bg-muted">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50">
                <ShoppingCart size={20} color={colors.info} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">Kế hoạch Thực đơn & Đi chợ</Text>
                <Text className="text-xs text-muted-foreground">Tối ưu danh sách mua sắm theo tủ bếp</Text>
              </View>
              <ArrowRight size={16} color={colors.mutedForeground} />
            </Pressable>
          </Link>
        </View>
      </View>
    </SiteScreen>
  );
}
