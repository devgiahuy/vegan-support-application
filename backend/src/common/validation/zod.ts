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

export { z };
