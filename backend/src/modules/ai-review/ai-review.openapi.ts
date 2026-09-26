import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { z } from '../../common/validation/zod.js';
import {
  adminAiVerificationActionSchema,
  aiArtifactEnvelopeSchema,
  aiArtifactParamsSchema,
  aiVerificationEnvelopeSchema,
  aiVerificationParamsSchema,
  createAiArtifactSchema,
  createAiVerificationSchema,
  publicAiArtifactListEnvelopeSchema,
  publicAiArtifactsQuerySchema,
  submitAiArtifactSchema,
  updateAiArtifactVisibilitySchema,
} from './ai-review.schemas.js';

const security = [{ bearerAuth: [] }, { cookieAuth: [] }];
const json = (schema: z.ZodTypeAny) => ({ 'application/json': { schema } });
const errors = (schema: z.ZodTypeAny, statuses: number[]) =>
  Object.fromEntries(statuses.map((status) => [status, { description: 'Business or validation error', content: json(schema) }]));

export function registerAiReviewOpenApi(registry: OpenAPIRegistry, errorSchema: z.ZodTypeAny): void {
  const createRequest = registry.register('CreateAiArtifactRequest', createAiArtifactSchema);
  const visibilityRequest = registry.register('UpdateAiArtifactVisibilityRequest', updateAiArtifactVisibilitySchema);
  const submitRequest = registry.register('SubmitAiArtifactRequest', submitAiArtifactSchema);
  const verificationRequest = registry.register('CreateAiVerificationRequest', createAiVerificationSchema);
  const adminRequest = registry.register('AdminAiVerificationActionRequest', adminAiVerificationActionSchema);
  const artifactResponse = registry.register('AiArtifactResponse', aiArtifactEnvelopeSchema);
  const publicResponse = registry.register('PublicAiArtifactListResponse', publicAiArtifactListEnvelopeSchema);
  const verificationResponse = registry.register('AiVerificationResponse', aiVerificationEnvelopeSchema);

  registry.registerPath({
    method: 'post',
    path: '/api/v1/ai-artifacts',
    tags: ['AI Artifacts'],
    summary: 'Save an immutable eligible AI output as a private draft artifact',
    description: 'Authenticated owners only. Guest chat outputs and outputs owned by another user are ineligible.',
    operationId: 'createAiArtifact',
    security,
    request: { body: { content: json(createRequest) } },
    responses: { 201: { description: 'Saved artifact', content: json(artifactResponse) }, ...errors(errorSchema, [401, 409, 422]) },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/ai-artifacts/{id}/visibility',
    tags: ['AI Artifacts'],
    summary: 'Share or unshare an owned AI artifact',
    description: 'Unsharing immediately removes public visibility without deleting verification history.',
    operationId: 'updateAiArtifactVisibility',
    security,
    request: { params: aiArtifactParamsSchema, body: { content: json(visibilityRequest) } },
    responses: { 200: { description: 'Updated artifact lifecycle', content: json(artifactResponse) }, ...errors(errorSchema, [401, 404, 409, 422]) },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/ai-artifacts/{id}/submit',
    tags: ['AI Artifacts'],
    summary: 'Submit an owned artifact for Contributor verification',
    operationId: 'submitAiArtifact',
    security,
    request: { params: aiArtifactParamsSchema, body: { content: json(submitRequest) } },
    responses: { 200: { description: 'Submitted artifact', content: json(artifactResponse) }, ...errors(errorSchema, [401, 404, 409, 422]) },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/ai-artifacts/public',
    tags: ['AI Artifacts'],
    summary: 'List submitted public AI artifacts using a strict privacy-safe allowlist',
    operationId: 'listPublicAiArtifacts',
    request: { query: publicAiArtifactsQuerySchema },
    responses: { 200: { description: 'Public artifact page', content: json(publicResponse) }, ...errors(errorSchema, [422]) },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/ai-artifacts/{id}/verifications',
    tags: ['AI Verification'],
    summary: 'Verify a submitted public artifact',
    description: 'Any active approved Contributor or Admin may verify; approval basis is never consulted and self-review is forbidden.',
    operationId: 'createAiVerification',
    security,
    request: { params: aiArtifactParamsSchema, body: { content: json(verificationRequest) } },
    responses: { 201: { description: 'Immutable verification audit record', content: json(verificationResponse) }, ...errors(errorSchema, [401, 403, 404, 409, 422]) },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/ai-verifications/{id}',
    tags: ['AI Verification Admin'],
    summary: 'Override or revoke an active verification with an audit reason',
    description: 'Override creates a replacement record; revoke and override retain the original verification audit.',
    operationId: 'adminUpdateAiVerification',
    security,
    request: { params: aiVerificationParamsSchema, body: { content: json(adminRequest) } },
    responses: { 200: { description: 'Updated verification audit state', content: json(verificationResponse) }, ...errors(errorSchema, [401, 403, 404, 409, 422]) },
  });
}
