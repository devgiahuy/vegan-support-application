import { describe, expect, it } from 'vitest';
import { DietPattern } from '@/common/enums';
import { restaurantMapper } from '../mappers/restaurant.mapper';
import type { RestaurantSearchState } from '../types/restaurant.model';
import { restaurantRefreshScope, retainRestaurantResults } from './restaurant.queries';

const base: RestaurantSearchState = {
  mode: 'NEARBY',
  radiusM: 5000,
  query: '',
  advanced: {},
  lat: 10.77,
  lng: 106.69,
};
const result = restaurantMapper.toDiscoveryModel([], { page: 1, limit: 20, total: 0 });

describe('restaurant refresh data boundary', () => {
  it('retains current results while changing keyword/page in the same search location', () => {
    const oldScope = restaurantRefreshScope(base, 'member-a');
    const newScope = restaurantRefreshScope(
      { ...base, mode: 'KEYWORD', query: 'Đậu', page: 2 },
      'member-a'
    );
    expect(retainRestaurantResults(newScope)(result, { queryKey: ['restaurants', oldScope] })).toBe(
      result
    );
  });

  it('never carries previous-account results to another account or guest', () => {
    const scope = restaurantRefreshScope(base, 'member-a');
    for (const identity of ['guest', 'member-b']) {
      expect(
        retainRestaurantResults(restaurantRefreshScope(base, identity))(result, {
          queryKey: [scope],
        })
      ).toBeUndefined();
    }
  });

  it('drops old pins when changing location or selecting an explicit diet filter', () => {
    const scope = restaurantRefreshScope(base, 'guest');
    for (const state of [
      { ...base, lat: 21.03 },
      { ...base, dietPattern: DietPattern.VEGAN },
    ]) {
      expect(
        retainRestaurantResults(restaurantRefreshScope(state, 'guest'))(result, {
          queryKey: [scope],
        })
      ).toBeUndefined();
    }
    expect(retainRestaurantResults(scope)(undefined, undefined)).toBeUndefined();
  });
});
