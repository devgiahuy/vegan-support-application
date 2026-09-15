import { UserStatus } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import type { AuthRepository } from './auth.repository.js';
import type { TokenService } from './token.service.js';
import { ExpiredAccessTokenError, InvalidAccessTokenError } from './token.service.js';

function accessTokenFromRequest(request: Request): string | null {
  const authorization = request.header('authorization');
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7).trim() || null;

  const cookies: unknown = request.cookies as unknown;
  if (cookies && typeof cookies === 'object' && 'accessToken' in cookies) {
    const accessToken = cookies.accessToken;
    return typeof accessToken === 'string' && accessToken ? accessToken : null;
  }
  return null;
}

export class AuthenticationMiddleware {
  constructor(
    private readonly tokenService: TokenService,
    private readonly repository: AuthRepository,
  ) {}

  authenticate = async (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): Promise<void> => {
    const token = accessTokenFromRequest(request);
    if (!token) {
      next(new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập' }));
      return;
    }

    try {
      await this.attachAuthenticatedUser(request, token);
      next();
    } catch (error) {
      next(this.toAuthenticationError(error));
    }
  };

  optionalAuthenticate = async (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): Promise<void> => {
    const token = accessTokenFromRequest(request);
    if (!token) {
      next();
      return;
    }

    try {
      await this.attachAuthenticatedUser(request, token);
      next();
    } catch (error) {
      next(this.toAuthenticationError(error));
    }
  };

  private async attachAuthenticatedUser(request: Request, token: string): Promise<void> {
    const claims = await this.tokenService.verifyAccessToken(token);
    const user = await this.repository.findUserById(claims.userId);
    if (!user || user.status === UserStatus.DELETED) throw new InvalidAccessTokenError();
    if (user.status === UserStatus.BANNED) {
      throw new AppError({
        statusCode: 403,
        code: 'ACCOUNT_BANNED',
        message: 'Tài khoản đã bị cấm',
      });
    }
    if (claims.role !== user.role) {
      throw new AppError({
        statusCode: 401,
        code: 'STALE_ACCESS_TOKEN',
        message: 'Quyền tài khoản đã thay đổi, vui lòng đăng nhập lại',
      });
    }
    request.auth = {
      userId: user.id,
      email: user.email,
      role: user.role,
      contributorType: user.contributorProfile?.contributorType ?? null,
      status: user.status,
    };
  }

  private toAuthenticationError(error: unknown): AppError {
    if (error instanceof AppError) return error;
    if (error instanceof ExpiredAccessTokenError) {
      return new AppError({ statusCode: 401, code: 'TOKEN_EXPIRED', message: 'Token đã hết hạn' });
    }
    if (error instanceof InvalidAccessTokenError) {
      return new AppError({
        statusCode: 401,
        code: 'INVALID_ACCESS_TOKEN',
        message: 'Access token không hợp lệ',
      });
    }
    return new AppError({
      statusCode: 401,
      code: 'INVALID_ACCESS_TOKEN',
      message: 'Access token không hợp lệ',
    });
  }
}
