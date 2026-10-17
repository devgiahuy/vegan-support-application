/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { countActiveAdvancedFilters, sanitizeAdvancedFilters, validateAdvancedFilters } from './restaurant-filters';

test('sanitizeAdvancedFilters keeps only values inside the backend contract', () => {
  assert.deepEqual(sanitizeAdvancedFilters(undefined), {});
  assert.deepEqual(
    sanitizeAdvancedFilters({
      minPrice: 1,
      maxPrice: 3,
      minRating: 4,
      openState: 'now',
      openOnDay: 'sat',
      openAtHour: 18,
    }),
    { minPrice: 1, maxPrice: 3, minRating: 4, openState: 'now', openOnDay: 'sat', openAtHour: 18 }
  );
  assert.deepEqual(
    sanitizeAdvancedFilters({
      minPrice: 5,
      maxPrice: -1,
      minRating: 1.5,
      openAtHour: 24,
      openOnDay: 'xyz' as never,
      openState: 'later' as never,
    }),
    {}
  );
  // Price 0 is a valid level and must not be dropped as falsy.
  assert.deepEqual(sanitizeAdvancedFilters({ minPrice: 0, openAtHour: 0 }), { minPrice: 0, openAtHour: 0 });
});

test('countActiveAdvancedFilters counts only valid active filters', () => {
  assert.equal(countActiveAdvancedFilters({}), 0);
  assert.equal(countActiveAdvancedFilters(null), 0);
  assert.equal(countActiveAdvancedFilters({ minPrice: 0, minRating: 3 }), 2);
  assert.equal(countActiveAdvancedFilters({ minPrice: 9 }), 0);
});

test('validateAdvancedFilters rejects a minimum price above the maximum price', () => {
  assert.equal(validateAdvancedFilters({ minPrice: 3, maxPrice: 1 }) !== null, true);
  assert.equal(validateAdvancedFilters({ minPrice: 1, maxPrice: 1 }), null);
  assert.equal(validateAdvancedFilters({ minPrice: 2 }), null);
});
