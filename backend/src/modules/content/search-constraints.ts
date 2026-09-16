import { PracticeSchedule, type DietPattern } from '@prisma/client';
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
      allergenCodes: [],
      excludedIngredientIds: [],
      excludedNormalizedNames: [],
      traditions: [],
      requireResolvedIngredients: false,
    },
    summary: {
      authenticated: false,
      dietPattern: requestedDietPattern ?? null,
      allergyCount: 0,
      ingredientExclusionCount: 0,
      traditions: [],
      forDate,
    },
  };
}

export function buildAuthenticatedSearchConstraints(
  profile: SearchProfileRecord | null,
  requestedDietPattern: DietPattern | undefined,
  forDate: string,
): SearchConstraintContext {
  const preference = profile?.dietPreference;
  const scheduleApplies =
    preference?.practiceSchedule === PracticeSchedule.PERMANENT ||
    (preference?.practiceSchedule === PracticeSchedule.PERIODIC &&
      profile?.dietScheduleDates.some(
        (scheduleDate) => scheduleDate.date.toISOString().slice(0, 10) === forDate,
      ));
  const traditions = scheduleApplies
    ? [
        ...new Set(
          profile?.dietPreferenceRules.flatMap(({ ruleDefinition }) =>
            ruleDefinition.active && ruleDefinition.hardConstraint && ruleDefinition.tradition
              ? [ruleDefinition.tradition]
              : [],
          ) ?? [],
        ),
      ]
    : [];
  const allergenCodes = profile?.allergies.map((allergy) => allergy.allergenCode) ?? [];
  const exclusions = profile?.ingredientExclusions ?? [];
  const excludedIngredientIds = exclusions.flatMap((exclusion) =>
    exclusion.ingredientId ? [exclusion.ingredientId] : [],
  );
  const excludedNormalizedNames = exclusions.map((exclusion) => exclusion.normalizedName);
  const dietPattern = preference?.dietPattern ?? requestedDietPattern;
  const requireResolvedIngredients = Boolean(
    dietPattern || allergenCodes.length || exclusions.length || traditions.length,
  );
  return {
    constraints: {
      ...(dietPattern ? { dietPattern } : {}),
      allergenCodes,
      excludedIngredientIds,
      excludedNormalizedNames,
      traditions,
      requireResolvedIngredients,
    },
    summary: {
      authenticated: true,
      dietPattern: dietPattern ?? null,
      allergyCount: allergenCodes.length,
      ingredientExclusionCount: exclusions.length,
      traditions,
      forDate,
    },
  };
}
