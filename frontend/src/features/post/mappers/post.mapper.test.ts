import { describe, it, expect } from 'vitest';
import { postMapper } from './post.mapper';
import { PostStatus, PostType } from '@/common/enums';
import type { BlogDetailDto } from '../types/post.dto';

function backendBlogDto(): BlogDetailDto {
  return {
    id: 'post-123',
    type: 'BLOG',
    slug: 'huong-dan-an-chay-khoa-hoc',
    status: 'PUBLISHED',
    version: 2,
    publishedAt: '2026-09-10T11:00:00Z',
    author: {
      id: 'auth-1',
      displayName: 'Bác sĩ Minh',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
    revision: {
      id: 'rev-123',
      version: 2,
      status: 'PUBLISHED',
      title: 'Hướng dẫn ăn chay khoa học',
      excerpt: 'Tóm tắt bài viết',
      body: 'Nội dung chi tiết bài viết với đủ nhiều từ để ước tính thời gian đọc chính xác hơn cho độc giả.',
      tags: ['dinh-duong', 'an-chay'],
      createdAt: '2026-09-10T10:00:00Z',
    },
    categories: [{ id: 'cat-1', name: 'Dinh dưỡng', slug: 'dinh-duong', type: 'CONTENT_TOPIC' }],
    media: [
      {
        id: 'med-123',
        kind: 'COVER_IMAGE',
        provider: 'CLOUDINARY',
        secureUrl: 'https://example.com/cover.jpg',
        mimeType: 'image/jpeg',
        bytes: 100000,
      },
    ],
  };
}

describe('PostMapper', () => {
  it('maps backend blog postSchema to Article Model correctly', () => {
    const model = postMapper.toModel(backendBlogDto());

    expect(model.id).toBe('post-123');
    expect(model.title).toBe('Hướng dẫn ăn chay khoa học');
    expect(model.slug).toBe('huong-dan-an-chay-khoa-hoc');
    expect(model.status).toBe(PostStatus.PUBLISHED);
    expect(model.statusLabel).toBe('Đã xuất bản');
    expect(model.version).toBe(2);
    expect(model.author.name).toBe('Bác sĩ Minh');
    expect(model.author.avatarUrl).toBe('https://example.com/avatar.jpg');
    expect(model.category.name).toBe('Dinh dưỡng');
    expect(model.coverImageUrl).toBe('https://example.com/cover.jpg');
    expect(model.excerpt).toBe('Tóm tắt bài viết');
    expect(model.content).toContain('Nội dung chi tiết');
    expect(model.tags).toEqual(['dinh-duong', 'an-chay']);
    expect(model.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    expect(model.stats.views).toBe(0);
  });

  it('handles null, undefined and missing fields safely with fallbacks', () => {
    const model = postMapper.toModel(null);

    expect(model.id).toBe('');
    expect(model.title).toBe('Bài viết chưa có tiêu đề');
    expect(model.status).toBe(PostStatus.DRAFT);
    expect(model.statusLabel).toBe('Bản nháp');
    expect(model.author.name).toBe('Tác giả VeggieConnect');
    expect(model.author.avatarUrl).toBeNull();
    expect(model.tags).toEqual([]);
    expect(model.readingTimeMinutes).toBe(1);
    expect(model.publishedAt).toBeNull();
    expect(model.stats.views).toBe(0);
  });

  it('maps new backend statuses to Vietnamese labels', () => {
    expect(postMapper.toModel({ status: 'QUARANTINED' }).statusLabel).toBe('Bị tạm giữ');
    expect(postMapper.toModel({ status: 'HIDDEN' }).statusLabel).toBe('Đã ẩn');
    expect(postMapper.toModel({ status: 'DELETED' }).statusLabel).toBe('Đã xóa');
  });

  it('maps pagination data correctly', () => {
    const list: BlogDetailDto[] = [
      { id: '1', revision: { title: 'Bài 1' } },
      { id: '2', revision: { title: 'Bài 2' } },
    ];
    const meta = { page: 1, limit: 20, total: 2, totalPages: 1 };

    const result = postMapper.toPaginationFromEnvelope(list, meta);

    expect(result.items.length).toBe(2);
    expect(result.metadata.totalItems).toBe(2);
    expect(result.metadata.totalPages).toBe(1);
    expect(result.items[0].title).toBe('Bài 1');
  });

  it('maps backend live-shape CreateDto correctly', () => {
    const createDto = postMapper.toCreateDto({
      title: 'Bài viết mới',
      category: { id: 'cat-9', name: 'Mẹo vặt' },
      excerpt: 'Tóm tắt',
      content: 'Nội dung bài viết đủ dài để gửi backend kiểm duyệt nội dung.',
      tags: ['meo-vat'],
    });

    expect(createDto.type).toBe(PostType.BLOG);
    expect(createDto.title).toBe('Bài viết mới');
    expect(createDto.categoryIds).toEqual(['cat-9']);
    expect(createDto.tags).toEqual(['meo-vat']);
    expect(createDto.body).toContain('Nội dung bài viết');
  });

  it('maps UpdateDto with expectedVersion', () => {
    const updateDto = postMapper.toUpdateDto({ title: 'Sửa', version: 4 });

    expect(updateDto.expectedVersion).toBe(4);
    expect(updateDto.title).toBe('Sửa');
  });

  it('maps related items list properly', () => {
    const related = postMapper.toRelatedList([
      { id: 'rel-1', revision: { title: 'Món liên quan' }, type: 'RECIPE' },
      null,
    ]);

    expect(related.length).toBe(2);
    expect(related[0].id).toBe('rel-1');
    expect(related[1].title).toBe('Nội dung liên quan');
  });

  it('maps related group object { recipes, blogs, videos } per contract', () => {
    const group = postMapper.toRelatedGroup({
      recipes: [
        { id: 'r-1', revision: { title: 'Canh chua chay' }, recipe: { difficulty: 'EASY' } },
      ],
      blogs: [{ id: 'b-1', revision: { title: 'Ăn chay đủ chất', excerpt: 'Tóm tắt' } }],
      videos: [
        {
          id: 'v-1',
          revision: { title: 'Nấu lẩu nấm' },
          media: [{ kind: 'VIDEO', secureUrl: 'https://example.com/v.mp4', durationSeconds: 320 }],
        },
      ],
    });

    expect(group.recipes.length).toBe(1);
    expect(group.recipes[0].id).toBe('r-1');
    expect(group.blogs.length).toBe(1);
    expect(group.blogs[0].excerpt).toBe('Tóm tắt');
    expect(group.videos.length).toBe(1);
    expect(group.videos[0].durationSeconds).toBe(320);
  });

  it('returns empty groups when related payload is missing or malformed', () => {
    expect(postMapper.toRelatedGroup(null)).toEqual({ recipes: [], blogs: [], videos: [] });
    expect(postMapper.toRelatedGroup(undefined)).toEqual({
      recipes: [],
      blogs: [],
      videos: [],
    });
    expect(
      postMapper.toRelatedGroup({ recipes: 'not-an-array', blogs: null } as unknown as {
        recipes?: unknown;
      })
    ).toEqual({ recipes: [], blogs: [], videos: [] });
  });
});
