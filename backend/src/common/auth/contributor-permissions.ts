import { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

export enum ContributorPermission {
  REVIEW_MEMBER_CONTENT = 'REVIEW_MEMBER_CONTENT',
  VERIFY_NUTRITION_AI = 'VERIFY_NUTRITION_AI',
}

export interface ContributorPermissionActor {
  role: Role;
  hasActiveContributorProfile: boolean;
}

export function hasContributorPermission(
  actor: ContributorPermissionActor,
  permission: ContributorPermission,
): boolean {
  if (actor.role === Role.ADMIN) return true;
  if (actor.role !== Role.CONTRIBUTOR || !actor.hasActiveContributorProfile) return false;
  return Object.values(ContributorPermission).includes(permission);
}

export function requireContributorPermission(permission: ContributorPermission) {
  return function contributorPermissionAuthorization(
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void {
    if (!request.auth) {
      next(new AppError({ statusCode: 401, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập' }));
      return;
    }
    if (!hasContributorPermission(request.auth, permission)) {
      next(
        new AppError({
          statusCode: 403,
          code: 'FORBIDDEN',
          message: 'Cần Contributor đã được Admin phê duyệt để thực hiện thao tác này',
        }),
      );
      return;
    }
    next();
  };
}
