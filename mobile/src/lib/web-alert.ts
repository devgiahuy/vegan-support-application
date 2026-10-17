import { Alert, Platform, type AlertButton } from 'react-native';

/**
 * `Alert.alert` của react-native-web là no-op, nên mọi thông báo lỗi và hộp thoại xác nhận (xóa, đăng xuất...)
 * sẽ im lặng khi chạy bản web. Thay bằng `window.alert` / `window.confirm`; trên iOS/Android giữ nguyên.
 * Import file này một lần ở root layout.
 */
type BrowserDialogs = {
  alert?: (message?: string) => void;
  confirm?: (message?: string) => boolean;
};

function installWebAlert(): void {
  if (Platform.OS !== 'web') return;
  const dialogs = globalThis as unknown as BrowserDialogs;
  if (typeof dialogs.alert !== 'function' || typeof dialogs.confirm !== 'function') return;

  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    const text = message ? `${title}\n\n${message}` : title;
    const actions = (buttons ?? []).filter((button) => button.style !== 'cancel');
    const cancel = (buttons ?? []).find((button) => button.style === 'cancel');

    if (actions.length === 0) {
      dialogs.alert?.(text);
      buttons?.[0]?.onPress?.();
      return;
    }

    // Hộp thoại chỉ có OK/Hủy: hỏi lần lượt từng hành động, người dùng đồng ý hành động nào thì chạy hành động đó.
    for (const action of actions) {
      const prompt = actions.length > 1 ? `${text}\n\n${action.text ?? 'OK'}?` : text;
      if (dialogs.confirm?.(prompt)) {
        action.onPress?.();
        return;
      }
    }
    cancel?.onPress?.();
  };
}

installWebAlert();
