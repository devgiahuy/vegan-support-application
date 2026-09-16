import { ContributorApplicationStatus, ContributorType, Role, UserStatus } from '@prisma/client';
import { z } from '../../common/validation/zod.js';

export const contributorRequestSchema = z
  .object({
    requestedType: z.enum(ContributorType),
    experience: z.string().trim().min(20).max(2_000),
    referenceLinks: z.array(z.string().url()).max(5).default([]),
  })
  .strict();

export const registerRequestSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(320),
    password: z.string().min(8).max(128),
    displayName: z.string().trim().min(2).max(100),
    contributorRequest: contributorRequestSchema.optional(),
  })
  .strict();

export const loginRequestSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(320),
    password: z.string().min(1).max(128),
  })
  .strict();

export const logoutRequestSchema = z
  .object({ allDevices: z.boolean().default(false) })
  .strict()
  .default({ allDevices: false });

export const contributorApplicationSummarySchema = z
  .object({
    status: z.enum(ContributorApplicationStatus),
    requestedType: z.enum(ContributorType),
  })
  .strict();

export const contributorProfileSummarySchema = z
  .object({
    contributorType: z.enum(ContributorType),
    label: z.string(),
    approvalBasis: z.string(),
    approvedAt: z.string().datetime(),
  })
  .strict();

export const userResponseSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string(),
    avatarUrl: z.string().url().nullable(),
    role: z.enum(Role),
    status: z.enum(UserStatus),
    createdAt: z.string().datetime(),
    contributorApplication: contributorApplicationSummarySchema.nullable(),
    contributorProfile: contributorProfileSummarySchema.nullable(),
  })
  .strict();

export const authSessionDataSchema = z
  .object({
    user: userResponseSchema,
    accessToken: z.string().min(1),
    accessTokenExpiresAt: z.string().datetime(),
  })
  .strict();

export const authSessionResponseSchema = z
  .object({ success: z.literal(true), data: authSessionDataSchema, meta: z.null() })
  .strict();

export const refreshDataSchema = z
  .object({
    accessToken: z.string().min(1),
    accessTokenExpiresAt: z.string().datetime(),
  })
  .strict();

export const refreshResponseSchema = z
  .object({ success: z.literal(true), data: refreshDataSchema, meta: z.null() })
  .strict();

export const logoutResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({ loggedOut: z.literal(true), scope: z.enum(['CURRENT', 'ALL_DEVICES']) })
      .strict(),
    meta: z.null(),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerRequestSchema>;
export type LoginInput = z.infer<typeof loginRequestSchema>;
export type LogoutInput = z.infer<typeof logoutRequestSchema>;
export type PublicUser = z.infer<typeof userResponseSchema>;
