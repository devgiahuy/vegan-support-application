import type { NextFunction, Request, Response } from 'express';
import type { Logger } from 'pino';
import { ZodError } from 'zod';
import { AppError, type ErrorFields } from '../errors/app-error.js';
import { errorResponseSchema } from '../schemas/api-envelope.schemas.js';

interface HttpParserError extends Error {
  status?: number;
  type?: string;
}

function isHttpParserError(error: unknown): error is HttpParserError {
  return error instanceof Error && ('status' in error || 'type' in error);
}

function zodFields(error: ZodError): ErrorFields {
  const fields: ErrorFields = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.') || '_root';
    fields[field] = [...(fields[field] ?? []), issue.message];
  }
  return fields;
}

function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof ZodError) {
    return new AppError({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Dữ liệu không hợp lệ',
      fields: zodFields(error),
    });
  }

  if (isHttpParserError(error) && error.type === 'entity.too.large') {
    return new AppError({
      statusCode: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Dữ liệu gửi lên vượt quá giới hạn cho phép',
    });
  }

  if (isHttpParserError(error) && error.type === 'entity.parse.failed') {
    return new AppError({
      statusCode: 400,
      code: 'INVALID_JSON',
      message: 'Nội dung JSON không hợp lệ',
    });
  }

  return new AppError({
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Đã xảy ra lỗi hệ thống',
    expose: false,
  });
}

export function createErrorHandler(logger: Logger) {
  return function errorHandler(
    error: unknown,
    request: Request,
    response: Response,
    _next: NextFunction,
  ): void {
    const normalized = normalizeError(error);

    if (normalized.statusCode >= 500) {
      logger.error(
        {
          errorName: error instanceof Error ? error.name : 'UnknownError',
          requestId: request.requestId,
        },
        'Request failed',
      );
    }

    const body = errorResponseSchema.parse({
      success: false,
      error: {
        code: normalized.code,
        message: normalized.expose ? normalized.message : 'Đã xảy ra lỗi hệ thống',
        ...(normalized.fields ? { fields: normalized.fields } : {}),
        requestId: request.requestId,
      },
    });

    response.status(normalized.statusCode).json(body);
  };
}
