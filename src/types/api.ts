/**
 * Khung phản hồi chuẩn cho các API thành công (APIResponse)
 * Sử dụng Generic <T> để FE có thể truyền linh hoạt kiểu dữ liệu của cục data vào
 */
export interface APIResponse<T = unknown> {
  message?: string;
  data?: T;
  code?: string | number;
  success?: boolean;
}

/**
 * Khung phản hồi chuẩn khi API gặp lỗi (ErrorResponse)
 * Thường dùng để bắt trong catch block của Axios hoặc React Query
 */
export interface ValidationErrorItem {
  field: string;
  message: string;
}

export interface ErrorResponse {
  status?: number;
  statusCode?: number;
  title?: string;
  message?: string;
  detail?: string;
  Detail?: string;
  errors?: ValidationErrorItem[];
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginationResult<T> {
  items: T[];
  metadata: PaginationMetadata;
}
