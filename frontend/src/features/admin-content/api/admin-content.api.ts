import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { PostType, RecipeDifficulty, VideoSource } from '@/common/enums';
import { adminContentMapper } from '../mappers/admin-content.mapper';
import { reviewApi } from '@/features/review/api/review.api';
import { recipeMapper } from '@/features/recipe/mappers/recipe.mapper';
import { postMapper } from '@/features/post/mappers/post.mapper';
import { videoMapper } from '@/features/video/mappers/video.mapper';
import type { Recipe } from '@/features/recipe/types/recipe.model';
import type { Article } from '@/features/post/types/post.model';
import type { Video } from '@/features/video/types/video.model';
import type {
  AdminContentDeleteResponseDto,
  AdminContentHistoryQueryDto,
  AdminContentListQueryDto,
  AdminContentListResponseDto,
} from '../types/admin-content.dto';
import type { AdminContentListResult, AdminContentSubmitInput } from '../types/admin-content.model';
import type { BasePostDto, PostDetailResponseDto } from '@/features/post/types/post.dto';
import type {
  CreateRecipeRequestDto,
  RecipeDetailResponseDto,
  UpdateRecipeRequestDto,
} from '@/features/recipe/types/recipe.dto';
import type { CreatePostRequestDto, UpdatePostRequestDto } from '@/features/post/types/post.dto';
import type {
  CreateVideoRequestDto,
  UpdateVideoRequestDto,
} from '@/features/video/types/video.dto';

/**
 * Đối tượng nội dung thống nhất cho mọi thao tác ghi ở khu vực quản trị.
 *
 * Cố ý KHÔNG dùng `Partial<Recipe & Article & Video>`: phép giao của ba Model có
 * các trường `author` mâu thuẫn nhau nên kiểu đó không khởi tạo được. Thay vào đó
 * khai báo đúng **các trường mà ba mapper đọc**, để trình biên dịch bắt được sai
 * sót khi hợp đồng đổi.
 */
export interface AdminContentDraft {
  title?: string;
  excerpt?: string;
  content?: string;
  description?: string;
  tags?: string[];
  slug?: string;
  body?: string;
  videoUrl?: string;
  videoSource?: VideoSource;
  durationSeconds?: number;
  coverImageUrl?: string;
  coverMedia?: { assetId?: string; publicId?: string; mimeType?: string; bytes?: number } | null;
  videoMedia?: { assetId?: string; publicId?: string; mimeType?: string; bytes?: number } | null;
  category?: { id?: string; name?: string; slug?: string } | null;
  categoryId?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: RecipeDifficulty;
  nutrition?: Record<string, number | null>;
  ingredients?: unknown[];
  steps?: unknown[];
  /** Version điều phối lạc quan — `toUpdateDto` gắn vào `expectedVersion`. */
  version?: number;
}

export interface AdminContentListParams extends AdminContentListQueryDto {
  /**
   * Chỉ dùng cho đường dẫn `GET /posts?type=…` hiện tại. Bộ lọc `status`,
   * `authorId`, `updatedFrom`, `updatedTo` **không** được gửi tới endpoint này vì
   * máy chủ bỏ qua âm thầm (contracts/api-consumers.md §7).
   */
  type?: PostType;
}

function assertListPayload(res: {
  data?: AdminContentListResponseDto | null;
}): AdminContentListResponseDto {
  const body = res.data;
  if (body?.success && Array.isArray(body.data)) return body;
  // 200 nhưng sai định dạng là lỗi thật — KHÔNG biến thành danh sách rỗng (FR-007).
  throw new Error('Phản hồi danh sách nội dung không đúng định dạng.');
}

