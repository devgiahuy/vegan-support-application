import {
  ContributorApplicationSource,
  ContributorApplicationStatus,
  Prisma,
  Role,
  type PrismaClient,
  type RefreshSession,
  type User,
  UserStatus,
} from '@prisma/client';
import type { ContributorApplicationStateMachine } from '../contributors/contributor-application.state-machine.js';
import type { RegisterInput } from './auth.schemas.js';

const userWithContributorContextInclude = {
  applications: {
    where: { status: ContributorApplicationStatus.PENDING },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
  contributorProfile: true,
} satisfies Prisma.UserInclude;

export type UserWithApplications = Prisma.UserGetPayload<{
  include: typeof userWithContributorContextInclude;
}>;
export type AuthenticatedUser = Prisma.UserGetPayload<{ include: { contributorProfile: true } }>;
export type SessionWithUser = RefreshSession & { user: AuthenticatedUser };

export class DuplicateEmailError extends Error {}

export interface NewSession {
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  deviceInfo?: string;
}

export class AuthRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly contributorStateMachine: ContributorApplicationStateMachine,
  ) {}

  async createUserWithSession(
    input: RegisterInput,
    passwordHash: string,
    session: NewSession,
  ): Promise<UserWithApplications> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            email: input.email,
            passwordHash,
            displayName: input.displayName,
            role: Role.MEMBER,
            status: UserStatus.ACTIVE,
          },
        });
        const application = input.contributorRequest
          ? await transaction.contributorApplication.create({
              data: this.contributorStateMachine.pendingApplicationData(
                user.id,
                ContributorApplicationSource.REGISTRATION,
                input.contributorRequest,
              ),
            })
          : null;
        await transaction.refreshSession.create({ data: { userId: user.id, ...session } });
        return {
          ...user,
          applications: application ? [application] : [],
          contributorProfile: null,
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DuplicateEmailError();
      }
      throw error;
    }
  }

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findUserById(userId: string): Promise<AuthenticatedUser | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { contributorProfile: true },
    });
  }

  findUserWithPendingApplication(userId: string): Promise<UserWithApplications | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: userWithContributorContextInclude,
    });
  }

  async recordLoginFailure(userId: string, maxAttempts: number, lockedUntil: Date): Promise<User> {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.user.findUniqueOrThrow({ where: { id: userId } });
      const failedLoginAttempts = current.failedLoginAttempts + 1;
      return transaction.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts,
          ...(failedLoginAttempts >= maxAttempts ? { status: UserStatus.LOCKED, lockedUntil } : {}),
        },
      });
    });
  }

  resetTemporaryLock(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE, failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  recordSuccessfulLogin(userId: string, now: Date): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: now,
      },
    });
  }

  createSession(userId: string, session: NewSession): Promise<RefreshSession> {
    return this.prisma.refreshSession.create({ data: { userId, ...session } });
  }

  findSessionByTokenHash(tokenHash: string): Promise<SessionWithUser | null> {
    return this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: { include: { contributorProfile: true } } },
    });
  }

  async rotateSession(
    currentSessionId: string,
    userId: string,
    replacement: NewSession,
    now: Date,
  ): Promise<RefreshSession | null> {
    return this.prisma.$transaction(async (transaction) => {
      const revoked = await transaction.refreshSession.updateMany({
        where: { id: currentSessionId, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now, revokeReason: 'ROTATED', lastUsedAt: now },
      });
      if (revoked.count !== 1) return null;

      const created = await transaction.refreshSession.create({
        data: { userId, ...replacement },
      });
      await transaction.refreshSession.update({
        where: { id: currentSessionId },
        data: { replacedById: created.id },
      });
      return created;
    });
  }

  async revokeSessionByHash(tokenHash: string, reason: string, now: Date): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: now, revokeReason: reason },
    });
  }

  async revokeFamily(familyId: string, reason: string, now: Date): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: now, revokeReason: reason },
    });
  }

  async revokeAllUserSessions(userId: string, reason: string, now: Date): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now, revokeReason: reason },
    });
  }
}
