import { BaseMapper, pickField, safeArray, safeString } from '@/lib/mapper';
import type { AllergenCatalogItemDto, AllergenCatalogResponseDto } from '../types/allergen.dto';
import type { AllergenOption } from '../types/allergen.model';

export class AllergenMapper extends BaseMapper<AllergenCatalogItemDto, AllergenOption> {
  toModel(dto: AllergenCatalogItemDto | null | undefined): AllergenOption {
    const description = pickField<string | null>(dto, ['description'], null);
    return {
      code: safeString(pickField(dto, ['code'], '')),
      label: safeString(pickField(dto, ['label'], '')),
      description: typeof description === 'string' && description.length > 0 ? description : null,
      searchTerms: safeArray<unknown, string>(pickField(dto, ['searchTerms'], null), (term) =>
        typeof term === 'string' ? term : ''
      ).filter((term) => term.length > 0),
    };
  }

  toCatalogModel(dto: AllergenCatalogResponseDto | null | undefined): AllergenOption[] {
    return this.toModelList(pickField<(AllergenCatalogItemDto | null)[] | null>(dto, ['data'], null)).filter(
      (item) => item.code.length > 0 && item.label.length > 0
    );
  }
}

export const allergenMapper = new AllergenMapper();
