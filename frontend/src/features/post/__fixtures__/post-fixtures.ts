import type { BlogDetailDto } from '../types/post.dto';

/**
 * Dữ liệu mẫu theo đúng shape backend `blogPostSchema` (author/revision/
 * categories/media) để UI demo khi endpoint `/posts` còn PLANNED.
 */
export const MOCK_ARTICLE_DTOS: BlogDetailDto[] = [
  {
    id: 'art-001',
    type: 'BLOG',
    slug: 'cach-bo-sung-vitamin-b12-va-sat-khoa-hoc',
    status: 'PUBLISHED',
    version: 1,
    publishedAt: '2026-09-08T08:00:00Z',
    createdAt: '2026-09-08T07:30:00Z',
    updatedAt: '2026-09-08T08:00:00Z',
    author: {
      id: 'usr-nutritionist-1',
      displayName: 'Bác sĩ Dinh dưỡng Hoàng Yến',
      avatarUrl:
        'https://images.unsplash.com/photo-1594824813589-983636f4dcfc?w=150&auto=format&fit=crop&q=80',
    },
    revision: {
      id: 'rev-art-001',
      version: 1,
      status: 'PUBLISHED',
      title: 'Cách bổ sung Vitamin B12 và Sắt khoa học cho người mới ăn thuần thực vật',
      excerpt:
        'Vitamin B12 và Sắt là hai vi chất quan trọng hàng đầu mà người ăn chay trường cần đặc biệt lưu tâm. Bài viết hướng dẫn chi tiết các nguồn thực phẩm tự nhiên và lộ trình bổ sung khoa học.',
      body: `### Tầm quan trọng của Vitamin B12 đối với người ăn chay

Vitamin B12 (Cobalamin) đóng vai trò thiết yếu trong việc hình thành tế bào hồng cầu, duy trì sức khỏe của hệ thần kinh và tổng hợp DNA. Cơ thể không thể tự sản xuất B12.

#### 1. Các nguồn bổ sung B12 an toàn
- **Men dinh dưỡng (Nutritional Yeast)**: thực phẩm vàng cho người ăn chay, chứa lượng B12 dồi dào cùng hương vị béo bùi tựa phô mai.
- **Sữa thực vật tăng cường vi chất**: nhiều loại sữa đậu nành, hạnh nhân, yến mạch được bổ sung sẵn B12.
- **Viên uống bổ sung định kỳ**: dạng Cyanocobalamin hoặc Methylcobalamin liều lượng thích hợp.

#### 2. Tối ưu hóa khả năng hấp thu Sắt từ thực vật
Sắt trong thực vật là dạng **Sắt không-heme (Non-heme Iron)**. Nhân đôi khả năng hấp thu bằng cách:
- Kết hợp thực phẩm giàu sắt (rau bina, đậu lăng, mè đen) với thực phẩm giàu Vitamin C (ớt chuông, cam, chanh, ổi).
- Tránh uống trà đặc hoặc cà phê ngay trong hoặc sau bữa ăn chính vì chất tannin cản trở hấp thu sắt.`,
      tags: ['dinh-duong', 'vitamin-b12', 'sat', 'an-chay-khoe'],
      createdAt: '2026-09-08T07:30:00Z',
    },
    categories: [
      {
        id: 'cat-topic-nutrition',
        name: 'Dinh dưỡng & Sức khỏe',
        slug: 'dinh-duong-suc-khoe',
        type: 'CONTENT_TOPIC',
      },
    ],
    media: [
      {
        id: 'med-art-001',
        kind: 'COVER_IMAGE',
        provider: 'CLOUDINARY',
        secureUrl:
          'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop&q=80',
        mimeType: 'image/jpeg',
        bytes: 115000,
      },
    ],
  },
  {
    id: 'art-002',
    type: 'BLOG',
    slug: 'cam-nang-di-cho-va-sap-xep-tu-lanh-thuan-chay',
    status: 'PUBLISHED',
    version: 1,
    publishedAt: '2026-09-12T09:30:00Z',
    createdAt: '2026-09-12T09:00:00Z',
    updatedAt: '2026-09-12T09:30:00Z',
    author: {
      id: 'usr-contributor-1',
      displayName: 'Bếp Chay An Nhiên',
      avatarUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
    revision: {
      id: 'rev-art-002',
      version: 1,
      status: 'PUBLISHED',
      title: 'Tin tức đi chợ và sắp xếp tủ lạnh thuần chay cho tuần bận rộn',
      excerpt:
        'Phương pháp sơ chế, bảo quản rau củ tươi xanh suốt 7 ngày và cách chuẩn bị trước các loại hạt, sốt để tiết kiệm 70% thời gian nấu nướng mỗi ngày.',
      body: `### Nguyên tắc đi chợ thuần chay

Đi chợ 2 lần mỗi tuần, ưu tiên rau củ theo mùa để vừa tươi ngon vừa tiết kiệm chi phí.

### Sắp xếp tủ lạnh khoa học
- Ngăn mát trên: sữa hạt, đậu hũ, thực phẩm đã nấu chín.
- Ngăn rau củ: lót khăn giấy khô, bảo quản rau lá tối đa 5 ngày.
- Chuẩn bị trước: ngâm hạt qua đêm, nấu sẵn gạo lứt và các loại sốt chay.`,
      tags: ['meal-prep', 'kinh-nghiem', 'bao-quan-rau-cu'],
      createdAt: '2026-09-12T09:00:00Z',
    },
    categories: [
      {
        id: 'cat-topic-tips',
        name: 'Kinh nghiệm vào bếp',
        slug: 'kinh-nghiem-vao-bep',
        type: 'CONTENT_TOPIC',
      },
    ],
    media: [
      {
        id: 'med-art-002',
        kind: 'COVER_IMAGE',
        provider: 'CLOUDINARY',
        secureUrl:
          'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
        mimeType: 'image/jpeg',
        bytes: 108000,
      },
    ],
  },
];
