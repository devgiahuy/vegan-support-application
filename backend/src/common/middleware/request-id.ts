import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const safeRequestIdPattern = /^[a-zA-Z0-9._:-]{1,128}$/;

export function requestIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const suppliedRequestId = request.header('x-request-id');
  request.requestId =
    suppliedRequestId && safeRequestIdPattern.test(suppliedRequestId)
      ? suppliedRequestId
      : randomUUID();
  response.setHeader('x-request-id', request.requestId);
  next();
}
