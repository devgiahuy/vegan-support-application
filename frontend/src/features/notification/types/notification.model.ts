/** Thông báo dùng cho UI. */
export interface AppNotification {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  summary: string;
  /** Route nội bộ (`/recipes/...`); null = không điều hướng. */
  link: string | null;
  read: boolean;
  readAt: Date | null;
  createdAt: Date | null;
  /** `5 phút trước`, `Hôm qua`... */
  timeAgo: string;
}

/** Số chưa đọc cho chuông (capped `9+`, rỗng khi 0). */
export interface UnreadCount {
  count: number;
  capped: string;
}
