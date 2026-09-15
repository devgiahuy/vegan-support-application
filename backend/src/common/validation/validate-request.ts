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

export function validateParams(schema: ZodType) {
  return function paramsValidation(
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void {
    request.validatedParams = schema.parse(request.params);
    next();
  };
}

export function getValidatedParams<T>(request: Request): T {
  return request.validatedParams as T;
}

export function validateQuery(schema: ZodType) {
  return function queryValidation(request: Request, _response: Response, next: NextFunction): void {
    request.validatedQuery = schema.parse(request.query);
    next();
  };
}

export function getValidatedQuery<T>(request: Request): T {
  return request.validatedQuery as T;
}
