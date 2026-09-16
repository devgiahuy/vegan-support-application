import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import type { AppConfig } from '../../config/env.js';
import { getValidatedBody } from '../../common/validation/validate-request.js';
import {
  authSessionResponseSchema,
  type LoginInput,
  type LogoutInput,
  logoutResponseSchema,
  refreshResponseSchema,
  type RegisterInput,
} from './auth.schemas.js';
import type { AuthService } from './auth.service.js';

function refreshTokenFromCookies(request: Request): string | undefined {
  const cookies: unknown = request.cookies as unknown;
  if (cookies && typeof cookies === 'object' && 'refreshToken' in cookies) {
    return typeof cookies.refreshToken === 'string' ? cookies.refreshToken : undefined;
  }
  return undefined;
}

export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly config: AppConfig,
  ) {}

  register = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.register(
      getValidatedBody<RegisterInput>(request),
      request.header('user-agent'),
    );
    this.setSessionCookies(response, result);
    response.status(201).json(
      authSessionResponseSchema.parse({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          accessTokenExpiresAt: result.accessTokenExpiresAt,
        },
        meta: null,
      }),
    );
  };

  login = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.login(
      getValidatedBody<LoginInput>(request),
      request.header('user-agent'),
    );
    this.setSessionCookies(response, result);
    response.status(200).json(
      authSessionResponseSchema.parse({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          accessTokenExpiresAt: result.accessTokenExpiresAt,
        },
        meta: null,
      }),
    );
  };

  refresh = async (request: Request, response: Response): Promise<void> => {
    const refreshToken = refreshTokenFromCookies(request);
    if (!refreshToken) {
      response.clearCookie('accessToken', this.cookieOptions());
      response.clearCookie('refreshToken', this.cookieOptions());
      throw new AppError({
        statusCode: 401,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token không hợp lệ',
      });
    }

    try {
      const result = await this.service.refresh(refreshToken, request.header('user-agent'));
      this.setSessionCookies(response, result);
      response.status(200).json(
        refreshResponseSchema.parse({
          success: true,
          data: {
            accessToken: result.accessToken,
            accessTokenExpiresAt: result.accessTokenExpiresAt,
          },
          meta: null,
        }),
      );
    } catch (error) {
      response.clearCookie('accessToken', this.cookieOptions());
      response.clearCookie('refreshToken', this.cookieOptions());
      throw error;
    }
  };

  logout = async (request: Request, response: Response): Promise<void> => {
    const input = getValidatedBody<LogoutInput>(request);
    const scope = await this.service.logout(refreshTokenFromCookies(request), input.allDevices);
    response.clearCookie('accessToken', this.cookieOptions());
    response.clearCookie('refreshToken', this.cookieOptions());
    response.status(200).json(
      logoutResponseSchema.parse({
        success: true,
        data: { loggedOut: true, scope },
        meta: null,
      }),
    );
  };

  private setSessionCookies(
    response: Response,
    result: {
      accessToken: string;
      accessTokenExpiresAt: string;
      refreshToken: string;
      refreshTokenExpiresAt: Date;
    },
  ): void {
    response.cookie('accessToken', result.accessToken, {
      ...this.cookieOptions(),
      expires: new Date(result.accessTokenExpiresAt),
    });
    response.cookie('refreshToken', result.refreshToken, {
      ...this.cookieOptions(),
      expires: result.refreshTokenExpiresAt,
    });
  }

  private cookieOptions(): {
    httpOnly: true;
    secure: boolean;
    sameSite: 'lax';
    path: '/';
  } {
    return { httpOnly: true, secure: this.config.cookieSecure, sameSite: 'lax', path: '/' };
  }
}
