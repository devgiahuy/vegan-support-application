import { isDevScanEnabled, scanProviderMode } from './scan-policy';

export const DEV_SCANS_ENABLED = isDevScanEnabled(__DEV__, process.env.EXPO_PUBLIC_ENABLE_DEV_SCANS);
export const SCAN_PROVIDER_MODE = scanProviderMode(process.env.EXPO_PUBLIC_SCAN_PROVIDER);

export function requireDevScans(): void {
  if (!DEV_SCANS_ENABLED) throw new Error('Luồng quét thử nghiệm chưa được bật ở môi trường này.');
}
