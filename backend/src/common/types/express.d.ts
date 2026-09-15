export {};

import type { Role, UserStatus } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      validatedBody?: unknown;
      auth?: {
        userId: string;
        email: string;
        role: Role;
        status: UserStatus;
      };
    }
  }
}
