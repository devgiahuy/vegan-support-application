import type { RestaurantSearchMode } from '../types/restaurant.model';

export interface EmptyStateCopy {
  title: string;
  description: string;
  actions: string[];
}

/** Nội dung trạng thái rỗng và các hành động gợi ý theo chế độ tìm — đồng bộ `emptyStateCopy` của web. */
export function emptyStateCopy(mode: RestaurantSearchMode | null, externalResultsSuppressed = false): EmptyStateCopy {
  if (externalResultsSuppressed) {
    return {
      title: 'Chưa có quán đáp ứng bộ lọc chế độ ăn',
      description:
        'Chưa tìm được quán phù hợp với các bộ lọc bạn đã chọn. Quán từ nhà cung cấp bản đồ chưa có thông tin xác minh chế độ ăn nên đã được loại khỏi kết quả.',
      actions:
        mode === 'KEYWORD'
          ? ['Xoá bộ lọc nâng cao', 'Xoá từ khóa', 'Nới bán kính', 'Đổi vị trí']
          : mode === 'BOUNDS'
            ? ['Đổi vị trí']
            : ['Nới bán kính', 'Đổi vị trí'],
    };
  }
  if (mode === 'KEYWORD') {
    return {
      title: 'Không tìm thấy quán phù hợp',
      description: 'Thử bỏ bớt bộ lọc nâng cao, xoá từ khóa hoặc mở rộng bán kính tìm kiếm.',
      actions: ['Xoá bộ lọc nâng cao', 'Xoá từ khóa', 'Nới bán kính', 'Đổi vị trí'],
    };
  }
  if (mode === 'BOUNDS') {
    return {
      title: 'Không có quán trong vùng bạn đang xem',
      description: 'Hãy thu phóng sơ đồ ra rộng hơn rồi bấm "Tìm trong vùng đang xem" lại.',
      actions: ['Đổi vị trí'],
    };
  }
  return {
    title: 'Chưa tìm thấy quán chay quanh đây',
    description: 'Thử mở rộng bán kính tìm kiếm hoặc đổi sang khu vực khác.',
    actions: ['Nới bán kính', 'Đổi vị trí'],
  };
}
