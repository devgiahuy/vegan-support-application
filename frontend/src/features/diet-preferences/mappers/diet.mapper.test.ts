import { describe, it, expect } from 'vitest';
import { dietMapper } from './diet.mapper';
import { dietImpactMapper } from './diet-impact.mapper';
describe('direct food preference mapping', () => {
  for (let mask = 0; mask < 16; mask++)
    it('preserves independent allowances ' + mask, () => {
      const flags = {
        allowEggs: !!(mask & 1),
        allowDairy: !!(mask & 2),
        allowHoney: !!(mask & 4),
        allowFivePungent: !!(mask & 8),
      };
      const result = dietMapper.toPreferenceModel({
        ...flags,
        dietaryRevision: 3,
        policyVersion: 1,
      });
      for (const [k, value] of Object.entries(flags))
        expect(result[k as keyof typeof flags]).toBe(value);
      expect(result.dietaryRevision).toBe(3);
    });
  it('preserves inactive specific allergy for user correction and filters inactive exclusions', () => {
    const result = dietMapper.toPreferenceModel({
      ingredientAllergies: [
        { ingredientId: 'egg', ingredientName: 'Trứng', ingredientActive: false },
      ],
      ingredientExclusions: [{ ingredientName: 'Tỏi', active: false }],
    });
    expect(result.ingredientAllergies[0].ingredientActive).toBe(false);
    expect(result.ingredientExclusions).toEqual([]);
  });
  it('does not infer a saved profile from a missing revision', () =>
    expect(dietMapper.toPreferenceModel(null).dietaryRevision).toBe(0));
  it('keeps post-save impact unavailable distinct from no affected meals', () =>
    expect(
      dietMapper.toPreferenceModel({ dietaryRevision: 2, impactUnavailable: true })
        .impactUnavailable
    ).toBe(true));
  it('maps unknown compatibility to UNKNOWN', () =>
    expect(dietImpactMapper.compatibility({ status: 'FUTURE_STATUS' }).status).toBe('UNKNOWN'));
  it('maps incomplete nutrition as unknown rather than zero', () => {
    const p = dietImpactMapper.proposal({
      data: { plans: [{ beforeNutrition: { calories: null } }] },
    });
    expect(p.plans[0].beforeNutrition.calories).toBeNull();
  });
});
