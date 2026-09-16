import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

export function notFoundHandler(request: Request, _response: Response, next: NextFunction): void {
  next(
    new AppError({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: `Không tìm thấy tài nguyên ${request.method} ${request.path}`,
    }),
  );
}
