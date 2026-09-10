/**
 * Helper lấy giá trị lồng nhau qua chuỗi đường dẫn dot-notation (ví dụ: 'category.name')
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Quét tìm trường trong payload DTO dựa trên danh sách các alias ứng viên theo thứ tự ưu tiên.
 * Nếu Backend đổi trường (ví dụ: 'item_name' -> 'name' -> 'productTitle'), FE chỉ cần thêm
 * alias vào mảng candidateKeys mà không làm gián đoạn hay crash giao diện.
 *
 * @param source Đối tượng DTO từ Backend
 * @param candidateKeys Danh sách tên trường ứng viên (hỗ trợ cả dot-notation 'nested.field')
 * @param fallback Giá trị mặc định an toàn trả về nếu không tìm thấy
 */
export function pickField<T, D = any>(
  source: D | null | undefined,
  candidateKeys: string[],
  fallback: T
): T {
  if (!source || typeof source !== 'object') {
    return fallback;
  }

  for (const key of candidateKeys) {
    const val = getNestedValue(source, key);
    if (val !== undefined && val !== null) {
      return val as T;
    }
  }

  return fallback;
}

/**
 * Ép kiểu chuỗi an toàn, cắt khoảng trắng, trả về fallback nếu null/undefined
 */
export function safeString(val: unknown, fallback: string = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return fallback;
}

/**
 * Ép kiểu số an toàn, parse số từ chuỗi ("120000" -> 120000), loại bỏ NaN
 */
export function safeNumber(val: unknown, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') {
    return isNaN(val) ? fallback : val;
  }
  if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '').trim();
    const parsed = Number(cleaned);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

/**
 * Ép kiểu boolean an toàn, hỗ trợ 'true', 'false', 1, 0
 */
export function safeBoolean(val: unknown, fallback: boolean = false): boolean {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
  }
  return fallback;
}

/**
 * Parse Date an toàn, trả về Date object hoặc null nếu chuỗi ngày không hợp lệ
 */
export function safeDate(val: unknown, fallback: Date | null = null): Date | null {
  if (!val) return fallback;
  try {
    const d = val instanceof Date ? val : new Date(val as string | number);
    return isNaN(d.getTime()) ? fallback : d;
  } catch {
    return fallback;
  }
}

/**
 * Bảo vệ mảng an toàn. Nếu Backend trả về null/undefined, tự động chuyển về []
 * tránh lỗi 'Cannot read properties of undefined (reading map)'.
 * Có hỗ trợ truyền mapper function cho từng phần tử.
 */
export function safeArray<TInput, TOutput = TInput>(
  val: unknown,
  itemMapper?: (item: TInput, index: number) => TOutput
): TOutput[] {
  if (!val || !Array.isArray(val)) {
    return [];
  }

  if (itemMapper) {
    return val.map((item, index) => itemMapper(item, index));
  }

  return val as unknown as TOutput[];
}

/**
 * Chuyển đổi an toàn sang enum của TypeScript với fallback
 */
export function safeEnum<T extends Record<string, string | number>>(
  val: unknown,
  enumObj: T,
  fallback: T[keyof T]
): T[keyof T] {
  if (val === null || val === undefined) return fallback;

  // Kiểm tra nếu giá trị tồn tại trong enum values
  const values = Object.values(enumObj);
  if (values.includes(val as any)) {
    return val as T[keyof T];
  }

  // Thử so khớp chuỗi case-insensitive
  if (typeof val === 'string') {
    const valUpper = val.toUpperCase().trim();
    for (const [key, enumValue] of Object.entries(enumObj)) {
      if (key.toUpperCase() === valUpper || String(enumValue).toUpperCase() === valUpper) {
        return enumValue as T[keyof T];
      }
    }
  }

  return fallback;
}
