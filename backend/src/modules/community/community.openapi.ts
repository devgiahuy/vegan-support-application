import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  bookmarkListQuerySchema,
  bookmarkListResponseSchema,
  bookmarkResponseSchema,
  commentListQuerySchema,
  commentListResponseSchema,
  commentParamsSchema,
  commentResponseSchema,
  communityPostParamsSchema,
  communitySummaryResponseSchema,
  createCommentRequestSchema,
  ratingRequestSchema,
  ratingResponseSchema,
  updateCommentRequestSchema,
  voteResponseSchema,
} from './community.schemas.js';

const authenticated = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];
const optionalAuthenticated = [{}, ...authenticated];
const authenticationCodes = ['AUTH_REQUIRED', 'INVALID_ACCESS_TOKEN', 'TOKEN_EXPIRED'];

function errorResponse(errorSchema: ZodType, description: string, codes: string[]) {
  return {
    description,
    content: {
      'application/json': {
        schema: errorSchema,
        examples: Object.fromEntries(
          codes.map((code) => [
            code,
            {
              value: {
                success: false,
                error: {
                  code,
                  message: description,
                  requestId: '0781d468-5eb1-4bd0-9671-e4ca33b76462',
                },
              },
            },
          ]),
        ),
      },
    },
  };
}

function jsonBody(schema: ZodType) {
  return { required: true, content: { 'application/json': { schema } } };
}

