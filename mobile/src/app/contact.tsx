import * as React from 'react';
import { Alert, Linking, Text, TextInput, View } from 'react-native';
import { Clock, Mail, MapPin, MessageSquare, Phone, Send, type LucideIcon } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { StaticHero } from '@/components/shared/static-page';
import { PrimaryButton } from '@/components/ui/primary-button';
import { buildSupportMailto, CONTACT_EMAIL, SUPPORT_EMAIL } from '@/lib/env';
import { useIconColors } from '@/lib/theme-colors';

function InfoRow({ icon: Icon, title, lines }: { icon: LucideIcon; title: string; lines: string[] }) {
  const colors = useIconColors();
  return (
    <View className="flex-row items-start gap-3">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
        <Icon size={16} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-bold text-foreground">{title}</Text>
        {lines.map((line) => (
          <Text key={line} className="mt-0.5 text-xs text-muted-foreground">
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

/**
 * Liên hệ — đồng bộ `/contact` của web. Backend chưa có API nhận tin nhắn liên hệ, nên nút gửi sẽ soạn sẵn thư
 * trong ứng dụng email của thiết bị thay vì giả vờ đã gửi.
 */
export default function ContactScreen() {
  const colors = useIconColors();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');

  const emails = [SUPPORT_EMAIL, CONTACT_EMAIL].filter((value) => value.length > 0);
  const canMail = SUPPORT_EMAIL.length > 0;

  const send = async () => {
    if (!name.trim() || !subject.trim() || !message.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên, chủ đề và nội dung tin nhắn.');
      return;
    }
    const url = buildSupportMailto(
      subject.trim(),
      `${message.trim()}\n\n— ${name.trim()}${email.trim() ? ` (${email.trim()})` : ''}`
    );
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Không mở được ứng dụng email', `Bạn có thể gửi thư trực tiếp tới ${SUPPORT_EMAIL}.`);
    }
  };

  const inputClass = 'rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground';

  return (
    <SiteScreen>
      <View className="gap-6 px-5 pb-6 pt-5">
        <StaticHero
          centered
          badge="Kết nối cùng chúng tôi"
          badgeIcon={MessageSquare}
          title="Liên hệ với VeggieConnect"
          subtitle="Mọi thắc mắc, đề xuất hợp tác hoặc hỗ trợ kỹ thuật, xin vui lòng liên hệ theo thông tin bên dưới."
        />

        <View className="gap-4 rounded-2xl border border-border bg-card p-5">
          {emails.length > 0 ? <InfoRow icon={Mail} title="Email hỗ trợ" lines={emails} /> : null}
          <InfoRow icon={Phone} title="Hotline" lines={['1900 6868 (8:00 - 18:00 Thứ 2 - Thứ 7)']} />
          <InfoRow icon={MapPin} title="Trụ sở chính" lines={['Quận 1, Thành phố Hồ Chí Minh, Việt Nam']} />
          <InfoRow icon={Clock} title="Thời gian phản hồi" lines={['Trong vòng 24 giờ làm việc']} />
        </View>

        {canMail ? (
          <View className="gap-3 rounded-2xl border border-border bg-card p-5">
            <Text className="text-base font-bold text-foreground">Gửi tin nhắn trực tiếp</Text>
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-foreground">Họ và tên</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Nguyễn Văn A" placeholderTextColor={colors.mutedForeground} className={`h-12 ${inputClass}`} />
            </View>
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-foreground">Email của bạn (không bắt buộc)</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                className={`h-12 ${inputClass}`}
              />
            </View>
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-foreground">Chủ đề</Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="Hợp tác, hỗ trợ kỹ thuật..."
                placeholderTextColor={colors.mutedForeground}
                className={`h-12 ${inputClass}`}
              />
            </View>
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-foreground">Nội dung tin nhắn</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                placeholder="Mô tả chi tiết câu hỏi hoặc yêu cầu của bạn..."
                placeholderTextColor={colors.mutedForeground}
                className={`min-h-28 py-3 ${inputClass}`}
                textAlignVertical="top"
              />
            </View>
            <PrimaryButton label="Soạn email gửi đi" icon={<Send size={15} color={colors.primaryForeground} />} onPress={() => void send()} />
            <Text className="text-[11px] leading-relaxed text-muted-foreground">
              Thư sẽ mở trong ứng dụng email của bạn để bạn kiểm tra rồi mới gửi.
            </Text>
          </View>
        ) : null}
      </View>
    </SiteScreen>
  );
}
