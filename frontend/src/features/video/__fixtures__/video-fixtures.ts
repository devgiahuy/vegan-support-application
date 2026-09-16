import type { VideoDetailDto } from '../types/video.dto';

/**
 * Dữ liệu mẫu theo đúng shape backend `videoPostSchema`: video nằm trong
 * `media` (`kind: VIDEO`, `provider: CLOUDINARY | YOUTUBE`), ảnh bìa là
 * `media` (`kind: COVER_IMAGE`), mô tả nằm trong `revision.body`.
 */
export const MOCK_VIDEO_DTOS: VideoDetailDto[] = [
  {
    id: 'vid-001',
    type: 'VIDEO',
    slug: 'cach-lam-sua-hat-dieu-me-den-thom-beo',
    status: 'PUBLISHED',
    version: 1,
    publishedAt: '2026-09-13T14:30:00Z',
    createdAt: '2026-09-13T14:00:00Z',
    updatedAt: '2026-09-13T14:30:00Z',
    author: {
      id: 'usr-contributor-1',
      displayName: 'Bếp Chay An Nhiên',
      avatarUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
    revision: {
      id: 'rev-vid-001',
      version: 1,
      status: 'PUBLISHED',
      title: 'Cách làm sữa hạt điều mè đen thơm béo không cần lọc bã',
      excerpt: 'Sữa sánh mịn, giàu canxi và chất béo tốt cho tim mạch.',
      body: 'Video hướng dẫn chi tiết từng công đoạn ngâm hạt điều, rang thơm mè đen và xay mịn bằng máy xay công suất cao. Thành phẩm sữa sánh mịn, giàu canxi và chất béo tốt cho tim mạch.',
      tags: ['sua-hat', 'hat-dieu', 'me-den'],
      createdAt: '2026-09-13T14:00:00Z',
    },
    categories: [
      {
        id: 'cat-recipe-drink',
        name: 'Đồ uống & Sữa hạt',
        slug: 'do-uong-sua-hat',
        type: 'RECIPE_GROUP',
      },
    ],
    media: [
      {
        id: 'med-vid-001-cover',
        kind: 'COVER_IMAGE',
        provider: 'CLOUDINARY',
        secureUrl:
          'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80',
        mimeType: 'image/jpeg',
        bytes: 118000,
      },
      {
        id: 'med-vid-001-video',
        kind: 'VIDEO',
        provider: 'YOUTUBE',
        secureUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        durationSeconds: 480,
      },
    ],
  },
  {
    id: 'vid-002',
    type: 'VIDEO',
    slug: 'bi-quyet-chien-cha-gio-chay-gion-rum',
    status: 'PUBLISHED',
    version: 1,
    publishedAt: '2026-09-14T11:30:00Z',
    createdAt: '2026-09-14T11:00:00Z',
    updatedAt: '2026-09-14T11:30:00Z',
    author: {
      id: 'usr-contributor-2',
      displayName: 'Tuệ Minh Vegan',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    revision: {
      id: 'rev-vid-002',
      version: 1,
      status: 'PUBLISHED',
      title: 'Bí quyết chiên chả giò chay giòn rụm 6 tiếng không ỉu',
      excerpt: 'Tỷ lệ nhân vắt kiệt nước và kỹ thuật chiên 2 lửa giòn xốp lâu.',
      body: 'Chia sẻ tỷ lệ nhân củ đậu, khoai môn, nấm mèo vắt kiệt nước và kỹ thuật chiên 2 lửa giúp chả giò giòn xốp lâu mà không ngấm dầu.',
      tags: ['cha-gio', 'mon-chien', 'mon-tiec'],
      createdAt: '2026-09-14T11:00:00Z',
    },
    categories: [
      {
        id: 'cat-recipe-snack',
        name: 'Món tiệc chay',
        slug: 'mon-tiec-chay',
        type: 'RECIPE_GROUP',
      },
    ],
    media: [
      {
        id: 'med-vid-002-cover',
        kind: 'COVER_IMAGE',
        provider: 'CLOUDINARY',
        secureUrl:
          'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=800&auto=format&fit=crop&q=80',
        mimeType: 'image/jpeg',
        bytes: 122000,
      },
      {
        id: 'med-vid-002-video',
        kind: 'VIDEO',
        provider: 'CLOUDINARY',
        publicId: 'vegan-app/videos/sample-cha-gio',
        secureUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        mimeType: 'video/mp4',
        bytes: 9800000,
        durationSeconds: 375,
      },
    ],
  },
];
