import { createHash, randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { errors, jwtVerify, SignJWT } from 'jose';
import { z } from '../../common/validation/zod.js';
import type { AppConfig } from '../../config/env.js';

export const CHAT_GUEST_COOKIE = 'chatGuest';

const guestTokenSchema = z.object({ sub: z.string().uuid(), type: z.literal('chat_guest') });

export type ChatIdentity =
  | {
      type: 'AUTHENTICATED';
      userId: string;
      role: NonNullable<Request['auth']>['role'];
      subjectKey: string;
    }
  | {
      type: 'GUEST';
      guestIdHash: string;
      subjectKey: string;
      networkKey: string;
    };

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function cookieValue(request: Request): string | null {
  const cookies: unknown = request.cookies as unknown;
  if (!cookies || typeof cookies !== 'object' || !(CHAT_GUEST_COOKIE in cookies)) return null;
  const token = cookies[CHAT_GUEST_COOKIE];
  return typeof token === 'string' && token ? token : null;
}

export class ChatIdentityService {
  private readonly secret: Uint8Array;

  constructor(private readonly config: AppConfig) {
    this.secret = new TextEncoder().encode(config.ai.guestCookieSecret);
  }

  async resolve(request: Request, response: Response): Promise<ChatIdentity> {
    if (request.auth) {
      return {
        type: 'AUTHENTICATED',
        userId: request.auth.userId,
        role: request.auth.role,
        subjectKey: sha256(`user:${request.auth.userId}`),
      };
    }

    const existing = cookieValue(request);
    const guestId = existing ? await this.verify(existing) : null;
    const resolvedGuestId = guestId ?? randomUUID();
    if (!guestId) {
      response.cookie(CHAT_GUEST_COOKIE, await this.issue(resolvedGuestId), {
        httpOnly: true,
        secure: this.config.cookieSecure,
        sameSite: 'lax',
        path: '/api/v1/chat',
        maxAge: this.config.ai.guestCookieTtlDays * 86_400_000,
      });
    }
    const guestIdHash = sha256(`guest:${resolvedGuestId}`);
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const userAgent = request.header('user-agent')?.slice(0, 300) || 'unknown';
    return {
      type: 'GUEST',
      guestIdHash,
      subjectKey: guestIdHash,
      networkKey: sha256(`network:${ip}:${userAgent}`),
    };
  }

  private async issue(guestId: string): Promise<string> {
    const now = Math.floor(Date.now() / 1_000);
    return new SignJWT({ type: 'chat_guest' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(guestId)
      .setIssuer(this.config.jwtIssuer)
      .setAudience(`${this.config.jwtAudience}:chat-guest`)
      .setIssuedAt(now)
      .setExpirationTime(now + this.config.ai.guestCookieTtlDays * 86_400)
      .sign(this.secret);
  }

  private async verify(token: string): Promise<string | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        algorithms: ['HS256'],
        issuer: this.config.jwtIssuer,
        audience: `${this.config.jwtAudience}:chat-guest`,
      });
      return guestTokenSchema.parse(payload).sub;
    } catch (error) {
      if (error instanceof errors.JOSEError || error instanceof z.ZodError) return null;
      return null;
    }
  }
}
