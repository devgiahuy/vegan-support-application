import { describe, expect, it } from 'vitest';
import { MemberStatus, UserRole } from '@/common/enums';
import type { User } from '@/features/auth/types/auth.model';
import { getAuthorInitials, resolveAuthorDisplay } from './author-display';

function makeUser(overrides?: Partial<User>): User {
  return {
    id: 'user-1',
    email: 'author@example.com',
    displayName: 'Ngô Gia Huy',
    avatarUrl: 'https://res.cloudinary.com/demo/image/upload/new-avatar.jpg',
    role: UserRole.CONTRIBUTOR,
    status: MemberStatus.ACTIVE,
    createdAt: null,
    contributorApplication: null,
    initials: 'NH',
    ...overrides,
  };
}

describe('getAuthorInitials', () => {
  it('tạo chữ viết tắt giống tài khoản người dùng', () => {
    expect(getAuthorInitials('Demo Platform Contributor')).toBe('DC');
    expect(getAuthorInitials('Ngô Gia Huy')).toBe('NH');
    expect(getAuthorInitials('An')).toBe('AN');
    expect(getAuthorInitials('   ')).toBe('?');
  });
});

describe('resolveAuthorDisplay', () => {
  it('ưu tiên ảnh đại diện và tên mới nhất của tài khoản khi user là tác giả', () => {
    const resolved = resolveAuthorDisplay(
      {
        id: 'user-1',
        name: 'Tên cũ',
        avatarUrl: 'https://example.com/old-avatar.jpg',
        avatar: 'https://i.pravatar.cc/80?img=32',
      },
      makeUser()
    );

    expect(resolved).toEqual({
      name: 'Ngô Gia Huy',
      avatarUrl: 'https://res.cloudinary.com/demo/image/upload/new-avatar.jpg',
      initials: 'NH',
      isCurrentUser: true,
    });
  });

  it('trả về chuỗi rỗng khi tác giả vừa xóa ảnh đại diện khỏi tài khoản (không rớt về ảnh cũ)', () => {
    const resolved = resolveAuthorDisplay(
      {
        id: 'user-1',
        name: 'Demo Platform Contributor',
        avatarUrl: 'https://example.com/stale-avatar.jpg',
        avatar: 'https://example.com/stale-avatar.jpg',
      },
      makeUser({ displayName: 'Demo Platform Contributor', avatarUrl: '', initials: 'DC' })
    );

    expect(resolved).toEqual({
      name: 'Demo Platform Contributor',
      avatarUrl: '',
      initials: 'DC',
      isCurrentUser: true,
    });
  });

  it('giữ nguyên dữ liệu tác giả từ API khi người xem không phải tác giả', () => {
    const resolved = resolveAuthorDisplay(
      {
        id: 'other-user',
        name: 'Demo Platform Contributor',
        avatarUrl: null,
      },
      makeUser(),
      { fallbackName: 'Bếp Chay An Nhiên' }
    );

    expect(resolved).toEqual({
      name: 'Demo Platform Contributor',
      avatarUrl: '',
      initials: 'DC',
      isCurrentUser: false,
    });
  });

  it('hỗ trợ assumeOwnerIfMeId cho bình luận mới tạo ở client', () => {
    const resolved = resolveAuthorDisplay(
      {
        id: 'me',
        displayName: 'Cũ',
        avatarUrl: null,
      },
      makeUser(),
      { assumeOwnerIfMeId: true }
    );

    expect(resolved.isCurrentUser).toBe(true);
    expect(resolved.avatarUrl).toBe('https://res.cloudinary.com/demo/image/upload/new-avatar.jpg');
  });

  it('an toàn khi author và currentUser đều thiếu', () => {
    const resolved = resolveAuthorDisplay(null, null, { fallbackName: 'Bếp Chay An Nhiên' });

    expect(resolved).toEqual({
      name: 'Bếp Chay An Nhiên',
      avatarUrl: '',
      initials: 'BN',
      isCurrentUser: false,
    });
  });
});
