import { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

export function requireRole(...allowedRoles: Role[]) {
  return function roleAuthorization(
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void {
    if (!request.auth) {
      next(new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập' }));
      return;
    }

    if (!allowedRoles.includes(request.auth.role)) {
      next(
        new AppError({
          statusCode: 403,
          code: 'FORBIDDEN',
          message: 'Bạn không có quyền thực hiện thao tác này',
        }),
      );
      return;
    }

    next();
  };
}

export function assertOwnershipOrRole(
  actor: { userId: string; role: Role },
  ownerId: string,
  allowedRoles: Role[] = [Role.ADMIN],
): void {
  if (actor.userId !== ownerId && !allowedRoles.includes(actor.role)) {
    throw new AppError({
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Bạn không có quyền truy cập tài nguyên này',
    });
  }
}
