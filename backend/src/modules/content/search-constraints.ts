import { DietaryFoodGroup, type DietPattern } from '@prisma/client';
import type { AppliedSearchConstraintsOutput } from './content.schemas.js';
import type { SearchConstraints, SearchProfileRecord } from './content.repository.js';

const SEARCH_TIMEZONE = 'Asia/Ho_Chi_Minh' as const;

export interface SearchConstraintContext {
  constraints: SearchConstraints;
  summary: AppliedSearchConstraintsOutput;
}

export function dateOnlyInSearchTimezone(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SEARCH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function buildGuestSearchConstraints(
  requestedDietPattern: DietPattern | undefined,
  forDate: string,
): SearchConstraintContext {
  return {
    constraints: {
      ...(requestedDietPattern ? { dietPattern: requestedDietPattern } : {}),
      ...(requestedDietPattern
        ? { blockedFoodGroups: explicitPatternGroups(requestedDietPattern) }
        : {}),
      allergenCodes: [],
      excludedIngredientIds: [],
      excludedNormalizedNames: [],
      traditions: [],
      requireResolvedIngredients: Boolean(requestedDietPattern),
    },
    summary: {
      authenticated: false,
      dietPattern: requestedDietPattern ?? null,
      allergyCount: 0,
      ingredientExclusionCount: 0,
      foodGroups: requestedDietPattern ? explicitPatternGroups(requestedDietPattern) : [],
      dietaryRevision: null,
      forDate,
    },
  };
}

export interface DietarySelection {
  allowEggs: boolean;
  allowDairy: boolean;
  allowHoney: boolean;
  allowFivePungent: boolean;
}
export interface DietaryRestrictions {
  allergenCodes: string[];
  allergicIngredientIds: string[];
  excludedIngredientIds: string[];
  excludedNormalizedNames: string[];
}
export function buildDietaryConstraints(
  selection: DietarySelection,
  restrictions: DietaryRestrictions,
): SearchConstraints {
  const blockedFoodGroups: DietaryFoodGroup[] = [
    DietaryFoodGroup.MEAT,
    DietaryFoodGroup.FISH_SEAFOOD,
    DietaryFoodGroup.OTHER_ANIMAL,
  ];
  if (!selection.allowEggs) blockedFoodGroups.push(DietaryFoodGroup.EGG);
  if (!selection.allowDairy) blockedFoodGroups.push(DietaryFoodGroup.DAIRY);
  if (!selection.allowHoney) blockedFoodGroups.push(DietaryFoodGroup.HONEY);
  if (!selection.allowFivePungent) blockedFoodGroups.push(DietaryFoodGroup.FIVE_PUNGENT);
  return { ...restrictions, blockedFoodGroups, traditions: [], requireResolvedIngredients: true };
}

function explicitPatternGroups(pattern: DietPattern): DietaryFoodGroup[] {
  return (
    buildDietaryConstraints(
      {
        allowEggs: pattern !== 'VEGAN',
        allowDairy: pattern !== 'VEGAN',
        allowHoney: pattern !== 'VEGAN',
        allowFivePungent: true,
      },
      {
        allergenCodes: [],
        allergicIngredientIds: [],
        excludedIngredientIds: [],
        excludedNormalizedNames: [],
      },
    ).blockedFoodGroups ?? []
  );
}
export function buildAuthenticatedSearchConstraints(
  profile: SearchProfileRecord | null,
  requestedDietPattern: DietPattern | undefined,
  forDate: string,
): SearchConstraintContext {
  const preference = profile?.dietPreference;
  const restrictions = {
    allergenCodes: profile?.allergies.map((a) => a.allergenCode) ?? [],
    allergicIngredientIds: profile?.ingredientAllergies?.map((a) => a.ingredientId) ?? [],
    excludedIngredientIds:
      profile?.ingredientExclusions.flatMap((e) => (e.ingredientId ? [e.ingredientId] : [])) ?? [],
    excludedNormalizedNames: profile?.ingredientExclusions.map((e) => e.normalizedName) ?? [],
  };
  const constraints: SearchConstraints = preference
    ? buildDietaryConstraints(preference, restrictions)
    : {
        ...restrictions,
        traditions: [],
        requireResolvedIngredients: Boolean(
          requestedDietPattern ||
          restrictions.allergenCodes.length ||
          restrictions.allergicIngredientIds.length ||
          restrictions.excludedIngredientIds.length ||
          restrictions.excludedNormalizedNames.length,
        ),
      };
  if (requestedDietPattern) {
    constraints.dietPattern = requestedDietPattern;
    constraints.blockedFoodGroups = [
      ...new Set([
        ...(constraints.blockedFoodGroups ?? []),
        ...explicitPatternGroups(requestedDietPattern),
      ]),
    ];
  }
  return {
    constraints,
    summary: {
      authenticated: true,
      dietPattern: requestedDietPattern ?? null,
      allergyCount: restrictions.allergenCodes.length + restrictions.allergicIngredientIds.length,
      ingredientExclusionCount: profile?.ingredientExclusions.length ?? 0,
      foodGroups: constraints.blockedFoodGroups ?? [],
      dietaryRevision: preference?.dietaryRevision ?? null,
      forDate,
    },
  };
}
