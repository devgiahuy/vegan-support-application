import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  createPostRequestSchema,
  deletePostQuerySchema,
  deletePostResponseSchema,
  postIdentifierParamsSchema,
  postIdParamsSchema,
  postListQuerySchema,
  postListResponseSchema,
  postResponseSchema,
  relatedPostsQuerySchema,
  relatedPostsResponseSchema,
  updatePostRequestSchema,
  uploadSignatureRequestSchema,
  uploadSignatureResponseSchema,
} from './content.schemas.js';

const authenticated = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];
const optionalAuthenticated = [{}, ...authenticated];

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

const recipeExample = {
  type: 'RECIPE',
  title: 'Đậu hũ xào bông cải',
  excerpt: 'Bữa tối nhanh với đạm thực vật.',
  body: 'Áp chảo đậu hũ rồi xào cùng bông cải và sốt gia vị.',
  categoryIds: ['11111111-1111-4111-8111-111111111111'],
  tags: ['đậu hũ', 'bữa tối'],
  media: [],
  recipe: {
    servings: 2,
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    difficulty: 'EASY',
    nutrition: { calories: 360, proteinGrams: 24, carbsGrams: 28, fatGrams: 18 },
    ingredients: [
      {
        ingredientId: '22222222-2222-4222-8222-222222222222',
        displayName: 'Đậu hũ',
        amount: 300,
        unit: 'g',
      },
    ],
  },
};

