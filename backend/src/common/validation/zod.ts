import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const mediaUrlSchema = z
  .string()
  .refine((val) => val.startsWith('/') || /^https?:\/\//.test(val), {
    message: 'URL must be a valid HTTP/HTTPS URL or root-relative path',
  })
  .openapi({
    type: 'string',
    description: 'HTTP/HTTPS URL or root-relative path',
    example: 'https://example.com/image.jpg',
  });

export const nullableMediaUrlSchema = z
  .union([
    z.string().refine((val) => val.startsWith('/') || /^https?:\/\//.test(val), {
      message: 'URL must be a valid HTTP/HTTPS URL or root-relative path',
    }),
    z.null(),
  ])
  .openapi({ type: ['string', 'null'] });

function normalizeBlankText(value: unknown, blankValue: null | undefined): unknown {
  if (value === null || (typeof value === 'string' && value.trim().length === 0)) {
    return blankValue;
  }
  return value;
}

export function optionalTrimmedTextSchema(minLength: number, maxLength: number) {
  return z
    .preprocess(
      (value) => normalizeBlankText(value, undefined),
      z.string().trim().min(minLength).max(maxLength).optional(),
    )
    .openapi({
      minLength: 0,
      anyOf: [
        { type: 'string', pattern: '^\\s*$', maxLength },
        { type: 'string', minLength, maxLength },
        { type: 'null' },
      ],
      description: `Null and blank strings are accepted as omitted values. Nonblank text must contain ${String(minLength)} to ${String(maxLength)} characters after trimming.`,
    });
}

export function optionalNullableTrimmedTextSchema(minLength: number, maxLength: number) {
  return z
    .preprocess(
      (value) => normalizeBlankText(value, null),
      z.string().trim().min(minLength).max(maxLength).nullable().optional(),
    )
    .openapi({
      minLength: 0,
      anyOf: [
        { type: 'string', pattern: '^\\s*$', maxLength },
        { type: 'string', minLength, maxLength },
        { type: 'null' },
      ],
      description: `Null and blank strings clear the value. Nonblank text must contain ${String(minLength)} to ${String(maxLength)} characters after trimming.`,
    });
}

export { z };
