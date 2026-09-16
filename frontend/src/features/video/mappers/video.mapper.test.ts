import { describe, it, expect } from 'vitest';
import { videoMapper } from './video.mapper';
import { PostStatus, VideoSource } from '@/common/enums';
import type { VideoDetailDto } from '../types/video.dto';

function youtubeDto(): VideoDetailDto {
  return {
    id: 'vid-01',
    type: 'VIDEO',
    slug: 'lam-sua-hat-dieu',
    status: 'PUBLISHED',
    version: 1,
    author: { id: 'usr-2', displayName: 'Bếp An', avatarUrl: null },
    revision: {
      id: 'rev-v1',
      version: 1,
      status: 'PUBLISHED',
      title: 'Làm sữa hạt điều',
      excerpt: 'Sữa sánh mịn',
      body: 'Mô tả chi tiết video...',
      tags: ['sua-hat'],
      createdAt: '2026-09-13T14:00:00Z',
    },
    categories: [{ id: 'cat-drink', name: 'Đồ uống', slug: 'do-uong', type: 'RECIPE_GROUP' }],
    media: [
      {
        id: 'med-cover',
        kind: 'COVER_IMAGE',
        provider: 'CLOUDINARY',
        secureUrl: 'https://example.com/thumb.jpg',
        mimeType: 'image/jpeg',
        bytes: 90000,
      },
      {
        id: 'med-video',
        kind: 'VIDEO',
        provider: 'YOUTUBE',
        secureUrl: 'https://www.youtube.com/watch?v=sample12345',
        durationSeconds: 320,
      },
    ],
  };
}

describe('VideoMapper', () => {
  it('maps backend video postSchema with YouTube media correctly', () => {
    const model = videoMapper.toModel(youtubeDto());

    expect(model.id).toBe('vid-01');
    expect(model.title).toBe('Làm sữa hạt điều');
    expect(model.status).toBe(PostStatus.PUBLISHED);
    expect(model.statusLabel).toBe('Đã xuất bản');
    expect(model.videoUrl).toBe('https://www.youtube.com/watch?v=sample12345');
    expect(model.videoSource).toBe(VideoSource.YOUTUBE);
    expect(model.durationSeconds).toBe(320);
    expect(model.formattedDuration).toBe('05:20');
    expect(model.description).toBe('Mô tả chi tiết video...');
    expect(model.coverImageUrl).toBe('https://example.com/thumb.jpg');
  });

  it('detects YouTube URL even if provider is missing or mismatched', () => {
    const dto: VideoDetailDto = {
      id: 'vid-02',
      revision: { title: 'Short', body: '' },
      media: [{ kind: 'VIDEO', secureUrl: 'https://youtu.be/shortCode12' }],
    };

    const model = videoMapper.toModel(dto);

    expect(model.videoSource).toBe(VideoSource.YOUTUBE);
  });

  it('defaults to CLOUDINARY source for direct mp4 links', () => {
    const dto: VideoDetailDto = {
      id: 'vid-03',
      media: [
        {
          kind: 'VIDEO',
          provider: 'CLOUDINARY',
          secureUrl: 'https://res.cloudinary.com/sample/video.mp4',
          durationSeconds: 45,
        },
      ],
    };

    const model = videoMapper.toModel(dto);

    expect(model.videoSource).toBe(VideoSource.CLOUDINARY);
    expect(model.formattedDuration).toBe('00:45');
  });

  it('handles zero or missing duration safely', () => {
    const dto: VideoDetailDto = {
      id: 'vid-04',
      media: [{ kind: 'VIDEO', secureUrl: 'https://example.com/v.mp4' }],
    };

    const model = videoMapper.toModel(dto);

    expect(model.formattedDuration).toBe('00:00');
  });

  it('builds backend live-shape CreateVideoRequestDto', () => {
    const createDto = videoMapper.toCreateDto({
      title: 'Lẩu nấm',
      category: { id: 'cat-lau', name: 'Lẩu' },
      coverImageUrl: 'https://example.com/cover.jpg',
      coverMedia: { publicId: 'vegan-app/videos/cover', mimeType: 'image/jpeg', bytes: 50000 },
      videoUrl: 'https://www.youtube.com/watch?v=abc12345678',
      videoSource: VideoSource.YOUTUBE,
      description: 'Mô tả video hướng dẫn nấu lẩu nấm thơm ngon đủ 20 ký tự.',
    });

    expect(createDto.type).toBe('VIDEO');
    expect(createDto.categoryIds).toEqual(['cat-lau']);
    expect(createDto.body).toContain('lẩu nấm');
    const videoMedia = createDto.media.find((m) => m.kind === 'VIDEO');
    expect(videoMedia?.provider).toBe('YOUTUBE');
  });
});
