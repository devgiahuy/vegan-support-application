import type { Request, Response } from 'express';
import { getValidatedBody, getValidatedParams, getValidatedQuery } from '../../common/validation/validate-request.js';
import type { AiGovernanceService } from './ai-governance.service.js';
import type { Capability, GovernanceAuditQuery, GovernanceControlInput, GovernanceFlagQuery, GovernanceListQuery, GovernanceMetricsQuery } from './ai-governance.schemas.js';

export class AiGovernanceController {
  constructor(private readonly service: AiGovernanceService) {}
  requests = async (request: Request, response: Response) => { response.setHeader('Cache-Control', 'private, no-store'); response.json({ success: true, ...await this.service.requests(getValidatedQuery<GovernanceListQuery>(request)) }); };
  metrics = async (request: Request, response: Response) => { response.setHeader('Cache-Control', 'private, no-store'); response.json({ success: true, data: await this.service.metrics(getValidatedQuery<GovernanceMetricsQuery>(request)) }); };
  flags = async (request: Request, response: Response) => { response.setHeader('Cache-Control', 'private, no-store'); response.json({ success: true, ...await this.service.flags(getValidatedQuery<GovernanceFlagQuery>(request)) }); };
  features = async (_request: Request, response: Response) => { response.setHeader('Cache-Control', 'private, no-store'); response.json({ success: true, data: await this.service.features() }); };
  controlAudit = async (request: Request, response: Response) => { response.setHeader('Cache-Control', 'private, no-store'); response.json({ success: true, ...await this.service.controlAudit(getValidatedQuery<GovernanceAuditQuery>(request)) }); };
  setFeature = async (request: Request, response: Response) => { response.setHeader('Cache-Control', 'private, no-store'); response.json({ success: true, data: await this.service.setFeature(getValidatedParams<{ feature: Capability }>(request).feature, request.auth!.userId, getValidatedBody<GovernanceControlInput>(request)) }); };
  health = async (_request: Request, response: Response) => { response.setHeader('Cache-Control', 'private, no-store'); response.json({ success: true, data: await this.service.health() }); };
}
