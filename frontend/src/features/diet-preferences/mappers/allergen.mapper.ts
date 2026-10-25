import { BaseMapper, pickField, safeArray, safeString } from '@/lib/mapper';
import type { AllergenDto, AllergenCatalogResponseDto } from '../types/allergen.dto';
import type { AllergenOption } from '../types/allergen.model';

export class AllergenMapper extends BaseMapper<AllergenDto, AllergenOption> {
  toModel(dto: AllergenDto | null | undefined): AllergenOption {
    return {
      code: safeString(pickField(dto, ['code'], '')),
      label: safeString(pickField(dto, ['label'], '')),
      description: safeString(pickField(dto, ['description'], '')),
      searchTerms: safeArray<unknown>(pickField(dto, ['searchTerms'], []))
        .map((value) => safeString(value))
        .filter(Boolean),
    };
  }
  catalog(dto: AllergenCatalogResponseDto): AllergenOption[] {
    return safeArray<AllergenDto>(pickField(dto, ['data'], []))
      .map((item) => this.toModel(item))
      .filter((item) => item.code && item.label);
  }
}
export const allergenMapper = new AllergenMapper();
