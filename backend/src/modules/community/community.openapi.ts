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
    summary: 'List thread comment c?a published content',
    description:
      'Ph�n trang comment g?c; reply hi?n th? t?i da m?t t?ng. Comment d� x�a/?n ch? c�n placeholder khi v?n c� reply visible.',
    operationId: 'listPostComments',
    request: { params: communityPostParamsSchema, query: commentListQuerySchema },
    responses: {
      200: {
        description: 'Danh s�ch thread comment',
        content: { 'application/json': { schema: commentListResponse } },
      },
      400: errorResponse(errorSchema, 'ID ho?c pagination kh�ng h?p l?', ['VALIDATION_ERROR']),
      404: errorResponse(errorSchema, 'Kh�ng t�m th?y published content', ['NOT_FOUND']),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/posts/{id}/comments',
    tags: ['Community'],
    summary: 'T?o comment ho?c reply m?t t?ng',
    operationId: 'createPostComment',
    security: authenticated,
    request: {
      params: communityPostParamsSchema,
      body: jsonBody(createCommentRequestSchema),
    },
    responses: {
      201: {
        description: 'Comment d� t?o',
        content: { 'application/json': { schema: commentResponse } },
      },
      400: errorResponse(errorSchema, 'Body ho?c parent comment kh�ng h?p l?', [
        'VALIDATION_ERROR',
        'INVALID_COMMENT_PARENT',
      ]),
      401: errorResponse(errorSchema, 'Y�u c?u access token h?p l?', authenticationCodes),
      403: errorResponse(errorSchema, 'T�i kho?n b? c?m', ['ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Kh�ng t�m th?y published content', ['NOT_FOUND']),
      429: errorResponse(errorSchema, 'Vu?t gi?i h?n thao t�c community', [
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
        method === 'patch' ? 'S?a comment c?a ch�nh m�nh' : 'Soft-delete comment c?a ch�nh m�nh',
      description:
        method === 'delete'
          ? 'Idempotent khi comment d� soft-delete. Comment b? Admin ?n kh�ng th? d?i tr?ng th�i qua API t�c gi?.'
          : 'Ghi editedAt; ch? comment VISIBLE m?i s?a du?c.',
      operationId: method === 'patch' ? 'updateOwnComment' : 'deleteOwnComment',
      security: authenticated,
      request: {
        params: commentParamsSchema,
        ...(method === 'patch' ? { body: jsonBody(updateCommentRequestSchema) } : {}),
      },
      responses: {
        200: {
          description: method === 'patch' ? 'Comment d� s?a' : 'Comment d� soft-delete',
          content: { 'application/json': { schema: commentResponse } },
        },
        400: errorResponse(errorSchema, 'ID ho?c body kh�ng h?p l?', ['VALIDATION_ERROR']),
        401: errorResponse(errorSchema, 'Y�u c?u access token h?p l?', authenticationCodes),
        403: errorResponse(errorSchema, 'T�i kho?n b? c?m ho?c kh�ng ph?i ch? s? h?u comment', [
          'ACCOUNT_BANNED',
          'COMMENT_OWNER_REQUIRED',
        ]),
        404: errorResponse(errorSchema, 'Kh�ng t�m th?y comment', ['NOT_FOUND']),
        409: errorResponse(errorSchema, 'Comment kh�ng c�n editable', ['COMMENT_NOT_EDITABLE']),
        429: errorResponse(errorSchema, 'Vu?t gi?i h?n thao t�c community', [
          'COMMUNITY_RATE_LIMITED',
        ]),
      },
    });
  }

  registry.registerPath({
    method: 'get',
    path: '/api/v1/posts/{id}/community-summary',
    tags: ['Community'],
    summary: 'L?y aggregate community v� viewer state',
    description:
      'Counter/average lu�n t�nh server-side t? record hi?n t?i. Rating aggregate ch? c� cho Recipe; viewer null v?i guest.',
    operationId: 'getPostCommunitySummary',
    security: optionalAuthenticated,
    request: { params: communityPostParamsSchema },
    responses: {
      200: {
        description: 'Vote count, rating aggregate v� tr?ng th�i viewer',
        content: { 'application/json': { schema: summaryResponse } },
      },
      400: errorResponse(errorSchema, 'ID kh�ng h?p l?', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Access token du?c g?i nhung kh�ng h?p l?', [
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'T�i kho?n b? c?m', ['ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Kh�ng t�m th?y published content', ['NOT_FOUND']),
    },
  });

  for (const method of ['put', 'delete'] as const) {
    registry.registerPath({
      method,
      path: '/api/v1/posts/{id}/vote',
      tags: ['Community'],
      summary: method === 'put' ? 'Upvote content idempotent' : 'G? upvote idempotent',
      operationId: method === 'put' ? 'putPostVote' : 'deletePostVote',
      security: authenticated,
      request: { params: communityPostParamsSchema },
      responses: {
        200: {
          description: 'Tr?ng th�i vote v� counter server-side',
          content: { 'application/json': { schema: voteResponse } },
        },
        400: errorResponse(errorSchema, 'ID kh�ng h?p l?', ['VALIDATION_ERROR']),
        401: errorResponse(errorSchema, 'Y�u c?u access token h?p l?', authenticationCodes),
        403: errorResponse(errorSchema, 'T�i kho?n b? c?m', ['ACCOUNT_BANNED']),
        404: errorResponse(errorSchema, 'Kh�ng t�m th?y published content', ['NOT_FOUND']),
        429: errorResponse(errorSchema, 'Vu?t gi?i h?n thao t�c community', [
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
    description: 'M?i di?m t? 1 d?n 5; average ch? d�ng active rating v� do backend t�nh.',
    operationId: 'putRecipeRating',
    security: authenticated,
    request: { params: communityPostParamsSchema, body: jsonBody(ratingRequestSchema) },
    responses: {
      200: {
        description: 'Rating hi?n t?i v� aggregate server-side',
        content: { 'application/json': { schema: ratingResponse } },
      },
      400: errorResponse(errorSchema, 'Rating ho?c post type kh�ng h?p l?', [
        'VALIDATION_ERROR',
        'RATING_RECIPE_ONLY',
      ]),
      401: errorResponse(errorSchema, 'Y�u c?u access token h?p l?', authenticationCodes),
      403: errorResponse(errorSchema, 'T�i kho?n b? c?m', ['ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Kh�ng t�m th?y published content', ['NOT_FOUND']),
      429: errorResponse(errorSchema, 'Vu?t gi?i h?n thao t�c community', [
        'COMMUNITY_RATE_LIMITED',
      ]),
    },
  });

  for (const method of ['put', 'delete'] as const) {
    registry.registerPath({
      method,
      path: '/api/v1/posts/{id}/bookmark',
      tags: ['Community'],
      summary: method === 'put' ? 'Bookmark Recipe/Video idempotent' : 'G? bookmark idempotent',
      operationId: method === 'put' ? 'putPostBookmark' : 'deletePostBookmark',
      security: authenticated,
      request: { params: communityPostParamsSchema },
      responses: {
        200: {
          description: 'Tr?ng th�i bookmark',
          content: { 'application/json': { schema: bookmarkResponse } },
        },
        400: errorResponse(errorSchema, 'ID ho?c post type kh�ng h?p l?', [
          'VALIDATION_ERROR',
          'BOOKMARK_TYPE_NOT_SUPPORTED',
        ]),
        401: errorResponse(errorSchema, 'Y�u c?u access token h?p l?', authenticationCodes),
        403: errorResponse(errorSchema, 'T�i kho?n b? c?m', ['ACCOUNT_BANNED']),
        404: errorResponse(errorSchema, 'Kh�ng t�m th?y published content', ['NOT_FOUND']),
        429: errorResponse(errorSchema, 'Vu?t gi?i h?n thao t�c community', [
          'COMMUNITY_RATE_LIMITED',
        ]),
      },
    });
  }

  registry.registerPath({
    method: 'get',
    path: '/api/v1/users/me/bookmarks',
    tags: ['Community'],
    summary: 'List bookmark Recipe/Video c?a current user',
    operationId: 'listOwnBookmarks',
    security: authenticated,
    request: { query: bookmarkListQuerySchema },
    responses: {
      200: {
        description: 'Published bookmark list m?i nh?t tru?c',
        content: { 'application/json': { schema: bookmarkListResponse } },
      },
      400: errorResponse(errorSchema, 'Pagination ho?c type kh�ng h?p l?', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Y�u c?u access token h?p l?', authenticationCodes),
      403: errorResponse(errorSchema, 'T�i kho?n b? c?m', ['ACCOUNT_BANNED']),
    },
  });
}
