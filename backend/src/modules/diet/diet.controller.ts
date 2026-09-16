import type { Request, Response } from 'express';
import { getValidatedBody } from '../../common/validation/validate-request.js';
import {
  dietRulePreviewResponseSchema,
  type DietRuleSelectionInput,
} from '../profile/profile.schemas.js';
import type { ProfileService } from '../profile/profile.service.js';

export class DietController {
  constructor(private readonly service: ProfileService) {}

  previewRules = async (request: Request, response: Response): Promise<void> => {
    const preview = await this.service.previewDietRules(
      getValidatedBody<DietRuleSelectionInput>(request),
    );
    response
      .status(200)
      .json(dietRulePreviewResponseSchema.parse({ success: true, data: preview, meta: null }));
  };
}