export function registerCommunityOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType): void {
  const commentListResponse = registry.register(
    'CommunityCommentListResponse',
    commentListResponseSchema,
  );
  const commentResponse = registry.register('CommunityCommentResponse', commentResponseSchema);
  const voteResponse = registry.register('CommunityVoteResponse', voteResponseSchema);
  const ratingResponse = registry.register('CommunityRatingResponse', ratingResponseSchema);
  const bookmarkResponse = registry.register('CommunityBookmarkResponse', bookmarkResponseSchema);
  const summaryResponse = registry.register(
    'CommunitySummaryResponse',
    communitySummaryResponseSchema,
  );
  const bookmarkListResponse = registry.register(
    'CommunityBookmarkListResponse',
    bookmarkListResponseSchema,
  );

  registry.registerPath({
    method: 'get',
    path: '/api/v1/posts/{id}/comments',
    tags: ['Community'],
    summary: 'List thread comment của published content',
    description:
      'Phân trang comment gốc; reply hiển thị tối đa một tầng. Comment đã xóa/ẩn chỉ còn placeholder khi vẫn có reply visible.',
    operationId: 'listPostComments',
    request: { params: communityPostParamsSchema, query: commentListQuerySchema },
    responses: {
      200: {
        description: 'Danh sách thread comment',
        content: { 'application/json': { schema: commentListResponse } },
      },
      400: errorResponse(errorSchema, 'ID hoặc pagination không hợp lệ', ['VALIDATION_ERROR']),
      404: errorResponse(errorSchema, 'Không tìm thấy published content', ['NOT_FOUND']),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/posts/{id}/comments',
    tags: ['Community'],
    summary: 'Tạo comment hoặc reply một tầng',
    operationId: 'createPostComment',
    security: authenticated,
    request: {
      params: communityPostParamsSchema,
      body: jsonBody(createCommentRequestSchema),
    },
    responses: {
      201: {
        description: 'Comment đã tạo',
        content: { 'application/json': { schema: commentResponse } },
      },
      400: errorResponse(errorSchema, 'Body hoặc parent comment không hợp lệ', [
        'VALIDATION_ERROR',
        'INVALID_COMMENT_PARENT',
      ]),
      401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', authenticationCodes),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Không tìm thấy published content', ['NOT_FOUND']),
      429: errorResponse(errorSchema, 'Vượt giới hạn thao tác community', [
        'COMMUNITY_RATE_LIMITED',
      ]),
    },
  });

  for (const method of ['patch', 'delete'] as const) {
    registry.registerPath({
      method,
      path: '/api/v1/comments/{id}',
      tags: ['Community'],
      summary:
        method === 'patch' ? 'Sửa comment của chính mình' : 'Soft-delete comment của chính mình',
      description:
        method === 'delete'
          ? 'Idempotent khi comment đã soft-delete. Comment bị Admin ẩn không thể đổi trạng thái qua API tác giả.'
          : 'Ghi editedAt; chỉ comment VISIBLE mới sửa được.',
      operationId: method === 'patch' ? 'updateOwnComment' : 'deleteOwnComment',
      security: authenticated,
      request: {
        params: commentParamsSchema,
        ...(method === 'patch' ? { body: jsonBody(updateCommentRequestSchema) } : {}),
      },
      responses: {
        200: {
          description: method === 'patch' ? 'Comment đã sửa' : 'Comment đã soft-delete',
          content: { 'application/json': { schema: commentResponse } },
        },
        400: errorResponse(errorSchema, 'ID hoặc body không hợp lệ', ['VALIDATION_ERROR']),
        401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', authenticationCodes),
        403: errorResponse(errorSchema, 'Tài khoản bị cấm hoặc không phải chủ sở hữu comment', [
          'ACCOUNT_BANNED',
          'COMMENT_OWNER_REQUIRED',
        ]),
        404: errorResponse(errorSchema, 'Không tìm thấy comment', ['NOT_FOUND']),
        409: errorResponse(errorSchema, 'Comment không còn editable', ['COMMENT_NOT_EDITABLE']),
        429: errorResponse(errorSchema, 'Vượt giới hạn thao tác community', [
          'COMMUNITY_RATE_LIMITED',
        ]),
      },
    });
  }

  registry.registerPath({
    method: 'get',
    path: '/api/v1/posts/{id}/community-summary',
    tags: ['Community'],
    summary: 'Lấy aggregate community và viewer state',
    description:
      'Counter/average luôn tính server-side từ record hiện tại. Rating aggregate chỉ có cho Recipe; viewer null với guest.',
    operationId: 'getPostCommunitySummary',
    security: optionalAuthenticated,
    request: { params: communityPostParamsSchema },
    responses: {
      200: {
        description: 'Vote count, rating aggregate và trạng thái viewer',
        content: { 'application/json': { schema: summaryResponse } },
      },
      400: errorResponse(errorSchema, 'ID không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Access token được gửi nhưng không hợp lệ', [
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Không tìm thấy published content', ['NOT_FOUND']),
    },
  });

  for (const method of ['put', 'delete'] as const) {
    registry.registerPath({
      method,
      path: '/api/v1/posts/{id}/vote',
      tags: ['Community'],
      summary: method === 'put' ? 'Upvote content idempotent' : 'Gỡ upvote idempotent',
      operationId: method === 'put' ? 'putPostVote' : 'deletePostVote',
      security: authenticated,
      request: { params: communityPostParamsSchema },
      responses: {
        200: {
          description: 'Trạng thái vote và counter server-side',
          content: { 'application/json': { schema: voteResponse } },
        },
        400: errorResponse(errorSchema, 'ID không hợp lệ', ['VALIDATION_ERROR']),
        401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', authenticationCodes),
        403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
        404: errorResponse(errorSchema, 'Không tìm thấy published content', ['NOT_FOUND']),
        429: errorResponse(errorSchema, 'Vượt giới hạn thao tác community', [
          'COMMUNITY_RATE_LIMITED',
        ]),
      },
    });
  }

  registry.registerPath({
    method: 'put',
    path: '/api/v1/posts/{id}/rating',
    tags: ['Community'],
    summary: 'Upsert taste/difficulty rating cho Recipe',
    description: 'Mỗi điểm từ 1 đến 5; average chỉ dùng active rating và do backend tính.',
    operationId: 'putRecipeRating',
    security: authenticated,
    request: { params: communityPostParamsSchema, body: jsonBody(ratingRequestSchema) },
    responses: {
      200: {
        description: 'Rating hiện tại và aggregate server-side',
        content: { 'application/json': { schema: ratingResponse } },
      },
      400: errorResponse(errorSchema, 'Rating hoặc post type không hợp lệ', [
        'VALIDATION_ERROR',
        'RATING_RECIPE_ONLY',
      ]),
      401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', authenticationCodes),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Không tìm thấy published content', ['NOT_FOUND']),
      429: errorResponse(errorSchema, 'Vượt giới hạn thao tác community', [
        'COMMUNITY_RATE_LIMITED',
      ]),
    },
  });

  for (const method of ['put', 'delete'] as const) {
    registry.registerPath({
      method,
      path: '/api/v1/posts/{id}/bookmark',
      tags: ['Community'],
      summary: method === 'put' ? 'Bookmark Recipe/Video idempotent' : 'Gỡ bookmark idempotent',
      operationId: method === 'put' ? 'putPostBookmark' : 'deletePostBookmark',
      security: authenticated,
      request: { params: communityPostParamsSchema },
      responses: {
        200: {
          description: 'Trạng thái bookmark',
          content: { 'application/json': { schema: bookmarkResponse } },
        },
        400: errorResponse(errorSchema, 'ID hoặc post type không hợp lệ', [
          'VALIDATION_ERROR',
          'BOOKMARK_TYPE_NOT_SUPPORTED',
        ]),
        401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', authenticationCodes),
        403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
        404: errorResponse(errorSchema, 'Không tìm thấy published content', ['NOT_FOUND']),
        429: errorResponse(errorSchema, 'Vượt giới hạn thao tác community', [
          'COMMUNITY_RATE_LIMITED',
        ]),
      },
    });
  }

  registry.registerPath({
    method: 'get',
    path: '/api/v1/users/me/bookmarks',
    tags: ['Community'],
    summary: 'List bookmark Recipe/Video của current user',
    operationId: 'listOwnBookmarks',
    security: authenticated,
    request: { query: bookmarkListQuerySchema },
    responses: {
      200: {
        description: 'Published bookmark list mới nhất trước',
        content: { 'application/json': { schema: bookmarkListResponse } },
      },
      400: errorResponse(errorSchema, 'Pagination hoặc type không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', authenticationCodes),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
    },
  });
}
