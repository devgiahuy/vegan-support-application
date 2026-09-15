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
