import { AppError } from '../../common/errors/app-error.js';
import type { PublicUser } from '../auth/auth.schemas.js';
import type { AuthRepository } from '../auth/auth.repository.js';
import { toPublicUser } from '../auth/auth.service.js';

export class UsersService {
  constructor(private readonly repository: AuthRepository) {}

  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.repository.findUserWithPendingApplication(userId);
    if (!user) {
      throw new AppError({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Không tìm thấy người dùng',
      });
    }
    return toPublicUser(user, user.applications[0] ?? null);
  }
}
