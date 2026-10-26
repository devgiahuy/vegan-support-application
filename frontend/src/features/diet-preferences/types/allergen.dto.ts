export interface AllergenDto {
  code?: string;
  label?: string;
  description?: string | null;
  searchTerms?: string[] | null;
}
export interface AllergenCatalogResponseDto {
  success?: boolean;
  data?: AllergenDto[] | null;
}
