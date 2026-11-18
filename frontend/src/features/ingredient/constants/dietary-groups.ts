export const DIETARY_GROUP_OPTIONS = [
  { value: 'MEAT', label: 'Thịt và thành phần từ thịt' },
  { value: 'FISH_SEAFOOD', label: 'Cá, hải sản và thành phần từ chúng' },
  { value: 'EGG', label: 'Trứng' },
  { value: 'DAIRY', label: 'Sữa động vật' },
  { value: 'HONEY', label: 'Mật ong' },
  { value: 'FIVE_PUNGENT', label: 'Ngũ vị tân: hành, hẹ, tỏi, kiệu, hưng cừ' },
  { value: 'OTHER_ANIMAL', label: 'Thành phần động vật khác' },
] as const;

export type DietaryFoodGroup = (typeof DIETARY_GROUP_OPTIONS)[number]['value'];

export function dietaryGroupLabel(group: string): string {
  return DIETARY_GROUP_OPTIONS.find((option) => option.value === group)?.label ?? group;
}
