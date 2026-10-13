import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useIconColors } from '@/lib/theme-colors';

/**
 * Khung form dạng modal. `sheet` (mặc định): toàn màn hình trượt từ dưới lên, cho form dài.
 * `popup`: hộp thoại nằm giữa màn hình, nền tối phía sau, cuộn khi nội dung dài — dùng cho thao tác ngắn.
 */
export function FormSheet({
  title,
  children,
  onClose,
  busy = false,
  variant = 'sheet',
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  variant?: 'sheet' | 'popup';
}) {
  const colors = useIconColors();
  const { height: windowHeight } = useWindowDimensions();

  if (variant === 'popup') {
    return (
      <Modal
        visible
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!busy) onClose();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 items-center justify-center bg-black/60 px-5"
        >
          <Pressable
            accessibilityLabel="Đóng"
            disabled={busy}
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={{ maxHeight: Math.round(windowHeight * 0.85) }}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-background"
          >
            <View className="flex-row items-center justify-between gap-3 border-b border-border px-5 py-3">
              <Text className="flex-1 text-lg font-bold text-foreground">{title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                disabled={busy}
                onPress={onClose}
                className="h-10 w-10 items-center justify-center"
              >
                <X size={20} color={colors.foreground} />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="gap-4 p-5"
              style={{ flexGrow: 0 }}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View className="flex-row items-center justify-between gap-3 border-b border-border px-5 py-3">
            <Text className="flex-1 text-lg font-bold text-foreground">{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              disabled={busy}
              onPress={onClose}
              className="h-12 w-12 items-center justify-center"
            >
              <X size={22} color={colors.foreground} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-4 p-5 pb-10"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
