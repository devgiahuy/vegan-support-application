import type { Request, Response } from 'express';
import { getValidatedBody } from '../../common/validation/validate-request.js';
import type { RecipeDraftService } from './recipe-draft.service.js';
import type { GenerateRecipeDraftInput } from './recipe-draft.schemas.js';
import { generateRecipeDraftEnvelopeSchema } from './recipe-draft.schemas.js';

export class RecipeDraftController {
  constructor(private readonly service: RecipeDraftService) {}

  generate = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.generate(getValidatedBody<GenerateRecipeDraftInput>(request));
    response
      .status(200)
      .json(generateRecipeDraftEnvelopeSchema.parse({ success: true, data: result }));
  };
}
