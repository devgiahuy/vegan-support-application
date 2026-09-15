import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

export function validateBody(schema: ZodType) {
  return function bodyValidation(request: Request, _response: Response, next: NextFunction): void {
    const body: unknown = request.body as unknown;
    request.validatedBody = schema.parse(body);
    next();
  };
}

export function getValidatedBody<T>(request: Request): T {
  return request.validatedBody as T;
}
