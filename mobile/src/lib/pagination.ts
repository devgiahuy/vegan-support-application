interface PageMetadata {
  page: number;
  totalPages: number;
  hasNextPage?: boolean;
}

/**
 * `getNextPageParam` dùng chung cho `useInfiniteQuery` của danh sách phân trang theo số trang.
 * Ưu tiên cờ `hasNextPage` của backend, nếu không có thì so sánh `page` với `totalPages`.
 */
export function getNextPageNumber(lastPage: { metadata: PageMetadata }): number | undefined {
  const { page, totalPages, hasNextPage } = lastPage.metadata;
  if (typeof hasNextPage === 'boolean') return hasNextPage ? page + 1 : undefined;
  return page < totalPages ? page + 1 : undefined;
}
