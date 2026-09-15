import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import { getValidatedBody } from '../../common/validation/validate-request.js';
import {
  dietPreferenceResponseSchema,
  dietScheduleResponseSchema,
  healthProfileResponseSchema,
  profileResponseSchema,
  type HealthProfileInput,
  type SaveDietPreferencesInput,
  type UpdateBasicProfileInput,
  type UpdateDietScheduleInput,
} from '../profile/profile.schemas.js';
import type { ProfileService } from '../profile/profile.service.js';

function authenticatedUserId(request: Request): string {
  if (request.auth) return request.auth.userId;
  throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập' });
}

export class UsersController {
  constructor(private readonly service: ProfileService) {}

  getMe = async (request: Request, response: Response): Promise<void> => {
    const profile = await this.service.getProfile(authenticatedUserId(request));
    response
      .status(200)
      .json(profileResponseSchema.parse({ success: true, data: profile, meta: null }));
  };

  updateMe = async (request: Request, response: Response): Promise<void> => {
    const profile = await this.service.updateBasicProfile(
      authenticatedUserId(request),
      getValidatedBody<UpdateBasicProfileInput>(request),
    );
    response
      .status(200)
      .json(profileResponseSchema.parse({ success: true, data: profile, meta: null }));
  };

  updateHealthProfile = async (request: Request, response: Response): Promise<void> => {
    const healthProfile = await this.service.updateHealthProfile(
      authenticatedUserId(request),
      getValidatedBody<HealthProfileInput>(request),
    );
    response
      .status(200)
      .json(healthProfileResponseSchema.parse({ success: true, data: healthProfile, meta: null }));
  };

  saveDietPreferences = async (request: Request, response: Response): Promise<void> => {
    const preference = await this.service.saveDietPreferences(
      authenticatedUserId(request),
      getValidatedBody<SaveDietPreferencesInput>(request),
    );
    response
      .status(200)
      .json(dietPreferenceResponseSchema.parse({ success: true, data: preference, meta: null }));
  };

  updateDietSchedule = async (request: Request, response: Response): Promise<void> => {
    const schedule = await this.service.updateDietSchedule(
      authenticatedUserId(request),
      getValidatedBody<UpdateDietScheduleInput>(request),
    );
    response
      .status(200)
      .json(dietScheduleResponseSchema.parse({ success: true, data: schedule, meta: null }));
  };
}
