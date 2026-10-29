import * as React from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  TextInput,
  type KeyboardEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from 'react-native';

/** Khoảng chừa giữa đáy ô nhập và mép trên bàn phím để thấy rõ chữ/con trỏ đang gõ. */
const KEYBOARD_CLEARANCE = 32;
/** Chờ bàn phím và phần đệm dưới cùng bố cục xong rồi mới đo vị trí ô nhập. */
const REVEAL_DELAY_MS = 150;

const SHOW_EVENT = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE_EVENT = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

/** Mép trên của bàn phím theo toạ độ màn hình; Android đôi khi báo `screenY` = 0 nên tính lại từ chiều cao. */
function keyboardTopOf(event: KeyboardEvent): number {
  const { screenY, height } = event.endCoordinates;
  return screenY > 0 ? screenY : Dimensions.get('screen').height - height;
}

/**
 * Giúp ô nhập liệu luôn nằm phía trên bàn phím, không cần build lại app (chỉ dùng API sẵn có của React Native).
 * Android (giao diện tràn viền) và iOS không tự đẩy nội dung khi bàn phím mở, nên hook này:
 * - đo chiều cao bàn phím thật của từng máy (`keyboardHeight`) để màn hình thêm khoảng đệm dưới cùng;
 * - cuộn ScrollView sao cho ô đang focus nằm ngay trên bàn phím — khi bàn phím mở và mỗi lần chạm sang ô khác.
 * Dùng: gắn `scrollProps` vào ScrollView và thêm một khoảng trống cao `keyboardHeight` ở cuối nội dung.
 */
export function useKeyboardAwareScroll(externalRef?: React.Ref<ScrollView>) {
  const scrollRef = React.useRef<ScrollView | null>(null);
  const scrollY = React.useRef(0);
  const keyboardTop = React.useRef(0);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  const revealFocusedInput = React.useCallback(() => {
    const input = TextInput.State.currentlyFocusedInput();
    if (!input || keyboardTop.current <= 0) return;
    input.measureInWindow((_x, y, _width, height) => {
      const overflow = y + height + KEYBOARD_CLEARANCE - keyboardTop.current;
      if (overflow > 0) scrollRef.current?.scrollTo({ y: scrollY.current + overflow, animated: true });
    });
  }, []);

  const scheduleReveal = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(revealFocusedInput, REVEAL_DELAY_MS);
  }, [revealFocusedInput]);

  React.useEffect(() => {
    const subscriptions = [
      Keyboard.addListener(SHOW_EVENT, (event) => {
        keyboardTop.current = keyboardTopOf(event);
        setKeyboardHeight(event.endCoordinates.height);
        scheduleReveal();
      }),
      Keyboard.addListener(HIDE_EVENT, () => {
        keyboardTop.current = 0;
        setKeyboardHeight(0);
      }),
    ];
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      if (timer.current) clearTimeout(timer.current);
    };
  }, [scheduleReveal]);

  // Chia sẻ cùng ScrollView cho ref do màn hình truyền vào (nếu có), để họ vẫn gọi `scrollTo` được như trước.
  React.useImperativeHandle(externalRef, () => scrollRef.current as ScrollView, []);

  const scrollProps = React.useMemo(
    () => ({
      ref: scrollRef,
      scrollEventThrottle: 16,
      onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollY.current = event.nativeEvent.contentOffset.y;
      },
      // Chạm vào ô nhập khác khi bàn phím đã mở sẽ không phát sự kiện bàn phím, nên đo lại sau mỗi lần chạm.
      onTouchEnd: scheduleReveal,
    }),
    [scheduleReveal]
  );

  return { keyboardHeight, scrollProps };
}
