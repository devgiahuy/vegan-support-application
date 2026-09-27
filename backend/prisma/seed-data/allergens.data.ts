export interface AllergenItem {
  code: string;
  label: string;
  description?: string;
}

export const allergenDefinitions: readonly AllergenItem[] = [
  { code: 'SOY', label: 'Đậu nành', description: 'Đậu nành, đậu hũ, tương, chao, tempeh, dầu đậu nành' },
  { code: 'PEANUT', label: 'Đậu phộng (lạc)', description: 'Đậu phộng, bơ đậu phộng, dầu đậu phộng' },
  { code: 'TREE_NUT', label: 'Hạt cây (Tree nuts)', description: 'Hạt điều, hạt óc chó, hạnh nhân, hạt dẻ cười, macadamia' },
  { code: 'GLUTEN', label: 'Gluten', description: 'Lúa mì, lúa mạch, mì căn, bánh mì, mì sợi, bột mì' },
  { code: 'SESAME', label: 'Mè (vừng)', description: 'Mè trắng, mè đen, dầu mè nguyên chất, sốt tahini' },
  { code: 'MILK', label: 'Sữa bò / Chế phẩm sữa', description: 'Sữa bò, bơ động vật, phô mai, sữa chua từ sữa động vật' },
  { code: 'EGG', label: 'Trứng gia cầm', description: 'Trứng gà, trứng vịt, lòng trắng, sốt mayonnaise truyền thống' },
  { code: 'CELERY', label: 'Cần tây', description: 'Rau cần tây, hạt cần tây, bột gia vị cần tây' },
  { code: 'MUSTARD', label: 'Mù tạt', description: 'Hạt mù tạt, bột mù tạt, sốt mù tạt vàng/xanh' },
  { code: 'SULFITES', label: 'Sulfite', description: 'Chất bảo quản sulfite thường có trong trái cây khô, đồ lên men' },
] as const;
