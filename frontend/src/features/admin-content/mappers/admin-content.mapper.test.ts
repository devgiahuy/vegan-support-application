import { describe, it, expect } from 'vitest';
import { PostStatus, PostType, VideoSource } from '@/common/enums';
import type { BasePostDto } from '@/features/post/types/post.dto';
import { ADMIN_CONTENT_STATUS_OPTIONS } from '../types/admin-content.options';
import { adminContentMapper, parsePostStatusStrict } from './admin-content.mapper';
import type { AdminContentListResult } from '../types/admin-content.model';

const SESSION_USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';

function recipeDto(overrides: Partial<BasePostDto> = {}): BasePostDto {
  return {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    type: PostType.RECIPE,
    slug: 'mon-cu-chay-thien-dinh',
    status: PostStatus.PUBLISHED,
    version: 4,
    publishedRevisionVersion: 3,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-05T11:30:00.000Z',
    author: { id: SESSION_USER_ID, displayName: 'Võ Minh Tuấn', avatarUrl: null },
    revision: {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      version: 4,
      status: 'DRAFT',
      title: 'Món củ chay thiên định',
      excerpt: 'Món chay giàu đạm',
      tags: ['thien-dinh', 'cao-dinh'],
      createdAt: '2026-10-05T11:30:00.000Z',
    },
    categories: [{ id: 'cccc', name: 'Món chay', slug: 'mon-chay', type: 'RECIPE_GROUP' }],
    media: [
      {
        id: 'dddd',
        kind: 'COVER_IMAGE',
        provider: 'CLOUDINARY',
        secureUrl: 'https://res.example.com/cover.jpg',
        bytes: 245678,
        width: 1200,
        height: 900,
        durationSeconds: null,
      },
    ],
    ...overrides,
  };
}

function videoDto(overrides: Partial<BasePostDto> = {}): BasePostDto {
  return recipeDto({
    type: PostType.VIDEO,
    slug: 'video-nau-mon-chay',
    media: [
      {
        id: 'eeee',
        kind: 'VIDEO',
        provider: 'YOUTUBE',
        secureUrl: 'https://www.youtube.com/watch?v=abc123',
        durationSeconds: 320,
        bytes: null,
        width: null,
        height: null,
      },
    ],
    ...overrides,
  });
}