export const adminContentApi = {
  /**
   * Danh sách nội dung của khu vực quản trị.
   *
   * Hiện dùng **ba truy vấn song song** `GET /posts?type=…` rồi hợp nhất, vì
   * `GET /api/v1/posts` là `listPublished`: chỉ trả nội dung đã xuất bản và không
   * nhận bộ lọc author/status (research.md R-06). Khi CG-01 `READY`, thay toàn bộ
   * thân hàm này bằng một truy vấn `GET /admin/posts` + `toAdminListResult`.
   */
  listContent: async (
    params: AdminContentListParams,
    sessionUserId: string
  ): Promise<AdminContentListResult> => {
    const type = params.type;
    const baseParams = {
      page: params.page,
      limit: params.limit,
      q: params.q,
      category: params.categoryId,
    };

    if (type) {
      const res = await api.get<AdminContentListResponseDto>(API_ENDPOINTS.POSTS.LIST, {
        params: { ...baseParams, type },
        silent: true,
      });
      return adminContentMapper.toPublishedOnlyResult(assertListPayload(res), sessionUserId);
    }

    const types = [PostType.RECIPE, PostType.BLOG, PostType.VIDEO];
    const responses = await Promise.all(
      types.map((eachType) =>
        api
          .get<AdminContentListResponseDto>(API_ENDPOINTS.POSTS.LIST, {
            params: { ...baseParams, type: eachType },
            silent: true,
          })
          .then(assertListPayload)
      )
    );

    const merged: AdminContentListResponseDto = {
      success: true,
      data: responses.flatMap((response) => response.data ?? []),
      meta: {
        page: responses[0]?.meta?.page ?? params.page ?? 1,
        limit: params.limit ?? responses[0]?.meta?.limit ?? 20,
        total: responses.reduce((sum, response) => sum + (response.meta?.total ?? 0), 0),
        totalPages: responses.reduce(
          (max, response) => Math.max(max, response.meta?.totalPages ?? 0),
          0
        ),
      },
    };

    return adminContentMapper.toPublishedOnlyResult(merged, sessionUserId);
  },

  /**
   * Chi tiết một nội dung. `GET /posts/:idOrSlug` có ngoại lệ đọc cho Admin nên quản
   * trị viên xem được cả bản nháp của người khác; `DELETED` trả `410 CONTENT_DELETED`.
   */
  getContent: async (idOrSlug: string): Promise<BasePostDto> => {
    const res = await api.get<PostDetailResponseDto>(API_ENDPOINTS.POSTS.DETAIL(idOrSlug), {
      silent: true,
    });
    if (res.data?.success && res.data.data) return res.data.data;
    throw new Error('Không tìm thấy nội dung.');
  },

  /** Tạo mới — luôn sinh bản nháp, không tự công khai (FR-016). */
  createContent: async (
    type: PostType,
    draft: AdminContentDraft
  ): Promise<Recipe | Article | Video> => {
    const res = await api.post<PostDetailResponseDto>(
      API_ENDPOINTS.POSTS.CREATE,
      buildCreateDto(type, draft),
      { showErrorToast: true }
    );
    return unwrapCreateResponse(type, res);
  },

  /**
   * Cập nhật — `expectedVersion` nằm trong THÂN của `PATCH /posts/:id`
   * (contracts/api-consumers.md §3.2). Bản đang công khai giữ nguyên cho tới khi
   * bản nháp mới được duyệt.
   */
  updateContent: async (
    id: string,
    type: PostType,
    draft: AdminContentDraft
  ): Promise<Recipe | Article | Video> => {
    const res = await api.patch<PostDetailResponseDto>(
      API_ENDPOINTS.POSTS.UPDATE(id),
      buildUpdateDto(type, draft),
      { showErrorToast: true }
    );
    return unwrapCreateResponse(type, res);
  },

  /**
   * Xoá mềm — `expectedVersion` là THAM SỐ TRUY VẤN, không nằm trong thân
   * (contracts/api-consumers.md §3.3). Bằng chứng kiểm toán được giữ (FR-029).
   */
  deleteContent: async (
    id: string,
    expectedVersion: number
  ): Promise<{ id: string; status: string }> => {
    const res = await api.delete<AdminContentDeleteResponseDto>(API_ENDPOINTS.POSTS.DELETE(id), {
      params: { expectedVersion },
      showErrorToast: true,
    });
    if (res.data?.success && res.data.data?.id) {
      return { id: res.data.data.id, status: res.data.data.status ?? 'DELETED' };
    }
    throw new Error('Không xoá được nội dung.');
  },

  /**
   * Gửi duyệt — `revisionId` và `expectedVersion` đều bắt buộc. Nội dung do chính
   * quản trị viên tạo vẫn phải qua hàng đợi (quyết định Q2).
   */
  submitContent: async (id: string, input: AdminContentSubmitInput): Promise<void> => {
    await api.post(
      API_ENDPOINTS.CONTENT_REVIEW.SUBMIT(id),
      { revisionId: input.revisionId, expectedVersion: input.expectedVersion },
      { showErrorToast: true }
    );
  },

  /**
   * Lịch sử duyệt — uỷ quyền cho `reviewApi` vì hợp đồng đã được ánh xạ đầy đủ ở
   * `features/review` (research.md R-05).
   */
  getContentHistory: async (id: string, params?: AdminContentHistoryQueryDto) => {
    return reviewApi.getReviewHistory(id, params);
  },
};

/** Chọn đúng mapper theo loại nội dung — không viết lại logic của ba mapper gốc. */
function buildCreateDto(type: PostType, draft: AdminContentDraft) {
  switch (type) {
    case PostType.RECIPE:
      return recipeMapper.toCreateDto(draft as Partial<Recipe>) as CreateRecipeRequestDto;
    case PostType.VIDEO:
      return videoMapper.toCreateDto(draft as Partial<Video>) as CreateVideoRequestDto;
    case PostType.BLOG:
    default:
      return postMapper.toCreateDto(draft as Partial<Article>) as CreatePostRequestDto;
  }
}

function buildUpdateDto(type: PostType, draft: AdminContentDraft) {
  switch (type) {
    case PostType.RECIPE:
      return recipeMapper.toUpdateDto(draft as Partial<Recipe>) as UpdateRecipeRequestDto;
    case PostType.VIDEO:
      return videoMapper.toUpdateDto(draft as Partial<Video>) as UpdateVideoRequestDto;
    case PostType.BLOG:
    default:
      return postMapper.toUpdateDto(draft as Partial<Article>) as UpdatePostRequestDto;
  }
}

function unwrapCreateResponse(type: PostType, res: { data?: PostDetailResponseDto | null }) {
  const data = res.data?.data;
  if (!res.data?.success || !data) {
    throw new Error('Không tạo được nội dung.');
  }
  switch (type) {
    case PostType.RECIPE:
      return recipeMapper.toModel(data as RecipeDetailResponseDto['data']);
    case PostType.VIDEO:
      return videoMapper.toModel(data as never);
    case PostType.BLOG:
    default:
      return postMapper.toModel(data as never);
  }
}
