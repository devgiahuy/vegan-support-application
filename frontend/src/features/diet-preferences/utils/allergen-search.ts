import type { AllergenOption } from '../types/allergen.model';

export function normalizeAllergenSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function editDistance(a: string, b: string): number {
  let row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 0; i < a.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < b.length; j++)
      next.push(Math.min(next[j]! + 1, row[j + 1]! + 1, row[j]! + (a[i] === b[j] ? 0 : 1)));
    row = next;
  }
  return row[b.length]!;
}

export function searchAllergens(options: AllergenOption[], rawQuery: string) {
  const query = normalizeAllergenSearch(rawQuery).slice(0, 160);
  const names = (item: AllergenOption) =>
    [item.label, ...item.searchTerms].map(normalizeAllergenSearch);
  const exact = options.filter((item) => names(item).some((name) => name.includes(query)));
  if (exact.length || query.length < 4) return { items: exact, suggested: false };
  const distance = query.length < 8 ? 1 : 2;
  return {
    items: options.filter((item) =>
      names(item).some(
        (name) =>
          Math.abs(name.length - query.length) <= distance && editDistance(query, name) <= distance
      )
    ),
    suggested: true,
  };
}
