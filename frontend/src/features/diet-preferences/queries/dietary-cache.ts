import { useQueryClient } from '@tanstack/react-query';

/** Every server-state family whose result depends on the active dietary profile. */
export const DIETARY_DEPENDENT_KEYS = [
  'diet',
  'dietary-impact',
  'dietary-repair',
  'profile',
  'recipes',
  'recipe',
  'posts',
  'recommendations',
  'recommendation',
  'meal-plans',
  'meal-programs',
  'meal-analysis',
  'shopping-gap',
  'shopping-lists',
] as const;

export function useInvalidateDietaryState() {
  const client = useQueryClient();
  return async () => {
    await Promise.all(
      DIETARY_DEPENDENT_KEYS.map((key) => client.invalidateQueries({ queryKey: [key] }))
    );
  };
}
