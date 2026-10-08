import * as React from 'react';

/** Trả về giá trị sau khi ngừng thay đổi `delayMs` mili-giây (dùng cho ô tìm kiếm gọi API). */
export function useDebouncedValue<T>(value: T, delayMs = 500): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
