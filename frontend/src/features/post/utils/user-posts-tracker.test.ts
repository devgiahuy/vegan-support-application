import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTrackedUserPosts,
  addTrackedUserPost,
  removeTrackedUserPost,
} from './user-posts-tracker';

describe('user-posts-tracker', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      length: 0,
      key: () => null,
    };
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: mockStorage },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  });

  it('trả về mảng rỗng khi chưa có bài viết nào', () => {
    expect(getTrackedUserPosts('user-1')).toEqual([]);
    expect(getTrackedUserPosts(null)).toEqual([]);
    expect(getTrackedUserPosts(undefined)).toEqual([]);
  });

  it('lưu bài viết mới và không trùng lặp id', () => {
    addTrackedUserPost('user-1', {
      id: 'post-1',
      type: 'BLOG',
      title: 'Bài viết 1',
      createdAt: '2026-10-25T00:00:00.000Z',
    });

    let posts = getTrackedUserPosts('user-1');
    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe('post-1');

    // Thêm lại cùng id thì ghi đè vị trí đầu tiên
    addTrackedUserPost('user-1', {
      id: 'post-1',
      type: 'BLOG',
      title: 'Bài viết 1 - Cập nhật',
      createdAt: '2026-10-25T01:00:00.000Z',
    });

    posts = getTrackedUserPosts('user-1');
    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe('Bài viết 1 - Cập nhật');
  });

  it('xóa bài viết đúng id khỏi danh sách', () => {
    addTrackedUserPost('user-1', {
      id: 'post-1',
      type: 'BLOG',
      createdAt: '2026-10-25T00:00:00.000Z',
    });
    addTrackedUserPost('user-1', {
      id: 'post-2',
      type: 'RECIPE',
      createdAt: '2026-10-25T00:00:00.000Z',
    });

    expect(getTrackedUserPosts('user-1')).toHaveLength(2);

    removeTrackedUserPost('user-1', 'post-1');
    const remaining = getTrackedUserPosts('user-1');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('post-2');
  });
});
