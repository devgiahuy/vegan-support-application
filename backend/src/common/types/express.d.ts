export {};

import type { Role, UserStatus } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      validatedBody?: unknown;
      validatedParams?: unknown;
      validatedQuery?: unknown;
      auth?: {
        userId: string;
        email: string;
        role: Role;
        status: UserStatus;
      };
    }
  }
}
