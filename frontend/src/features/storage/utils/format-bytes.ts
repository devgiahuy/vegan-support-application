const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

/**
 * Format bytes to human readable string using binary units (1024).
 * Example: 1048576 -> "1.0 MB"
 */
export function formatBytes(bytes: number | null | undefined, decimals = 1): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) {
    return '0 B';
  }

  if (bytes === 0) return '0 B';

  const isNegative = bytes < 0;
  const absBytes = Math.abs(bytes);

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const i = Math.floor(Math.log(absBytes) / Math.log(k));
  const unitIndex = Math.min(i, UNITS.length - 1);

  if (unitIndex === 0) {
    return `${isNegative ? '-' : ''}${absBytes} B`;
  }

  const value = (absBytes / Math.pow(k, unitIndex)).toFixed(dm);
  return `${isNegative ? '-' : ''}${value} ${UNITS[unitIndex]}`;
}

/**
 * Calculate used storage percentage (0 - 100).
 */
export function calculateUsedPercent(usedBytes: number, limitBytes: number): number {
  if (!limitBytes || limitBytes <= 0) return 0;
  const percent = Math.round((usedBytes / limitBytes) * 100);
  return Math.min(100, Math.max(0, percent));
}

/**
 * Format delta bytes with explicit +/- sign for adjustments.
 * Example: 524288000 -> "+500.0 MB", -209715200 -> "-200.0 MB"
 */
export function formatDeltaBytes(deltaBytes: number, decimals = 1): string {
  if (deltaBytes === 0) return '0 B';
  const prefix = deltaBytes > 0 ? '+' : '';
  return `${prefix}${formatBytes(deltaBytes, decimals)}`;
}
