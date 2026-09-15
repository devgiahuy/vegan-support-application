import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import { meResponseSchema } from '../auth/auth.schemas.js';
import type { UsersService } from './users.service.js';

export class UsersController {
  constructor(private readonly service: UsersService) {}

  getMe = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập' });
    }
    const user = await this.service.getMe(request.auth.userId);
    response.status(200).json(meResponseSchema.parse({ success: true, data: user, meta: null }));
  };
}
