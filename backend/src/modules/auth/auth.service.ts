import { randomUUID } from 'node:crypto';
import {
  UserStatus,
  type ContributorApplication,
  type ContributorProfile,
  type User,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type { AppConfig } from '../../config/env.js';
import type { LoginInput, PublicUser, RegisterInput } from './auth.schemas.js';
import type { AuthRepository } from './auth.repository.js';
import {
  DuplicateEmailError,
  type NewSession,
  type UserWithApplications,
} from './auth.repository.js';
import type { PasswordService } from './password.service.js';
import type { TokenService } from './token.service.js';
import { contributorApprovalBasisLabel } from '../contributors/contributor-application.state-machine.js';

interface SessionResult {
  user: PublicUser;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

interface RefreshResult {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

function accountLockedError(lockedUntil: Date | null): AppError {
  return new AppError({
    statusCode: 423,
    code: 'ACCOUNT_LOCKED',
    message: 'Tài khoản đang tạm khóa',
    ...(lockedUntil ? { fields: { lockedUntil: [lockedUntil.toISOString()] } } : {}),
  });
}

function invalidCredentialsError(): AppError {
  return new AppError({
    statusCode: 401,
    code: 'INVALID_CREDENTIALS',
    message: 'Email hoặc mật khẩu không đúng',
  });
}

export function toPublicUser(
  user: User,
  application: ContributorApplication | null = null,
  contributorProfile: ContributorProfile | null = null,
): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    contributorApplication: application
      ? {
          status: application.status,
          claimedApprovalBasis: application.claimedApprovalBasis,
        }
      : null,
    contributorProfile:
      contributorProfile && user.role === 'CONTRIBUTOR' && contributorProfile.revokedAt === null
      ? {
          approvalBasis: contributorProfile.approvalBasis,
          approvalBasisLabel: contributorApprovalBasisLabel(contributorProfile.approvalBasis),
          approvedAt: contributorProfile.approvedAt.toISOString(),
        }
      : null,
  };
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly config: AppConfig,
  ) {}

  async register(input: RegisterInput, deviceInfo?: string): Promise<SessionResult> {
    const passwordHash = await this.passwordService.hash(input.password);
    const refreshToken = this.tokenService.createRefreshToken();
    const refreshTokenExpiresAt = this.refreshExpiry();
    const session = this.newSession(refreshToken, randomUUID(), refreshTokenExpiresAt, deviceInfo);

    let user: UserWithApplications;
    try {
      user = await this.repository.createUserWithSession(input, passwordHash, session);
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        throw new AppError({
          statusCode: 409,
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Email đã được sử dụng',
        });
      }
      throw error;
    }

    return this.sessionResult(user, refreshToken, refreshTokenExpiresAt);
  }

  async login(input: LoginInput, deviceInfo?: string): Promise<SessionResult> {
    let user = await this.repository.findUserByEmail(input.email);
    if (!user || user.status === UserStatus.DELETED) {
      await this.passwordService.hash(input.password);
      throw invalidCredentialsError();
    }

    if (user.status === UserStatus.BANNED) {
      throw new AppError({
        statusCode: 403,
        code: 'ACCOUNT_BANNED',
        message: 'Tài khoản đã bị cấm',
      });
    }

    const now = new Date();
    if (user.status === UserStatus.LOCKED) {
      if (!user.lockedUntil || user.lockedUntil > now) throw accountLockedError(user.lockedUntil);
      user = await this.repository.resetTemporaryLock(user.id);
    }

    if (!(await this.passwordService.verify(input.password, user.passwordHash))) {
      const lockUntil = new Date(now.getTime() + this.config.loginLockMinutes * 60_000);
      const updatedUser = await this.repository.recordLoginFailure(
        user.id,
        this.config.loginMaxAttempts,
        lockUntil,
      );
      if (updatedUser.status === UserStatus.LOCKED)
        throw accountLockedError(updatedUser.lockedUntil);
      throw invalidCredentialsError();
    }

    user = await this.repository.recordSuccessfulLogin(user.id, now);
    const refreshToken = this.tokenService.createRefreshToken();
    const refreshTokenExpiresAt = this.refreshExpiry(now);
    await this.repository.createSession(
      user.id,
      this.newSession(refreshToken, randomUUID(), refreshTokenExpiresAt, deviceInfo),
    );
    const userWithApplication = await this.repository.findUserWithPendingApplication(user.id);
    if (!userWithApplication) throw invalidCredentialsError();
    return this.sessionResult(userWithApplication, refreshToken, refreshTokenExpiresAt);
  }

  async refresh(refreshToken: string, deviceInfo?: string): Promise<RefreshResult> {
    const now = new Date();
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const currentSession = await this.repository.findSessionByTokenHash(tokenHash);
    if (!currentSession) {
      throw new AppError({
        statusCode: 401,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token không hợp lệ',
      });
    }

    if (currentSession.revokedAt) {
      if (currentSession.revokeReason === 'ROLE_CHANGED') {
        throw new AppError({
          statusCode: 401,
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Phiên đăng nhập đã hết hiệu lực sau khi quyền tài khoản thay đổi',
        });
      }
      await this.repository.revokeFamily(currentSession.familyId, 'REUSE_DETECTED', now);
      throw new AppError({
        statusCode: 401,
        code: 'REFRESH_TOKEN_REUSED',
        message: 'Phát hiện refresh token đã được sử dụng lại',
      });
    }

    if (currentSession.expiresAt <= now) {
      await this.repository.revokeSessionByHash(tokenHash, 'EXPIRED', now);
      throw new AppError({ statusCode: 401, code: 'TOKEN_EXPIRED', message: 'Token đã hết hạn' });
    }

    if (currentSession.user.status === UserStatus.BANNED) {
      await this.repository.revokeAllUserSessions(currentSession.userId, 'ACCOUNT_BANNED', now);
      throw new AppError({
        statusCode: 403,
        code: 'ACCOUNT_BANNED',
        message: 'Tài khoản đã bị cấm',
      });
    }

    if (currentSession.user.status === UserStatus.DELETED) {
      await this.repository.revokeAllUserSessions(currentSession.userId, 'ACCOUNT_DELETED', now);
      throw new AppError({
        statusCode: 401,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token không hợp lệ',
      });
    }

    const replacementToken = this.tokenService.createRefreshToken();
    const replacementExpiresAt = this.refreshExpiry(now);
    const rotated = await this.repository.rotateSession(
      currentSession.id,
      currentSession.userId,
      this.newSession(replacementToken, currentSession.familyId, replacementExpiresAt, deviceInfo),
      now,
    );
    if (!rotated) {
      await this.repository.revokeFamily(currentSession.familyId, 'REUSE_DETECTED', now);
      throw new AppError({
        statusCode: 401,
        code: 'REFRESH_TOKEN_REUSED',
        message: 'Phát hiện refresh token đã được sử dụng lại',
      });
    }

    const access = await this.tokenService.issueAccessToken(currentSession.user);
    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt.toISOString(),
      refreshToken: replacementToken,
      refreshTokenExpiresAt: replacementExpiresAt,
    };
  }

  async logout(
    refreshToken: string | undefined,
    allDevices: boolean,
  ): Promise<'CURRENT' | 'ALL_DEVICES'> {
    if (!refreshToken) return allDevices ? 'ALL_DEVICES' : 'CURRENT';

    const now = new Date();
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const session = await this.repository.findSessionByTokenHash(tokenHash);
    if (!session) return allDevices ? 'ALL_DEVICES' : 'CURRENT';

    if (allDevices) {
      await this.repository.revokeAllUserSessions(session.userId, 'LOGOUT_ALL', now);
      return 'ALL_DEVICES';
    }

    await this.repository.revokeSessionByHash(tokenHash, 'LOGOUT', now);
    return 'CURRENT';
  }

  private refreshExpiry(now = new Date()): Date {
    return new Date(now.getTime() + this.config.refreshTokenTtlDays * 86_400_000);
  }

  private newSession(
    refreshToken: string,
    familyId: string,
    expiresAt: Date,
    deviceInfo?: string,
  ): NewSession {
    return {
      tokenHash: this.tokenService.hashRefreshToken(refreshToken),
      familyId,
      expiresAt,
      ...(deviceInfo ? { deviceInfo: deviceInfo.slice(0, 500) } : {}),
    };
  }

  private async sessionResult(
    user: UserWithApplications,
    refreshToken: string,
    refreshTokenExpiresAt: Date,
  ): Promise<SessionResult> {
    const access = await this.tokenService.issueAccessToken(user);
    return {
      user: toPublicUser(user, user.applications[0] ?? null, user.contributorProfile),
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt.toISOString(),
      refreshToken,
      refreshTokenExpiresAt,
    };
  }
}
