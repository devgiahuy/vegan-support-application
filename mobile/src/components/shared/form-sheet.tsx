import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useKeyboardAwareScroll } from '@/hooks/use-keyboard-aware-scroll';
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
  const { keyboardHeight, scrollProps } = useKeyboardAwareScroll();

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
        {/* Hộp thoại nằm giữa phần màn hình còn lại phía trên bàn phím, không bị bàn phím che. */}
        <View className="flex-1 items-center justify-center bg-black/60 px-5" style={{ paddingBottom: keyboardHeight }}>
          <Pressable
            accessibilityLabel="Đóng"
            disabled={busy}
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={{ maxHeight: Math.min(Math.round(windowHeight * 0.85), windowHeight - keyboardHeight - 48) }}
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
              {...scrollProps}
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="gap-4 p-5"
              style={{ flexGrow: 0 }}
            >
              {children}
            </ScrollView>
          </View>
        </View>
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
        <View className="flex-1">
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
            {...scrollProps}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-4 p-5 pb-10"
          >
            {children}
            {keyboardHeight > 0 ? <View style={{ height: keyboardHeight }} /> : null}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
