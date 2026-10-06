import * as React from 'react';
import { Alert, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { Bug, MessageSquarePlus, Send, Sparkles, type LucideIcon } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { StaticHero } from '@/components/shared/static-page';
import { PrimaryButton } from '@/components/ui/primary-button';
import { buildSupportMailto, SUPPORT_EMAIL } from '@/lib/env';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';

const TYPES: { value: string; label: string; icon: LucideIcon; color: string }[] = [
  { value: 'Báo lỗi kỹ thuật', label: 'Báo lỗi kỹ thuật', icon: Bug, color: '#f43f5e' },
  { value: 'Góp ý tính năng', label: 'Góp ý tính năng', icon: Sparkles, color: '#f59e0b' },
  { value: 'Ý kiến khác', label: 'Ý kiến khác', icon: MessageSquarePlus, color: '#10b981' },
];

/**
 * Góp ý & Báo lỗi — đồng bộ `/feedback` của web. Backend chưa có API nhận góp ý chung, nên nút gửi soạn sẵn thư
 * trong ứng dụng email của thiết bị thay vì giả vờ đã ghi nhận.
 */
export default function FeedbackScreen() {
  const colors = useIconColors();
  const [type, setType] = React.useState(TYPES[0].value);
  const [title, setTitle] = React.useState('');
  const [detail, setDetail] = React.useState('');
  const [email, setEmail] = React.useState('');

  const send = async () => {
    if (!title.trim() || !detail.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và mô tả chi tiết.');
      return;
    }
    const url = buildSupportMailto(
      `[${type}] ${title.trim()}`,
      `${detail.trim()}${email.trim() ? `\n\nEmail phản hồi: ${email.trim()}` : ''}`
    );
    if (url.length === 0) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Không mở được ứng dụng email', `Bạn có thể gửi góp ý trực tiếp tới ${SUPPORT_EMAIL}.`);
    }
  };

  const inputClass = 'rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground';

  return (
    <SiteScreen>
      <View className="gap-6 px-5 pb-6 pt-5">
        <StaticHero
          centered
          badge="Lắng nghe người dùng"
          badgeIcon={MessageSquarePlus}
          title="Góp ý & Báo lỗi"
          subtitle="Mỗi phản hồi của bạn giúp VeggieConnect ngày càng hoàn thiện và phục vụ cộng đồng tốt hơn."
        />

        {SUPPORT_EMAIL.length === 0 ? (
          <View className="rounded-2xl border border-border bg-card p-5">
            <Text className="text-sm text-muted-foreground">Kênh nhận góp ý chưa được cấu hình trên ứng dụng này.</Text>
          </View>
        ) : (
          <View className="gap-4 rounded-2xl border border-border bg-card p-5">
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-foreground">Loại phản hồi</Text>
              <View className="gap-2">
                {TYPES.map((item) => {
                  const selected = type === item.value;
                  return (
                    <Pressable
                      key={item.value}
                      onPress={() => setType(item.value)}
                      className={cn('flex-row items-center gap-2.5 rounded-xl border p-3', selected ? 'border-primary bg-primary/5' : 'border-border')}>
                      <item.icon size={16} color={item.color} />
                      <Text className={cn('flex-1 text-sm font-medium', selected ? 'text-primary' : 'text-foreground')}>{item.label}</Text>
                      <View className={cn('h-4 w-4 rounded-full border-2', selected ? 'border-primary bg-primary' : 'border-input')} />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-foreground">Tiêu đề phản hồi</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Tóm tắt ngắn gọn vấn đề..."
                placeholderTextColor={colors.mutedForeground}
                className={`h-12 ${inputClass}`}
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-foreground">Mô tả chi tiết</Text>
              <TextInput
                value={detail}
                onChangeText={setDetail}
                multiline
                placeholder="Mô tả các bước gặp lỗi hoặc ý tưởng cải tiến của bạn..."
                placeholderTextColor={colors.mutedForeground}
                className={`min-h-32 py-3 ${inputClass}`}
                textAlignVertical="top"
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-foreground">Email của bạn (không bắt buộc)</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Để chúng tôi phản hồi kết quả xử lý..."
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                className={`h-12 ${inputClass}`}
              />
            </View>

            <PrimaryButton label="Soạn email phản hồi" icon={<Send size={15} color={colors.primaryForeground} />} onPress={() => void send()} />
            <Text className="text-[11px] leading-relaxed text-muted-foreground">
              Thư sẽ mở trong ứng dụng email của bạn để bạn kiểm tra rồi mới gửi.
            </Text>
          </View>
        )}
      </View>
    </SiteScreen>
  );
}
