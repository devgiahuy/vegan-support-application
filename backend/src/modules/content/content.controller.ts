import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../../common/validation/validate-request.js';
import {
  deletePostResponseSchema,
  postListResponseSchema,
  postResponseSchema,
  relatedPostsResponseSchema,
  uploadSignatureResponseSchema,
  type CreatePostInput,
  type DeletePostQuery,
  type PostIdentifierParams,
  type PostIdParams,
  type PostListQuery,
  type RelatedPostsQuery,
  type UpdatePostInput,
  type UploadSignatureInput,
} from './content.schemas.js';
import type { ContentActor, ContentService } from './content.service.js';
import type { MediaService } from './media.service.js';

function actorFromRequest(request: Request): ContentActor {
  if (request.auth) return { userId: request.auth.userId, role: request.auth.role };
  throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập' });
}

export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly mediaService: MediaService,
  ) {}

  listPosts = async (request: Request, response: Response): Promise<void> => {
    const result = await this.contentService.listPublished(
      getValidatedQuery<PostListQuery>(request),
      request.auth ? { userId: request.auth.userId, role: request.auth.role } : undefined,
    );
    response.status(200).json(
      postListResponseSchema.parse({
        success: true,
        data: result.data,
        meta: result.meta,
      }),
    );
  };

  getRelatedPosts = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<PostIdParams>(request);
    const result = await this.contentService.getRelated(
      id,
      getValidatedQuery<RelatedPostsQuery>(request),
      request.auth ? { userId: request.auth.userId, role: request.auth.role } : undefined,
    );
    response.status(200).json(
      relatedPostsResponseSchema.parse({
        success: true,
        data: result.data,
        meta: result.meta,
      }),
    );
  };

  getPost = async (request: Request, response: Response): Promise<void> => {
    const { idOrSlug } = getValidatedParams<PostIdentifierParams>(request);
    const data = await this.contentService.getPost(
      idOrSlug,
      request.auth ? { userId: request.auth.userId, role: request.auth.role } : undefined,
    );
    response.status(200).json(postResponseSchema.parse({ success: true, data, meta: null }));
  };

  createPost = async (request: Request, response: Response): Promise<void> => {
    const data = await this.contentService.createPost(
      actorFromRequest(request),
      getValidatedBody<CreatePostInput>(request),
    );
    response.status(201).json(postResponseSchema.parse({ success: true, data, meta: null }));
  };

  updatePost = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<PostIdParams>(request);
    const data = await this.contentService.updatePost(
      actorFromRequest(request),
      id,
      getValidatedBody<UpdatePostInput>(request),
    );
    response.status(200).json(postResponseSchema.parse({ success: true, data, meta: null }));
  };

  deletePost = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<PostIdParams>(request);
    const data = await this.contentService.deletePost(
      actorFromRequest(request),
      id,
      getValidatedQuery<DeletePostQuery>(request),
    );
    response.status(200).json(deletePostResponseSchema.parse({ success: true, data, meta: null }));
  };

  createUploadSignature = (request: Request, response: Response): void => {
    const data = this.mediaService.createUploadSignature(
      getValidatedBody<UploadSignatureInput>(request),
    );
    response
      .status(200)
      .json(uploadSignatureResponseSchema.parse({ success: true, data, meta: null }));
  };
}
