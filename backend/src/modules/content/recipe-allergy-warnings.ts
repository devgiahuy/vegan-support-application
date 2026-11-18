import type { IngredientSafetyCatalog } from '../catalog/ingredient-safety.js';

interface AllergyProfile {
  allergies: Array<{ allergenCode: string; label: string | null }>;
  ingredientAllergies: Array<{
    ingredientId: string;
    ingredient: { canonicalName: string };
  }>;
}

export interface RecipeAllergyWarning {
  kind: 'ALLERGEN' | 'INGREDIENT';
  identifier: string;
  label: string;
  ingredientNames: string[];
}

/** Positive canonical matches only. Missing composition is not evidence of compatibility. */
export function recipeAllergyWarnings(
  ingredients: Array<{ ingredientId: string | null; displayName: string }>,
  snapshotAllergens: string[],
  profile: AllergyProfile,
  catalog: IngredientSafetyCatalog,
): RecipeAllergyWarning[] {
  const warnings = new Map<string, RecipeAllergyWarning>();
  const add = (
    kind: RecipeAllergyWarning['kind'],
    identifier: string,
    label: string,
    name?: string,
  ) => {
    const key = `${kind}:${identifier}`;
    const warning = warnings.get(key) ?? { kind, identifier, label, ingredientNames: [] };
    if (name && !warning.ingredientNames.includes(name)) warning.ingredientNames.push(name);
    warnings.set(key, warning);
  };
  for (const allergy of profile.allergies) {
    if (snapshotAllergens.includes(allergy.allergenCode))
      add('ALLERGEN', allergy.allergenCode, allergy.label ?? allergy.allergenCode);
  }
  for (const ingredient of ingredients) {
    if (!ingredient.ingredientId) continue;
    const { nodes } = catalog.closure(ingredient.ingredientId);
    for (const allergy of profile.allergies) {
      if (
        nodes.some((node) =>
          node.allergens.some((link) => link.allergenCode === allergy.allergenCode),
        )
      )
        add(
          'ALLERGEN',
          allergy.allergenCode,
          allergy.label ?? allergy.allergenCode,
          ingredient.displayName,
        );
    }
    for (const allergy of profile.ingredientAllergies) {
      if (
        ingredient.ingredientId === allergy.ingredientId ||
        nodes.some((node) => node.id === allergy.ingredientId)
      )
        add(
          'INGREDIENT',
          allergy.ingredientId,
          allergy.ingredient.canonicalName,
          ingredient.displayName,
        );
    }
  }
  return [...warnings.values()].sort((a, b) =>
    `${a.kind}:${a.identifier}`.localeCompare(`${b.kind}:${b.identifier}`),
  );
}