describe('AdminContentMapper Unit Tests', () => {
  describe('toAdminRow', () => {
    it('trả về giá trị mặc định an toàn khi dto rỗng', () => {
      const row = adminContentMapper.toAdminRow(null, SESSION_USER_ID);

      expect(row.id).toBe('');
      expect(row.title).toBe('Nội dung chưa có tiêu đề');
      expect(row.type).toBe(PostType.BLOG);
      expect(row.typeLabel).toBe('Bài viết');
      expect(row.status).toBe(PostStatus.DRAFT);
      expect(row.statusLabel).toBe('Bản nháp');
      expect(row.isEditable).toBe(false);
      expect(row.authorId).toBe('');
      expect(row.version).toBe(1);
      expect(row.moderationSignalCount).toBe(0);
      expect(row.hasPendingRevision).toBe(false);
      expect(row.categoryNames).toEqual([]);
      expect(row.tagLabels).toEqual([]);
      expect(row.coverUrl).toBeNull();
      expect(row.durationSeconds).toBeNull();
      expect(row.createdAt).toBeNull();
    });

    it('ánh xạ đủ công thức của chính quản trị viên', () => {
      const row = adminContentMapper.toAdminRow(recipeDto(), SESSION_USER_ID);

      expect(row.id).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
      expect(row.type).toBe(PostType.RECIPE);
      expect(row.typeLabel).toBe('Công thức');
      expect(row.title).toBe('Món củ chay thiên định');
      expect(row.slug).toBe('mon-cu-chay-thien-dinh');
      expect(row.authorId).toBe(SESSION_USER_ID);
      expect(row.authorName).toBe('Võ Minh Tuấn');
      expect(row.status).toBe(PostStatus.PUBLISHED);
      expect(row.statusLabel).toBe('Đã xuất bản');
      expect(row.version).toBe(4);
      expect(row.revisionId).toBe('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
      expect(row.revisionVersion).toBe(4);
      expect(row.publishedRevisionVersion).toBe(3);
      expect(row.categoryNames).toEqual(['Món chay']);
      expect(row.tagLabels).toEqual(['thien-dinh', 'cao-dinh']);
      expect(row.coverUrl).toBe('https://res.example.com/cover.jpg');
      expect(row.createdAt).toBeInstanceOf(Date);
      expect(row.updatedAt).toBeInstanceOf(Date);
    });

    it('ánh xạ đủ bài viết với type BLOG', () => {
      const row = adminContentMapper.toAdminRow(
        recipeDto({ type: PostType.BLOG, slug: 'bai-viet' }),
        SESSION_USER_ID
      );

      expect(row.type).toBe(PostType.BLOG);
      expect(row.typeLabel).toBe('Bài viết');
      expect(row.videoSource).toBeNull();
    });

    it('ánh xạ đủ video kèm nguồn và thời lượng', () => {
      const row = adminContentMapper.toAdminRow(videoDto(), SESSION_USER_ID);

      expect(row.type).toBe(PostType.VIDEO);
      expect(row.typeLabel).toBe('Video');
      expect(row.videoSource).toBe(VideoSource.YOUTUBE);
      expect(row.durationSeconds).toBe(320);
      expect(row.coverUrl).toBeNull();
    });
  });

  describe('isEditable — quyền ghi của quản trị viên', () => {
    it('false khi tác giả khác phiên đăng nhập', () => {
      const row = adminContentMapper.toAdminRow(
        recipeDto({ author: { id: OTHER_USER_ID, displayName: 'Thành viên' } }),
        SESSION_USER_ID
      );

      expect(row.isEditable).toBe(false);
    });

    it('false khi phiên chưa đăng nhập', () => {
      const row = adminContentMapper.toAdminRow(recipeDto(), '');

      expect(row.isEditable).toBe(false);
    });

    it('false khi đang có bản nháp chờ duyệt', () => {
      const row = adminContentMapper.toAdminRow(
        recipeDto({ revision: { id: 'bbbb', version: 5, status: 'PENDING_REVIEW', title: 'T' } }),
        SESSION_USER_ID
      );

      expect(row.hasPendingRevision).toBe(true);
      expect(row.isEditable).toBe(false);
    });

    it('true cho nội dung đã xuất bản không có bản nháp đang chờ', () => {
      const row = adminContentMapper.toAdminRow(recipeDto(), SESSION_USER_ID);

      expect(row.status).toBe(PostStatus.PUBLISHED);
      expect(row.hasPendingRevision).toBe(false);
      expect(row.isEditable).toBe(true);
    });

    it.each([
      PostStatus.HIDDEN,
      PostStatus.FLAGGED,
      PostStatus.DELETED,
      PostStatus.QUARANTINED,
      PostStatus.PENDING_REVIEW,
    ])('false cho trạng thái %s', (status) => {
      const row = adminContentMapper.toAdminRow(recipeDto({ status }), SESSION_USER_ID);

      expect(row.isEditable).toBe(false);
    });

    it.each([PostStatus.DRAFT, PostStatus.REJECTED, PostStatus.PUBLISHED])(
      'true cho trạng thái %s khi là tác giả và không có bản nháp chờ',
      (status) => {
        const row = adminContentMapper.toAdminRow(recipeDto({ status }), SESSION_USER_ID);

        expect(row.isEditable).toBe(true);
      }
    );
  });

  describe('kết quả danh sách', () => {
    it('toPublishedOnlyResult đặt source = published-only', () => {
      const result = adminContentMapper.toPublishedOnlyResult(
        { data: [recipeDto(), videoDto()], meta: { page: 1, limit: 20, total: 2, totalPages: 1 } },
        SESSION_USER_ID
      );

      expect(result.source).toBe('published-only');
      expect(result.rows).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalItems).toBe(2);
      expect(result.totalPages).toBe(1);
    });

    it('toAdminListResult đặt source = admin-list', () => {
      const result = adminContentMapper.toAdminListResult(
        { data: [recipeDto()], meta: { page: 2, limit: 10, total: 25, totalPages: 3 } },
        SESSION_USER_ID
      );

      expect(result.source).toBe('admin-list');
      expect(result.rows).toHaveLength(1);
      expect(result.page).toBe(2);
      expect(result.totalItems).toBe(25);
      expect(result.totalPages).toBe(3);
    });

    it('chuẩn hoá meta thiếu: page >= 1 và totalPages >= 1', () => {
      const result = adminContentMapper.toPublishedOnlyResult(
        { data: null, meta: null },
        SESSION_USER_ID
      );

      expect(result.rows).toEqual([]);
      expect(result.page).toBeGreaterThanOrEqual(1);
      expect(result.limit).toBeGreaterThanOrEqual(1);
      expect(result.totalPages).toBeGreaterThanOrEqual(1);
      expect(result.totalItems).toBe(0);
    });

    it('bỏ qua phần tử null trong data', () => {
      const result = adminContentMapper.toPublishedOnlyResult(
        { data: [recipeDto(), null, videoDto()], meta: null },
        SESSION_USER_ID
      );

      expect(result.rows).toHaveLength(2);
    });
  });

  describe('mapAdminContentError', () => {
    const cases: [string, string][] = [
      ['CONTENT_VERSION_CONFLICT', 'Nội dung đã được thay đổi bởi thao tác khác.'],
      ['CONTENT_STATE_CONFLICT', 'Nội dung đang chờ duyệt nên chưa thể chỉnh sửa.'],
      ['CONTENT_SLUG_CONFLICT', 'Đường dẫn đã tồn tại. Vui lòng chọn đường dẫn khác.'],
      ['CONTENT_DELETED', 'Nội dung này đã bị xóa.'],
      ['INVALID_CONTENT', 'Nội dung chưa hợp lệ. Vui lòng kiểm tra lại.'],
      ['INVALID_INGREDIENT_REFERENCE', 'Nguyên liệu đã chọn không còn hợp lệ.'],
      ['INGREDIENT_ID_NAME_MISMATCH', 'Tên nguyên liệu không khớp với nguyên liệu đã chọn.'],
      ['INVALID_MEDIA_REFERENCE', 'Tệp đính kèm không hợp lệ. Vui lòng tải lại.'],
      ['STORAGE_QUOTA_EXCEEDED', 'Bạn đã vượt hạn mứng dung lượng cho phép.'],
      ['UPLOAD_RESERVATION_EXPIRED', 'Phiên tải lên đã hết hạn. Vui lòng thử lại.'],
      ['UPLOAD_PROVIDER_MISMATCH', 'Tệp tải lên không đúng nhà cung cấp đã đăng ký.'],
      ['SELF_APPROVAL_FORBIDDEN', 'Bạn không thể tự duyệt nội dung do chính mình là tác giả.'],
      ['REVIEW_ALREADY_DECIDED', 'Nội dung này đã có quyết định duyệt trước đó.'],
      ['REVIEW_CONFLICT', 'Có quản trị viên khác vừa xử lý nội dung này.'],
      ['CONTENT_AUTHOR_INACTIVE', 'Tác giả không còn hoạt động nên không thể xuất bản.'],
      ['FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.'],
      ['VALIDATION_ERROR', 'Vui lòng kiểm tra lại các trường được đánh dấu.'],
    ];

    it.each(cases)('ánh xạ mã %s sang thông báo tiếng Việt', (code, expected) => {
      expect(adminContentMapper.mapAdminContentError(code)).toBe(expected);
    });

    it('mã lạ trả thông báo chung tiếng Việt', () => {
      expect(adminContentMapper.mapAdminContentError('SOME_UNKNOWN_CODE')).toBe(
        'Thao tác thất bại. Vui lòng thử lại.'
      );
    });

    it('mã rỗng hoặc null trả thông báo chung', () => {
      expect(adminContentMapper.mapAdminContentError(undefined)).toBe(
        'Thao tác thất bại. Vui lòng thử lại.'
      );
      expect(adminContentMapper.mapAdminContentError('')).toBe(
        'Thao tác thất bại. Vui lòng thử lại.'
      );
    });

    it('mọi thông báo đều bằng tiếng Việt, không chứa thông báo thô từ máy chủ', () => {
      const all = cases.map(([code]) => adminContentMapper.mapAdminContentError(code));
      all.push(adminContentMapper.mapAdminContentError('RAW_BACKEND_MESSAGE'));

      for (const message of all) {
        expect(message).toBeTruthy();
        expect(message).not.toMatch(/[A-Z_]{6,}/);
        expect(message.endsWith('.')).toBe(true);
      }
    });
  });

  describe('enum safety', () => {
    it('không bao giờ sinh PostStatus.ARCHIVED trong lựa chọn bộ lọc', () => {
      const values = ADMIN_CONTENT_STATUS_OPTIONS.map((option) => option.value);

      expect(values).not.toContain(PostStatus.ARCHIVED);
      expect(values).toHaveLength(8);
    });

    it('parsePostStatusStrict bỏ qua ARCHIVED và trả DRAFT', () => {
      expect(parsePostStatusStrict(PostStatus.ARCHIVED)).toBe(PostStatus.DRAFT);
      expect(parsePostStatusStrict('ARCHIVED')).toBe(PostStatus.DRAFT);
      expect(parsePostStatusStrict('published')).toBe(PostStatus.PUBLISHED);
      expect(parsePostStatusStrict('KHONG_CO')).toBe(PostStatus.DRAFT);
    });

    it('mọi trạng thái mapper trả về đều nằm trong tập 8 giá trị hợp lệ', () => {
      const allowed = new Set<string>(ADMIN_CONTENT_STATUS_OPTIONS.map((option) => option.value));

      for (const dto of [
        recipeDto(),
        recipeDto({ status: 'ARCHIVED' }),
        recipeDto({ status: 'khong_xac_dinh' }),
      ]) {
        const row = adminContentMapper.toAdminRow(dto, SESSION_USER_ID);
        expect(allowed.has(row.status)).toBe(true);
      }
    });
  });

  describe('moderationSignalCount', () => {
    it('đếm tín hiệu và tuyệt đối không làm thay đổi status', () => {
      const withSignals = {
        ...recipeDto(),
        moderationSignalCount: 3,
      } as BasePostDto;

      const row = adminContentMapper.toAdminRow(withSignals, SESSION_USER_ID);

      expect(row.moderationSignalCount).toBe(3);
      expect(row.status).toBe(PostStatus.PUBLISHED);
      expect(row.isEditable).toBe(true);
    });

    it('giá trị âm hoặc rác được chuẩn hoá về 0', () => {
      const negative = { ...recipeDto(), moderationSignalCount: -5 } as BasePostDto;
      const garbage = { ...recipeDto(), moderationSignalCount: 'abc' } as unknown as BasePostDto;

      expect(adminContentMapper.toAdminRow(negative, SESSION_USER_ID).moderationSignalCount).toBe(
        0
      );
      expect(adminContentMapper.toAdminRow(garbage, SESSION_USER_ID).moderationSignalCount).toBe(0);
    });
  });

  describe('getStatusBadgeClass', () => {
    it('trả lớp khác nhau theo mức độ trạng thái', () => {
      const draft = adminContentMapper.getStatusBadgeClass(PostStatus.DRAFT);
      const published = adminContentMapper.getStatusBadgeClass(PostStatus.PUBLISHED);
      const deleted = adminContentMapper.getStatusBadgeClass(PostStatus.DELETED);

      expect(draft).not.toBe(published);
      expect(published).not.toBe(deleted);
      expect(published).not.toBe('');
    });
  });

  describe('kết quả trả về không chứa tham chiếu DTO', () => {
    it('AdminContentListResult chỉ chứa các trường Model đã định nghĩa', () => {
      const result: AdminContentListResult = adminContentMapper.toPublishedOnlyResult(
        { data: [recipeDto()], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } },
        SESSION_USER_ID
      );

      expect(Object.keys(result).sort()).toEqual(
        ['limit', 'page', 'rows', 'source', 'totalItems', 'totalPages'].sort()
      );
      expect(Object.keys(result.rows[0]).sort()).toEqual(
        [
          'authorId',
          'authorName',
          'categoryNames',
          'coverUrl',
          'createdAt',
          'deletedAt',
          'durationSeconds',
          'hasPendingRevision',
          'id',
          'isEditable',
          'moderationSignalCount',
          'publishedRevisionVersion',
          'reviewNote',
          'revisionId',
          'revisionVersion',
          'slug',
          'status',
          'statusLabel',
          'submittedAt',
          'tagLabels',
          'title',
          'type',
          'typeLabel',
          'updatedAt',
          'version',
          'videoSource',
        ].sort()
      );
    });
  });
});
