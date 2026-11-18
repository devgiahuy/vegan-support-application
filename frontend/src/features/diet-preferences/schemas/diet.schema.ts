import { z } from 'zod';
export const dietSelectionSchema = z.object({
  allowEggs: z.boolean(),
  allowDairy: z.boolean(),
  allowHoney: z.boolean(),
  allowFivePungent: z.boolean(),
});
export type DietSelectionValues = z.infer<typeof dietSelectionSchema>;
