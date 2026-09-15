import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Role } from '@prisma/client';
import { errors, jwtVerify, SignJWT } from 'jose';
import { z } from '../../common/validation/zod.js';
import type { AppConfig } from '../../config/env.js';

const accessTokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  role: z.enum(Role),
  type: z.literal('access'),
});

export class ExpiredAccessTokenError extends Error {}
export class InvalidAccessTokenError extends Error {}

export interface AccessTokenResult {
  token: string;
  expiresAt: Date;
}

export class TokenService {
  private readonly secret: Uint8Array;

  constructor(private readonly config: AppConfig) {
    this.secret = new TextEncoder().encode(config.jwtAccessSecret);
  }

  async issueAccessToken(user: { id: string; role: Role }): Promise<AccessTokenResult> {
    const issuedAt = Math.floor(Date.now() / 1_000);
    const expiresAtSeconds = issuedAt + this.config.accessTokenTtlSeconds;
    const token = await new SignJWT({ role: user.role, type: 'access' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(user.id)
      .setIssuer(this.config.jwtIssuer)
      .setAudience(this.config.jwtAudience)
      .setJti(randomUUID())
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiresAtSeconds)
      .sign(this.secret);

    return { token, expiresAt: new Date(expiresAtSeconds * 1_000) };
  }

  async verifyAccessToken(token: string): Promise<{ userId: string; role: Role }> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        algorithms: ['HS256'],
        issuer: this.config.jwtIssuer,
        audience: this.config.jwtAudience,
      });
      const parsed = accessTokenPayloadSchema.parse(payload);
      return { userId: parsed.sub, role: parsed.role };
    } catch (error) {
      if (error instanceof errors.JWTExpired) throw new ExpiredAccessTokenError();
      throw new InvalidAccessTokenError();
    }
  }

  createRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }
}
