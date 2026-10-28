/** `GET /allergens` item (đồng bộ backend `AllergenCatalogResponse`). */
export interface AllergenCatalogItemDto {
  code?: string;
  label?: string;
  description?: string | null;
  searchTerms?: (string | null)[] | null;
}

export interface AllergenCatalogResponseDto {
  success?: boolean;
  data?: (AllergenCatalogItemDto | null)[] | null;
  meta?: null;
}
