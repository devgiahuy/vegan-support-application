import { z } from '../../common/validation/zod.js';
import { createRecipePostRequestSchema } from './content.schemas.js';

export const generateRecipeDraftRequestSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(1).max(500),
    ingredientNames: z.array(z.string().trim().min(1).max(160)).min(1).max(50),
    // Optional author values from step 1 (2026-10-29): amounts are scaled to these servings and
    // the returned draft keeps them instead of the AI's own numbers.
    servings: z.number().int().min(1).max(100).optional(),
    prepTimeMinutes: z.number().int().min(0).max(10_080).optional(),
    cookTimeMinutes: z.number().int().min(0).max(10_080).optional(),
  })
  .strict();

export const recipeDraftSuggestionSchema = z
  .object({
    body: z.string().trim().min(20).max(100_000),
    servings: z.number().int().min(1).max(100),
    prepTimeMinutes: z.number().int().min(0).max(10_080),
    cookTimeMinutes: z.number().int().min(0).max(10_080),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    ingredients: z
      .array(
        z
          .object({
            amount: z.number().positive().max(1_000_000),
            unit: z.string().trim().min(1).max(40),
            optional: z.boolean(),
            confidence: z.number().min(0).max(1),
          })
          .strict(),
      )
      .min(1)
      .max(50),
    steps: z
      .array(
        z
          .object({
            instruction: z.string().trim().min(1).max(5_000),
            durationMinutes: z.number().int().positive().max(10_080).nullable(),
            affectedIngredientPositions: z.array(z.number().int().nonnegative().max(99)).max(50),
          })
          .strict(),
      )
      .min(1)
      .max(100),
    confidence: z.number().min(0).max(1),
    assumptions: z.array(z.string().trim().min(1).max(500)).max(20),
  })
  .strict();

export const generateRecipeDraftEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    draft: createRecipePostRequestSchema,
    ingredientConfidence: z.array(z.number().min(0).max(1)),
    confidence: z.number().min(0).max(1),
    assumptions: z.array(z.string()),
    suggestedTiming: z
      .object({
        servings: z.number().int(),
        prepTimeMinutes: z.number().int(),
        cookTimeMinutes: z.number().int(),
      })
      .describe(
        "The AI's own servings/time suggestion, for display when the author supplied different values.",
      ),
    provenance: z.object({ provider: z.string(), model: z.string(), templateVersion: z.string() }),
  }),
});

export type GenerateRecipeDraftInput = z.infer<typeof generateRecipeDraftRequestSchema>;
export type RecipeDraftSuggestion = z.infer<typeof recipeDraftSuggestionSchema>;
