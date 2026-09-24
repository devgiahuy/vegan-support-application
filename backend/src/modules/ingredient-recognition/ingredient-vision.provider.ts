import { z } from '../../common/validation/zod.js';
import type { AppConfig } from '../../config/env.js';

const visionCandidateSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    quantity: z.number().positive().max(999_999_999).nullable(),
    unit: z.string().trim().min(1).max(40).nullable(),
    freshnessObservation: z.string().trim().min(1).max(1000).nullable(),
    confidence: z.number().min(0).max(1),
    uncertaintyNote: z.string().trim().min(1).max(500).nullable(),
  })
  .strict();

const visionImageResultSchema = z
  .object({
    inputId: z.string().uuid(),
    candidates: z.array(visionCandidateSchema).max(100),
    error: z
      .object({ code: z.string().trim().min(1).max(100), message: z.string().trim().min(1).max(500) })
      .strict()
      .nullable(),
  })
  .strict();

const visionResultSchema = z.array(visionImageResultSchema);

export interface VisionInput {
  id: string;
  position: number;
  url: string;
}

export type VisionImageResult = z.infer<typeof visionImageResultSchema>;

export interface IngredientVisionProvider {
  readonly name: string;
  readonly model: string;
  readonly templateVersion: string;
  recognize(inputs: readonly VisionInput[]): Promise<VisionImageResult[]>;
}

export class FakeIngredientVisionProvider implements IngredientVisionProvider {
  readonly name = 'fake-local';

  constructor(
    readonly model: string,
    readonly templateVersion: string,
  ) {}

  recognize(inputs: readonly VisionInput[]): Promise<VisionImageResult[]> {
    const raw = inputs.map((input) => {
      if (input.url.includes('partial-failure')) {
        return {
          inputId: input.id,
          candidates: [],
          error: {
            code: 'IMAGE_PROCESSING_FAILED',
            message: 'One image could not be analyzed; other image results remain available.',
          },
        };
      }
      if (input.position % 2 === 0) {
        return {
          inputId: input.id,
          candidates: [
            {
              name: 'dau hu',
              quantity: 120,
              unit: 'g',
              freshnessObservation: 'The surface appears slightly dry in the image; check it yourself before use.',
              confidence: 0.92,
              uncertaintyNote: 'Quantity is estimated from visible size.',
            },
            {
              name: 'apple',
              quantity: 2,
              unit: 'quáº£',
              freshnessObservation: 'No clear visual anomaly is visible in the image.',
              confidence: 0.48,
              uncertaintyNote: 'Part of the item is obscured.',
            },
          ],
          error: null,
        };
      }
      return {
        inputId: input.id,
        candidates: [
          {
            name: 'dau hu',
            quantity: 80,
            unit: 'g',
            freshnessObservation: 'Color may be affected by lighting.',
            confidence: 0.84,
            uncertaintyNote: 'This may be the same tofu shown in another image.',
          },
          {
            name: 'unknown leafy vegetable',
            quantity: null,
            unit: null,
            freshnessObservation: null,
            confidence: 0.31,
            uncertaintyNote: 'There are not enough visible details for a canonical ingredient suggestion.',
          },
        ],
        error: null,
      };
    });
    return Promise.resolve(visionResultSchema.parse(raw));
  }
}

export function createIngredientVisionProvider(config: AppConfig): IngredientVisionProvider {
  return new FakeIngredientVisionProvider(config.vision.model, config.vision.templateVersion);
}
