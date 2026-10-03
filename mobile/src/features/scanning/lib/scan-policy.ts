export function isDevScanEnabled(development: boolean, flag: string | undefined): boolean {
  return development && flag === 'true';
}

export function scanProviderMode(value: string | undefined): 'openai' | 'fake' {
  return value === 'fake' ? 'fake' : 'openai';
}