export function registerContentOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType): void {
  const createRequest = registry.register('CreatePostRequest', createPostRequestSchema);
  const updateRequest = registry.register('UpdatePostRequest', updatePostRequestSchema);
  const postResponse = registry.register('PostResponse', postResponseSchema);
  const postListResponse = registry.register('PostListResponse', postListResponseSchema);
  const relatedPostsResponse = registry.register(
    'RelatedPostsResponse',
    relatedPostsResponseSchema,
  );
  const deleteResponse = registry.register('DeletePostResponse', deletePostResponseSchema);
  const signatureRequest = registry.register(
    'UploadSignatureRequest',
    uploadSignatureRequestSchema,
  );
  const signatureResponse = registry.register(
    'UploadSignatureResponse',
    uploadSignatureResponseSchema,
  );

  registry.registerPath({
    method: 'get',
    path: '/api/v1/posts',
    tags: ['Content'],
    summary: 'List nội dung published',
    description:
      'Tìm kiếm không dấu và filter published content. Ranking v1: title > canonical ingredient > category/tag > body, sau đó publishedAt và UUID. Với access token hợp lệ, backend tự áp dụng allergy, ingredient exclusion, diet pattern và enabled tradition rules trước ranking; dietPattern từ query không thể nới profile đã lưu. ingredientIds yêu cầu Recipe chứa đủ toàn bộ ID.',
    operationId: 'listPublishedPosts',
    security: optionalAuthenticated,
    request: { query: postListQuerySchema },
    responses: {
      200: {
        description: 'Published Recipe/Blog/Video list',
        content: { 'application/json': { schema: postListResponse } },
      },
      400: errorResponse(errorSchema, 'Query hoặc filter không hợp lệ', [
        'VALIDATION_ERROR',
        'INVALID_SEARCH_QUERY',
      ]),
      401: errorResponse(errorSchema, 'Access token được gửi nhưng không hợp lệ', [
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/posts/{id}/related',
    tags: ['Content'],
    summary: 'Lấy related Recipe, Blog và Video',
    description:
      'Chỉ dùng active published revisions, loại current post và dedupe theo post ID. Mỗi type trả tối đa limitPerType; category/canonical ingredient/normalized tag overlap có trọng số 5/4/3, sau đó publishedAt và UUID. Hard constraints từ profile authenticated luôn chạy trước related score.',
    operationId: 'getRelatedPosts',
    security: optionalAuthenticated,
    request: { params: postIdParamsSchema, query: relatedPostsQuerySchema },
    responses: {
      200: {
        description: 'Ba list riêng recipes, blogs và videos cùng ranking metadata',
        content: { 'application/json': { schema: relatedPostsResponse } },
      },
      400: errorResponse(errorSchema, 'ID, limit hoặc forDate không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Access token được gửi nhưng không hợp lệ', [
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Không tìm thấy published content nguồn', ['NOT_FOUND']),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/posts',
    tags: ['Content'],
    summary: 'Tạo Recipe, Blog hoặc Video',
    description:
      'Không nhận author/status/publishedAt từ client. Trước Phase 07, mọi user-created content đi Member path PENDING_REVIEW; requested Contributor type không cấp quyền.',
    operationId: 'createPost',
    security: authenticated,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: createRequest,
            examples: {
              recipe: { value: recipeExample },
              blog: {
                value: {
                  type: 'BLOG',
                  title: 'Đạm thực vật trong bữa ăn',
                  body: 'Nội dung blog tối thiểu một trăm ký tự để bảo đảm bài viết có nội dung đủ rõ ràng trước khi gửi vào hàng chờ review.',
                  categoryIds: [],
                  media: [],
                },
              },
              video: {
                value: {
                  type: 'VIDEO',
                  title: 'Chuẩn bị bữa ăn xanh',
                  body: 'Mô tả nội dung video và các lưu ý chính cho người xem.',
                  categoryIds: [],
                  media: [
                    {
                      provider: 'YOUTUBE',
                      kind: 'VIDEO',
                      secureUrl: 'https://youtu.be/veganDemo01',
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Post và revision PENDING_REVIEW đã tạo',
        content: { 'application/json': { schema: postResponse } },
      },
      400: errorResponse(errorSchema, 'Content hoặc reference không hợp lệ', [
        'VALIDATION_ERROR',
        'INVALID_CONTENT',
        'INVALID_MEDIA_REFERENCE',
        'INVALID_INGREDIENT_REFERENCE',
      ]),
      401: errorResponse(errorSchema, 'Yêu cầu đăng nhập', ['AUTH_REQUIRED']),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
      409: errorResponse(errorSchema, 'Slug đã được sử dụng', ['CONTENT_SLUG_CONFLICT']),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/posts/{idOrSlug}',
    tags: ['Content'],
    summary: 'Lấy content detail theo UUID hoặc slug',
    description:
      'Guest/non-owner chỉ thấy active published revision. Owner/Admin thấy revision mới nhất để tiếp tục edit; soft-deleted content trả 410 cho owner/Admin và 404 cho public.',
    operationId: 'getPost',
    request: { params: postIdentifierParamsSchema },
    responses: {
      200: {
        description: 'Polymorphic Recipe/Blog/Video detail',
        content: { 'application/json': { schema: postResponse } },
      },
      400: errorResponse(errorSchema, 'Identifier không hợp lệ', ['VALIDATION_ERROR']),
      404: errorResponse(errorSchema, 'Không tìm thấy published content', ['NOT_FOUND']),
      410: errorResponse(errorSchema, 'Owner/Admin truy cập content đã soft-delete', [
        'CONTENT_DELETED',
      ]),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/posts/{id}',
    tags: ['Content'],
    summary: 'Tạo revision mới cho content thuộc quyền sở hữu',
    description:
      'Request là full revision snapshot và bắt buộc expectedVersion. Edit published post tạo PENDING_REVIEW revision mới; published revision cũ vẫn phục vụ public.',
    operationId: 'updatePost',
    security: authenticated,
    request: {
      params: postIdParamsSchema,
      body: {
        required: true,
        content: {
          'application/json': {
            schema: updateRequest,
            example: { ...recipeExample, expectedVersion: 1 },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Revision mới đã tạo',
        content: { 'application/json': { schema: postResponse } },
      },
      400: errorResponse(errorSchema, 'Content hoặc reference không hợp lệ', [
        'VALIDATION_ERROR',
        'INVALID_CONTENT',
        'INVALID_MEDIA_REFERENCE',
        'INVALID_INGREDIENT_REFERENCE',
      ]),
      401: errorResponse(errorSchema, 'Yêu cầu đăng nhập', ['AUTH_REQUIRED']),
      403: errorResponse(errorSchema, 'Không phải owner/Admin', ['FORBIDDEN', 'ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Không tìm thấy content', ['NOT_FOUND']),
      409: errorResponse(errorSchema, 'Version/state/slug conflict', [
        'CONTENT_VERSION_CONFLICT',
        'CONTENT_STATE_CONFLICT',
        'CONTENT_SLUG_CONFLICT',
      ]),
      410: errorResponse(errorSchema, 'Content đã soft-delete', ['CONTENT_DELETED']),
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/v1/posts/{id}',
    tags: ['Content'],
    summary: 'Soft-delete content thuộc quyền sở hữu',
    operationId: 'deletePost',
    security: authenticated,
    request: { params: postIdParamsSchema, query: deletePostQuerySchema },
    responses: {
      200: {
        description: 'Content đã soft-delete; thao tác lặp lại là idempotent',
        content: { 'application/json': { schema: deleteResponse } },
      },
      400: errorResponse(errorSchema, 'expectedVersion không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Yêu cầu đăng nhập', ['AUTH_REQUIRED']),
      403: errorResponse(errorSchema, 'Không phải owner/Admin', ['FORBIDDEN', 'ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Không tìm thấy content', ['NOT_FOUND']),
      409: errorResponse(errorSchema, 'Optimistic version conflict', ['CONTENT_VERSION_CONFLICT']),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/uploads/signature',
    tags: ['Uploads'],
    summary: 'Tạo Cloudinary signed-upload parameters',
    description:
      'Trả cloud name, API key, folder, timestamp và SHA-1 signature có thời hạn; không bao giờ trả API secret. Client phải gửi đúng folder/timestamp đã được ký.',
    operationId: 'createUploadSignature',
    security: authenticated,
    request: {
      body: {
        required: true,
        content: {
          'application/json': { schema: signatureRequest, example: { resourceType: 'image' } },
        },
      },
    },
    responses: {
      200: {
        description: 'Signed upload configuration và MIME/size limits',
        content: { 'application/json': { schema: signatureResponse } },
      },
      400: errorResponse(errorSchema, 'Resource type không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Yêu cầu đăng nhập', ['AUTH_REQUIRED']),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
    },
  });
}
