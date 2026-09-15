import { CommentStatus, PostType } from '@prisma/client';
import { z } from '../../common/validation/zod.js';

export const communityPostParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const commentParamsSchema = z.object({ id: z.string().uuid() }).strict();

export const commentListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    order: z.enum(['oldest', 'newest']).default('oldest'),
  })
  .strict();

export const createCommentRequestSchema = z
  .object({
    content: z.string().trim().min(1).max(2_000),
    parentId: z.string().uuid().optional(),
  })
  .strict();

export const updateCommentRequestSchema = z
  .object({ content: z.string().trim().min(1).max(2_000) })
  .strict();

export const ratingRequestSchema = z
  .object({
    taste: z.number().int().min(1).max(5),
    difficulty: z.number().int().min(1).max(5),
  })
  .strict();

export const bookmarkListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum([PostType.RECIPE, PostType.VIDEO]).optional(),
  })
  .strict();

const communityAuthorSchema = z
  .object({
    id: z.string().uuid(),
    displayName: z.string(),
    avatarUrl: z.string().nullable(),
  })
  .strict();

const commentReplySchema = z
  .object({
    id: z.string().uuid(),
    postId: z.string().uuid(),
    parentId: z.string().uuid(),
    content: z.string(),
    status: z.literal(CommentStatus.VISIBLE),
    isPlaceholder: z.literal(false),
    author: communityAuthorSchema,
    editedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
  })
  .strict();

export const commentSchema = z
  .object({
    id: z.string().uuid(),
    postId: z.string().uuid(),
    parentId: z.string().uuid().nullable(),
    content: z.string().nullable(),
    status: z.enum(CommentStatus),
    isPlaceholder: z.boolean(),
    author: communityAuthorSchema.nullable(),
    editedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    replies: z.array(commentReplySchema),
  })
  .strict();

const paginationMetaSchema = z
  .object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();

const ratingAggregateSchema = z
  .object({
    count: z.number().int().nonnegative(),
    tasteAverage: z.number().min(1).max(5).nullable(),
    difficultyAverage: z.number().min(1).max(5).nullable(),
  })
  .strict();

const currentRatingSchema = z
  .object({ taste: z.number().int().min(1).max(5), difficulty: z.number().int().min(1).max(5) })
  .strict();

export const commentListResponseSchema = z
  .object({ success: z.literal(true), data: z.array(commentSchema), meta: paginationMetaSchema })
  .strict();

export const commentResponseSchema = z
  .object({ success: z.literal(true), data: commentSchema, meta: z.null() })
  .strict();

export const voteResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        postId: z.string().uuid(),
        voted: z.boolean(),
        voteCount: z.number().int().nonnegative(),
      })
      .strict(),
    meta: z.null(),
  })
  .strict();

export const ratingResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        postId: z.string().uuid(),
        rating: currentRatingSchema,
        aggregate: ratingAggregateSchema,
      })
      .strict(),
    meta: z.null(),
  })
  .strict();

export const bookmarkResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({ postId: z.string().uuid(), bookmarked: z.boolean() }).strict(),
    meta: z.null(),
  })
  .strict();

export const communitySummaryResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        postId: z.string().uuid(),
        voteCount: z.number().int().nonnegative(),
        rating: ratingAggregateSchema.nullable(),
        viewer: z
          .object({
            voted: z.boolean(),
            bookmarked: z.boolean(),
            rating: currentRatingSchema.nullable(),
          })
          .nullable(),
      })
      .strict(),
    meta: z.null(),
  })
  .strict();

const bookmarkItemSchema = z
  .object({
    postId: z.string().uuid(),
    type: z.enum([PostType.RECIPE, PostType.VIDEO]),
    slug: z.string(),
    title: z.string(),
    excerpt: z.string().nullable(),
    coverImageUrl: z.string().url().nullable(),
    publishedAt: z.string().datetime(),
    bookmarkedAt: z.string().datetime(),
  })
  .strict();

export const bookmarkListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(bookmarkItemSchema),
    meta: paginationMetaSchema,
  })
  .strict();

export type CommunityPostParams = z.infer<typeof communityPostParamsSchema>;
export type CommentParams = z.infer<typeof commentParamsSchema>;
export type CommentListQuery = z.infer<typeof commentListQuerySchema>;
export type CreateCommentInput = z.infer<typeof createCommentRequestSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentRequestSchema>;
export type RatingInput = z.infer<typeof ratingRequestSchema>;
export type BookmarkListQuery = z.infer<typeof bookmarkListQuerySchema>;
export type CommentOutput = z.infer<typeof commentSchema>;
