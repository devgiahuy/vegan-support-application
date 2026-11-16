/** Quét tủ lạnh/hóa đơn bật mặc định ở mọi bản dựng (đồng bộ web); chỉ tắt khi đặt cờ khẩn cấp `EXPO_PUBLIC_DISABLE_SCANS=true`. */
export function isScanEnabled(disableFlag: string | undefined): boolean {
  return disableFlag !== 'true';
}

export function scanProviderMode(value: string | undefined): 'openai' | 'fake' {
  return value === 'fake' ? 'fake' : 'openai';
}
