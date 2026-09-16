import { z } from 'zod';

const databaseUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith('postgresql://') || value.startsWith('postgres://'), {
    message: 'must be a PostgreSQL URL',
  });

const bodyLimitSchema = z.string().regex(/^\d+(?:b|kb|mb)$/i, 'must use a byte, kb, or mb suffix');

const frontendOriginSchema = z
  .string()
  .min(1)
  .superRefine((value, context) => {
    for (const origin of value.split(',')) {
      try {
        const parsedOrigin = new URL(origin.trim());
        if (!['http:', 'https:'].includes(parsedOrigin.protocol)) {
          context.addIssue({ code: 'custom', message: 'origins must use HTTP or HTTPS' });
        }
      } catch {
        context.addIssue({ code: 'custom', message: 'contains an invalid origin URL' });
      }
    }
  });

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
    DATABASE_URL: databaseUrlSchema,
    FRONTEND_ORIGIN: frontendOriginSchema.default('http://localhost:3000'),
    JSON_BODY_LIMIT: bodyLimitSchema.default('1mb'),
    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(10_000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ISSUER: z.string().min(1).default('vegan-support-api'),
    JWT_AUDIENCE: z.string().min(1).default('vegan-support-web'),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3_600).default(900),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
    LOGIN_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(20).default(5),
    LOGIN_LOCK_MINUTES: z.coerce.number().int().min(1).max(1_440).default(15),
    CLOUDINARY_CLOUD_NAME: z.string().trim().min(1),
    CLOUDINARY_API_KEY: z.string().trim().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    CLOUDINARY_UPLOAD_FOLDER: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9/_-]+$/)
      .default('vegan-support/posts'),
    MAX_UPLOAD_IMAGE_BYTES: z.coerce.number().int().min(1).max(25_000_000).default(10_000_000),
    MAX_UPLOAD_VIDEO_BYTES: z.coerce.number().int().min(1).max(250_000_000).default(100_000_000),
  })
  .transform((environment) => ({
    nodeEnv: environment.NODE_ENV,
    port: environment.PORT,
    databaseUrl: environment.DATABASE_URL,
    frontendOrigins: environment.FRONTEND_ORIGIN.split(',').map((origin) => {
      const trimmedOrigin = origin.trim();
      return new URL(trimmedOrigin).origin;
    }),
    jsonBodyLimit: environment.JSON_BODY_LIMIT,
    shutdownTimeoutMs: environment.SHUTDOWN_TIMEOUT_MS,
    logLevel: environment.LOG_LEVEL,
    jwtAccessSecret: environment.JWT_ACCESS_SECRET,
    jwtIssuer: environment.JWT_ISSUER,
    jwtAudience: environment.JWT_AUDIENCE,
    accessTokenTtlSeconds: environment.ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenTtlDays: environment.REFRESH_TOKEN_TTL_DAYS,
    loginMaxAttempts: environment.LOGIN_MAX_ATTEMPTS,
    loginLockMinutes: environment.LOGIN_LOCK_MINUTES,
    cloudinaryCloudName: environment.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: environment.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: environment.CLOUDINARY_API_SECRET,
    cloudinaryUploadFolder: environment.CLOUDINARY_UPLOAD_FOLDER,
    maxUploadImageBytes: environment.MAX_UPLOAD_IMAGE_BYTES,
    maxUploadVideoBytes: environment.MAX_UPLOAD_VIDEO_BYTES,
    cookieSecure: environment.NODE_ENV === 'production',
  }));

export type AppConfig = z.infer<typeof environmentSchema>;

export class ConfigurationError extends Error {
  constructor(readonly issues: string[]) {
    super(`Cấu hình môi trường không hợp lệ: ${issues.join('; ')}`);
    this.name = 'ConfigurationError';
  }
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = environmentSchema.safeParse(environment);
  if (!result.success) {
    throw new ConfigurationError(
      result.error.issues.map(
        (issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`,
      ),
    );
  }
  return result.data;
}
