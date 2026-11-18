export const DIETARY_GROUP_LABELS: Readonly<Record<string, string>> = {
  MEAT: 'Thịt và thành phần từ thịt',
  FISH_SEAFOOD: 'Cá, hải sản và thành phần liên quan',
  EGG: 'Trứng',
  DAIRY: 'Sữa động vật và chế phẩm từ sữa',
  HONEY: 'Mật ong',
  FIVE_PUNGENT: 'Ngũ vị tân (hành, hẹ, tỏi, kiệu, hưng cừ)',
  OTHER_ANIMAL: 'Thành phần động vật khác',
};

export function dietaryGroupLabel(code: string): string {
  return DIETARY_GROUP_LABELS[code] ?? 'Nhóm thực phẩm cần được kiểm tra';
}
