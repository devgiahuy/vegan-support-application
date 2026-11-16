import { isScanEnabled, scanProviderMode } from './scan-policy';

/** Quét tủ lạnh/hóa đơn bật cho mọi người dùng; `EXPO_PUBLIC_DISABLE_SCANS=true` là công tắc khẩn cấp. */
export const SCANS_ENABLED = isScanEnabled(process.env.EXPO_PUBLIC_DISABLE_SCANS);
export const SCAN_PROVIDER_MODE = scanProviderMode(process.env.EXPO_PUBLIC_SCAN_PROVIDER);

export function requireScansEnabled(): void {
  if (!SCANS_ENABLED) throw new Error('Tính năng quét đang tạm tắt. Vui lòng thử lại sau.');
}
