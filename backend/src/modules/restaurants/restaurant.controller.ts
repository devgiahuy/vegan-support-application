import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../../common/validation/validate-request.js';
import type {
  AdminEditInput,
  AdminListQuery,
  NearbyQuery,
  RestaurantInput,
  ReviewInput,
  SearchQuery,
} from './restaurant.schemas.js';
import type { RestaurantService } from './restaurant.service.js';

function userId(request: Request): string {
  if (request.auth) return request.auth.userId;
  throw new AppError({
    statusCode: 401,
    code: 'AUTH_REQUIRED',
    message: 'Authentication required',
  });
}

export class RestaurantController {
  constructor(private readonly service: RestaurantService) {}

  nearby = async (request: Request, response: Response): Promise<void> => {
    response.setHeader('Cache-Control', 'no-store');
    response.json({
      success: true,
      ...(await this.service.discover(
        getValidatedQuery<NearbyQuery>(request),
        request.auth?.userId,
      )),
    });
  };
  search = async (request: Request, response: Response): Promise<void> => {
    response.setHeader('Cache-Control', 'no-store');
    response.json({
      success: true,
      ...(await this.service.discover(
        getValidatedQuery<SearchQuery>(request),
        request.auth?.userId,
      )),
    });
  };
  get = async (request: Request, response: Response): Promise<void> => {
    response.setHeader('Cache-Control', 'no-store');
    response.json({
      success: true,
      data: await this.service.get(
        getValidatedParams<{ id: string }>(request).id,
        request.auth?.userId,
      ),
    });
  };
  submit = async (request: Request, response: Response): Promise<void> => {
    response.status(201).json({
      success: true,
      data: await this.service.submit(userId(request), getValidatedBody<RestaurantInput>(request)),
    });
  };
  mine = async (request: Request, response: Response): Promise<void> => {
    response.json({
      success: true,
      ...(await this.service.mine(
        userId(request),
        getValidatedQuery<{ page: number; limit: number }>(request),
      )),
    });
  };
  adminList = async (request: Request, response: Response): Promise<void> => {
    response.json({
      success: true,
      ...(await this.service.adminList(getValidatedQuery<AdminListQuery>(request))),
    });
  };
  review = async (request: Request, response: Response): Promise<void> => {
    response.json({
      success: true,
      data: await this.service.review(
        getValidatedParams<{ id: string }>(request).id,
        userId(request),
        getValidatedBody<ReviewInput>(request),
      ),
    });
  };
  adminEdit = async (request: Request, response: Response): Promise<void> => {
    response.json({
      success: true,
      data: await this.service.adminEdit(
        getValidatedParams<{ id: string }>(request).id,
        userId(request),
        getValidatedBody<AdminEditInput>(request),
      ),
    });
  };
  history = async (request: Request, response: Response): Promise<void> => {
    response.json({
      success: true,
      data: await this.service.history(getValidatedParams<{ id: string }>(request).id),
    });
  };
  geocode = async (request: Request, response: Response): Promise<void> => {
    response.setHeader('Cache-Control', 'no-store');
    response.json({
      success: true,
      ...(await this.service.geocode(getValidatedQuery<{ address: string }>(request).address)),
    });
  };
}
